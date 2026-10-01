/* ============================================================
   지오엑스-세계의 기후 — chapters/part5-sims2.js
   PART 5 시뮬레이터 2차 (2026-09-30) — 각 챕터 「경관 탐험」 다음에 끼워 넣음
   5-1 화전 농업의 순환 · 5-2 초원의 유목 · 5-3 세 온대의 농업 달력 · 5-4 시베리아 강의 봄 홍수
   5-5 북극 바다 얼음 · 5-6 높이 올라가면
   수치는 설명용 예시 값 · 근사값(화면에 표시), 월별 기온 · 강수량은 data/cities.js 평년값
   ============================================================ */
"use strict";

(function () {
  const C = function (id) { return CITY_BY_ID[id]; };
  const K = P2F.kit;
  const MON = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  const clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  const f1 = function (v) { return Math.round(v * 10) / 10; };
  const deg = function (v) { return (v < 0 ? "−" : "") + Math.abs(f1(v)).toFixed(1) + "℃"; };
  function big(l, v, s, tone) { return '<div class="p2-big' + (tone ? " " + tone : "") + '"><span class="p2-big-l">' + l + '</span><span class="p2-big-v">' + v + '</span>' + (s ? '<span class="p2-big-s">' + s + '</span>' : "") + '</div>'; }
  function seg(name, items, on) {
    return '<div class="p4-seg" role="group" data-seg="' + name + '">' + items.map(function (it, i) { return '<button type="button" class="p4-sb' + (i === on ? " on" : "") + '" data-i="' + i + '">' + it + '</button>'; }).join("") + '</div>';
  }
  function bindSeg(el, name, fn) {
    el.querySelector('[data-seg="' + name + '"]').addEventListener("click", function (e) {
      const b = e.target.closest(".p4-sb"); if (!b) return;
      this.querySelectorAll(".p4-sb").forEach(function (x) { x.classList.toggle("on", x === b); });
      fn(+b.getAttribute("data-i"));
    });
  }
  function insertAfterPrefix(ch, prefix, block) {
    const bl = CHAPTER_CONTENT[ch].blocks, i = bl.findIndex(function (b) { return b.title.indexOf(prefix) === 0; });
    bl.splice(i < 0 ? 2 : i + 1, 0, block);
  }
  function svgOpen(w, h, label, cls) { return '<svg class="p2-svg ' + cls + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '">'; }
  function layer(on, inner, cls) { return '<g class="s2-l' + (cls ? " " + cls : "") + '" data-on="' + on + '">' + inner + '</g>'; }
  function showLayers(svg, k) {
    svg.querySelectorAll(".s2-l").forEach(function (g) { g.classList.toggle("off", g.getAttribute("data-on").split(",").indexOf(String(k)) < 0); });
  }
  function blob(list, fill) { return '<g fill="' + fill + '">' + list.map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '"/>'; }).join("") + '</g>'; }
  function tree(x, y, s) {
    return '<rect x="' + (x - 3 * s) + '" y="' + (y - 40 * s) + '" width="' + (6 * s) + '" height="' + (40 * s) + '" fill="#5d4330"/>' +
      blob([[x, y - 52 * s, 20 * s], [x - 14 * s, y - 42 * s, 15 * s], [x + 14 * s, y - 42 * s, 15 * s]], "#2f7d3e") + blob([[x - 4 * s, y - 58 * s, 9 * s]], "#43994d");
  }
  function bar(x, y, w, h, v, col, label) {       // 세로 막대(0~100)
    return '<g class="s2-bar"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="#eef1f5" stroke="#d7dce5"/>' +
      '<rect class="s2-bv" x="' + x + '" y="' + (y + h - h * v / 100) + '" width="' + w + '" height="' + (h * v / 100) + '" rx="6" fill="' + col + '" data-y0="' + y + '" data-h="' + h + '"/>' +
      '<text class="s2-bt" x="' + (x + w / 2) + '" y="' + (y + h + 20) + '" text-anchor="middle">' + label + '</text></g>';
  }
  function setBar(g, v) {
    const r = g.querySelector(".s2-bv"), y0 = +r.dataset.y0, h = +r.dataset.h;
    r.setAttribute("y", f1(y0 + h - h * v / 100)); r.setAttribute("height", f1(h * v / 100));
  }

  /* ==========================================================
     5-1 화전 농업의 순환
     ========================================================== */
  const SW = [
    { s: "🌳 숲", n: 80, y: 0, t: "키 큰 나무가 빽빽한 열대 우림 — 양분은 대부분 나무에 들어 있음" },
    { s: "🪓 나무 베기", n: 80, y: 0, t: "건기에 나무를 베어 말림" },
    { s: "🔥 불태우기", n: 95, y: 0, t: "불태운 재 = 거름 → 흙에 양분 공급, 해충 · 잡초 제거" },
    { s: "🌽 농사 1년째", n: 70, y: 100, t: "카사바 · 얌 · 옥수수 · 밭벼 재배 — 수확 많음" },
    { s: "🌾 농사 2~3년째", n: 35, y: 45, t: "많은 비에 양분이 씻겨 수확 감소 · 잡초 증가" },
    { s: "🚶 이동 · 숲 회복", n: 60, y: 0, t: "다른 숲으로 옮겨 감 → 10~20년 뒤 숲이 되살아나면 다시 이용" }
  ];
  function swiddenBlock() {
    let s = svgOpen(960, 420, "화전 농업의 순환", "sw-svg") +
      '<rect width="960" height="300" fill="#dff0f8"/><rect y="300" width="960" height="120" fill="#b8562f"/>' +
      '<rect class="sw-ground" x="250" y="300" width="460" height="16" fill="#6f9a3e"/>';
    for (let x = 20; x < 250; x += 44) s += tree(x, 304, 2.1 + (x % 3) * .15);
    for (let x = 730; x < 860; x += 44) s += tree(x, 304, 2.1 + (x % 3) * .15);
    let dense = "", small = "", stumps = "", crops = "", sparse = "";
    for (let x = 272; x < 700; x += 38) dense += tree(x, 304, 2.0 + ((x / 38) % 3) * .2);
    for (let x = 280; x < 700; x += 46) small += tree(x, 304, .8 + ((x / 46) % 2) * .25);
    for (let x = 276; x < 700; x += 38) stumps += '<rect x="' + (x - 5) + '" y="290" width="10" height="12" fill="#6b4c35"/><ellipse cx="' + x + '" cy="290" rx="5" ry="2" fill="#c89b6a"/>';
    stumps += [[330, 280, 20], [470, 284, -15], [600, 282, 10]].map(function (l) { return '<g transform="rotate(' + l[2] + ' ' + l[0] + ' ' + l[1] + ')"><rect x="' + (l[0] - 60) + '" y="' + (l[1] - 7) + '" width="120" height="14" rx="7" fill="#7a5a3c"/></g>'; }).join("");
    for (let x = 280; x < 700; x += 30) crops += '<path d="M' + x + ' 302 v-44" stroke="#4f8a2e" stroke-width="4"/><path d="M' + x + ' 280 l-14 -10 M' + x + ' 270 l14 -12 M' + x + ' 290 l12 -8" stroke="#5fa33a" stroke-width="4" stroke-linecap="round"/><ellipse cx="' + (x + 4) + '" cy="266" rx="4" ry="9" fill="#e8c34a"/>';
    for (let x = 290; x < 700; x += 60) sparse += '<path d="M' + x + ' 302 v-26" stroke="#7a9a3e" stroke-width="3"/><path d="M' + x + ' 286 l-9 -7 M' + x + ' 280 l9 -8" stroke="#8aa94a" stroke-width="3" stroke-linecap="round"/>';
    for (let x = 300; x < 700; x += 50) sparse += '<path d="M' + (x + 20) + ' 302 q-6 -14 0 -18 q6 6 0 18" fill="#9ab34e"/>';
    s += layer("0", dense) + layer("5", small) + layer("1,2,3,4", stumps, "sw-stumps") +
      layer("2", '<rect x="250" y="296" width="460" height="10" fill="#4a4a4a"/>' + [300, 380, 460, 540, 620].map(function (x, i) {
        return '<g class="sw-flame" style="animation-delay:' + (i * .15) + 's"><path d="M' + x + ' 300 q-22 -30 0 -70 q8 26 18 10 q14 34 -18 60Z" fill="#f08a24"/><path d="M' + (x + 2) + ' 300 q-10 -18 2 -38 q8 18 10 10 q4 18 -12 28Z" fill="#ffd34a"/></g>';
      }).join("") + '<g class="sw-smoke" fill="#9aa0a6" opacity=".7"><circle cx="360" cy="180" r="30"/><circle cx="420" cy="140" r="38"/><circle cx="520" cy="160" r="34"/><circle cx="600" cy="120" r="40"/></g>') +
      layer("3,4", '<rect x="250" y="296" width="460" height="10" fill="' + "#6b5a4a" + '"/>') +
      layer("3", crops) + layer("4", sparse) +
      layer("1", '<g transform="translate(700 250)"><circle cx="0" cy="-2" r="8" fill="#8a5a3c"/><rect x="-7" y="6" width="14" height="26" rx="4" fill="#2b6fe3"/><rect x="-6" y="32" width="5" height="20" fill="#3d2f2a"/><rect x="2" y="32" width="5" height="20" fill="#3d2f2a"/><path d="M6 14 L-22 -6" stroke="#6b4c35" stroke-width="4"/><path d="M-26 -12 l10 2 l-4 10Z" fill="#9aa3ad"/></g>') +
      layer("5", '<path d="M720 250 H880" stroke="#1b2233" stroke-width="4" stroke-dasharray="8 6"/><path d="M880 240 l14 10 l-14 10Z" fill="#1b2233"/><text class="s2-t" x="800" y="236" text-anchor="middle">새 숲으로</text>') +
      '<text class="s2-t sw-cap" x="480" y="360" text-anchor="middle"></text>' +
      bar(900, 40, 26, 200, 80, "#8a5a2b", "양분") +
    '</svg>';
    return {
      title: "시뮬레이터 — 화전 농업의 순환",
      html: '<div class="av-ctl"><div class="sw-play"></div></div><div class="p2-row sw-read"></div><div class="p2-figwrap">' + s + '</div>' +
        K.cap("이동식 화전 농업 (예시 모형 — 막대 = 흙의 양분) · 인구가 늘어 숲이 회복되기 전에 다시 태우면 숲이 줄어듦"),
      init: function (el) {
        const svg = el.querySelector(".sw-svg");
        const pl = Anim.player(el.querySelector(".sw-play"), { steps: SW.map(function (x) { return x.s; }), interval: 2600, loop: true, start: 0,
          onStep: function (k) {
            const d = SW[k];
            showLayers(svg, k);
            setBar(svg.querySelector(".s2-bar"), d.n);
            svg.querySelector(".sw-ground").setAttribute("fill", k === 0 || k === 5 ? "#6f9a3e" : k === 2 ? "#4a4a4a" : "#6b5a4a");
            svg.querySelector(".sw-cap").textContent = d.t;
            el.querySelector(".sw-read").innerHTML = big("단계", (k + 1) + " / 6", d.s) + big("흙의 양분", d.n + "", d.n >= 80 ? "많음" : d.n >= 60 ? "보통" : "적음", d.n >= 60 ? "key" : "warm") +
              big("수확량", d.y ? d.y + "" : "—", d.y ? (d.y >= 80 ? "많음" : "줄어듦") : "농사 안 함", "rain");
          } });
        return function () { pl.pause(); };
      }
    };
  }

  /* ==========================================================
     5-2 초원의 유목 — 계절마다 옮겨 가는 몽골 유목민
     ========================================================== */
  const PAST = [
    { n: "봄 목초지", x: 240, y: 300, why: "바람이 잦아드는 넓은 평지 — 새끼 가축이 태어나는 때" },
    { n: "여름 목초지", x: 560, y: 150, why: "강가 · 높은 곳 — 서늘하고 물과 풀이 가장 많음" },
    { n: "가을 목초지", x: 790, y: 270, why: "풀씨가 여문 곳 — 가축을 살찌워 겨울 준비" },
    { n: "겨울 목초지", x: 470, y: 350, why: "산기슭 남쪽 — 찬 바람을 막고 눈이 덜 쌓임" }
  ];
  const SEASON = ["🌱 봄", "☀️ 여름", "🍂 가을", "❄️ 겨울"];
  function grassAt(s, p) { return p === s ? 45 : p === (s + 3) % 4 ? 25 : p === (s + 2) % 4 ? 60 : 90; }
  function nomadBlock() {
    let s = svgOpen(960, 420, "몽골 초원 유목민의 계절 이동", "nm-svg") +
      '<rect class="nm-land" width="960" height="420" fill="#cfe3a4"/>' +
      '<polygon points="300,160 380,70 450,120 520,40 600,100 680,50 760,120 820,90 900,160" fill="#a99f86"/><g fill="#fff"><polygon points="380,70 364,88 374,86 381,95 390,86 398,90"/><polygon points="520,40 500,64 512,60 520,70 530,60 542,64"/><polygon points="680,50 662,70 672,68 680,78 690,68 700,70"/></g>' +
      '<polygon points="330,400 390,330 440,360 500,310 560,370 620,400" fill="#b3a98f"/>' +
      '<path d="M0 90 Q140 110 250 160 Q350 200 470 180 Q560 166 640 190" stroke="#5aa0d8" stroke-width="10" fill="none" stroke-linecap="round"/>' +
      '<path class="nm-route" d="M' + PAST.map(function (p) { return p.x + " " + p.y; }).join(" L") + ' Z" fill="none" stroke="#1b2233" stroke-width="3" stroke-dasharray="10 8" opacity=".45"/>' +
      '<g class="nm-snow" fill="#fff" opacity="0">' + Array.from({ length: 60 }, function (_, i) { return '<circle cx="' + ((i * 157) % 960) + '" cy="' + ((i * 91) % 420) + '" r="' + (2 + i % 3) + '"/>'; }).join("") + '</g>' +
      PAST.map(function (p, i) {
        return '<g class="nm-p" data-i="' + i + '"><ellipse cx="' + p.x + '" cy="' + (p.y + 22) + '" rx="70" ry="22" fill="#86b54a" opacity=".55"/>' +
          '<rect class="nm-gb" x="' + (p.x + 62) + '" y="' + (p.y - 30) + '" width="12" height="50" rx="4" fill="#fff" stroke="#6f9a3e"/><rect class="nm-gv" x="' + (p.x + 62) + '" y="' + (p.y - 30) + '" width="12" height="50" rx="4" fill="#4f9a2e"/>' +
          '<text class="s2-t sm" x="' + p.x + '" y="' + (p.y + 62) + '" text-anchor="middle">' + p.n + '</text></g>';
      }).join("") +
      '<g class="nm-herd"></g>' +
      '<g class="nm-ger"><ellipse cx="0" cy="4" rx="34" ry="6" fill="#000" opacity=".15"/><path d="M-30 2 V-16 Q0 -44 30 -16 V2Z" fill="#fbfaf4" stroke="#c9c2ad" stroke-width="2"/><path d="M-30 -14 H30" stroke="#d24a3a" stroke-width="3"/><rect x="-7" y="-14" width="14" height="16" fill="#d9a441"/><circle cx="0" cy="-36" r="4" fill="#d24a3a"/></g>' +
    '</svg>';
    return {
      title: "시뮬레이터 — 초원의 유목",
      html: '<div class="av-ctl"><div class="nm-play"></div></div><div class="p2-row nm-read"></div><div class="p2-figwrap">' + s + '</div>' +
        K.cap("몽골 스텝(BS) 유목의 계절 이동 모식도 — 막대 = 목초지의 풀 양(예시), 한곳에 머물지 않아 풀이 다시 자랄 시간을 줌"),
      init: function (el) {
        const svg = el.querySelector(".nm-svg"), ger = svg.querySelector(".nm-ger"), herd = svg.querySelector(".nm-herd");
        let gx = PAST[0].x - 40, gy = PAST[0].y, stopT = function () {};
        const sheep = [];
        for (let i = 0; i < 18; i++) { const c = document.createElementNS("http://www.w3.org/2000/svg", "ellipse"); c.setAttribute("rx", 6); c.setAttribute("ry", 4.5); c.setAttribute("fill", i % 5 ? "#fbfaf4" : "#6b4a2a"); c.setAttribute("stroke", "#9a917c"); herd.appendChild(c); sheep.push({ e: c, dx: 20 + (i % 6) * 12, dy: -18 + Math.floor(i / 6) * 13 }); }
        function place(x, y) {
          ger.setAttribute("transform", "translate(" + f1(x) + " " + f1(y) + ")");
          sheep.forEach(function (p, i) { p.e.setAttribute("cx", f1(x + p.dx + Math.sin(i) * 3)); p.e.setAttribute("cy", f1(y + p.dy + 8)); });
        }
        place(gx, gy);
        const pl = Anim.player(el.querySelector(".nm-play"), { steps: SEASON, interval: 3000, loop: true, start: 0,
          onStep: function (k) {
            const p = PAST[k], x0 = gx, y0 = gy, x1 = p.x - 40, y1 = p.y;
            stopT(); stopT = K.tween(0, 1, 1400, function (t) { gx = x0 + (x1 - x0) * t; gy = y0 + (y1 - y0) * t; place(gx, gy); });
            svg.querySelectorAll(".nm-p").forEach(function (g, i) {
              const v = grassAt(k, i), r = g.querySelector(".nm-gv");
              r.setAttribute("y", f1(PAST[i].y - 30 + 50 - v / 2)); r.setAttribute("height", f1(v / 2));
              r.setAttribute("fill", k === 3 ? "#8aa06a" : k === 2 ? "#b9a24a" : "#4f9a2e");
              g.classList.toggle("on", i === k);
            });
            svg.querySelector(".nm-land").setAttribute("fill", ["#cfe3a4", "#b7d98a", "#e1cf8c", "#e8edf2"][k]);
            svg.querySelector(".nm-snow").setAttribute("opacity", k === 3 ? .9 : 0);
            el.querySelector(".nm-read").innerHTML = big("계절", SEASON[k], "") + big("머무는 곳", p.n, p.why, "key") +
              big("가축", "양 · 염소 · 말 · 소 · 낙타", "고기 · 젖 · 털 · 가죽 · 운송");
          } });
        return function () { pl.pause(); stopT(); };
      }
    };
  }

  /* ==========================================================
     5-3 세 온대의 농업 달력 — 로마 · 런던 · 서울
     ========================================================== */
  const FARM = [
    { id: "Rome", t: "지중해성 (로마)", ev: ["밀 자람 · 올리브 가지치기", "밀 자람", "밀 자람", "밀 자람 · 포도 싹", "밀 이삭 · 포도 꽃", "밀 수확", "건조 — 들판이 누렇게", "건조 · 포도 익음", "포도 수확", "밀 씨 뿌리기 · 첫 비", "올리브 수확 · 밀 싹", "올리브 수확"] },
    { id: "London", t: "서안 해양성 (런던)", ev: ["목초 — 가축은 축사", "목초 — 가축은 축사", "가축 방목 시작", "방목 · 목초 무성", "방목", "건초 만들기", "건초 · 밀 익음", "밀 수확", "방목", "방목", "축사로", "목초 — 가축은 축사"] },
    { id: "Seoul", t: "온대 · 계절풍 벼농사 (서울)", ev: ["논 얼어붙음", "쉬는 논", "논갈이 준비", "못자리 — 볍씨 싹 틔우기", "모내기", "모내기 · 김매기", "장마 — 벼 쑥쑥", "벼 이삭", "벼 익음", "벼 수확", "빈 논 · 보리 파종", "쉬는 논"] }
  ];
  function fieldSvg(k, m, x0) {
    const y0 = 60, w = 290, h = 200, gy = y0 + h - 40;
    let s = '<g transform="translate(' + x0 + ' 0)"><rect x="0" y="' + y0 + '" width="' + w + '" height="' + h + '" rx="14" fill="' + ((m <= 1 || m === 11) ? "#dfe8f1" : "#dff0fb") + '"/>';
    if (k === 0) {                                 // 로마
      const dry = m >= 6 && m <= 8, wheat = (m >= 10 || m <= 5);
      s += '<rect x="0" y="' + gy + '" width="' + w + '" height="40" fill="' + (dry ? "#d9bd74" : "#8fb35a") + '"/>';
      [40, 250].forEach(function (x) { s += '<path d="M' + x + ' ' + gy + ' q-3 -16 2 -26" stroke="#6a5238" stroke-width="6" fill="none"/>' + blob([[x - 12, gy - 32, 14], [x + 10, gy - 34, 15], [x, gy - 46, 14]], "#8fa066") + (m >= 10 ? blob([[x - 8, gy - 30, 3], [x + 6, gy - 38, 3], [x + 12, gy - 28, 3]], "#2d2d2d") : ""); });
      if (wheat) { const hh = m === 5 ? 34 : m === 4 ? 30 : m >= 10 ? 8 : 12 + m * 4, col = m === 5 ? "#e0b640" : m === 4 ? "#b9c45a" : "#5f9e3a"; for (let x = 80; x < 220; x += 10) s += '<path d="M' + x + ' ' + gy + ' v-' + hh + '" stroke="' + col + '" stroke-width="3"/>' + (m >= 4 && m <= 5 ? '<ellipse cx="' + x + '" cy="' + (gy - hh) + '" rx="2.5" ry="6" fill="' + col + '"/>' : ""); }
      else for (let x = 80; x < 220; x += 14) s += '<path d="M' + x + ' ' + gy + ' l6 -4" stroke="#b99a58" stroke-width="2"/>';
      if (m >= 3 && m <= 8) s += '<g>' + [150].map(function (x) { return '<path d="M' + x + ' ' + (gy - 50) + ' h60" stroke="#6a5238" stroke-width="2"/>' + blob([[x + 10, gy - 56, 8], [x + 30, gy - 58, 9], [x + 50, gy - 56, 8]], "#5f8a2a") + (m >= 7 ? blob([[x + 14, gy - 48, 4], [x + 34, gy - 48, 4], [x + 50, gy - 47, 4]], "#6a2c7a") : ""); }).join("") + '</g>';
      s += (m >= 5 && m <= 8 ? '<circle cx="250" cy="' + (y0 + 34) + '" r="18" fill="#ffcf33"/>' : '<g fill="#fff" stroke="#b9c7d6"><ellipse cx="220" cy="' + (y0 + 36) + '" rx="36" ry="14"/><ellipse cx="200" cy="' + (y0 + 28) + '" rx="20" ry="12"/></g>');
    } else if (k === 1) {                          // 런던
      const out = m >= 2 && m <= 9;
      s += '<rect x="0" y="' + gy + '" width="' + w + '" height="40" fill="' + (m === 11 || m <= 1 ? "#7fa35a" : "#5fa83e") + '"/>' +
        '<g fill="#fff" stroke="#b9c7d6"><ellipse cx="80" cy="' + (y0 + 34) + '" rx="40" ry="14"/><ellipse cx="200" cy="' + (y0 + 40) + '" rx="44" ry="15"/></g>' +
        '<path d="M0 ' + (gy + 2) + ' H' + w + '" stroke="#8a6a3a" stroke-width="3" stroke-dasharray="2 14"/>' +
        '<g transform="translate(236 ' + gy + ')"><rect x="-30" y="-44" width="60" height="44" fill="#b8453a"/><polygon points="-36,-44 0,-66 36,-44" fill="#6b3a2a"/><rect x="-10" y="-24" width="20" height="24" fill="#f3e9d6"/></g>';
      if (out) [[60, 0], [110, 6], [160, -2]].forEach(function (c) { s += '<g transform="translate(' + c[0] + ' ' + (gy - 10 + c[1]) + ')"><ellipse cx="0" cy="0" rx="18" ry="10" fill="#fff" stroke="#555"/><circle cx="-6" cy="-2" r="4" fill="#333"/><circle cx="8" cy="3" r="3" fill="#333"/><ellipse cx="18" cy="-6" rx="7" ry="5" fill="#fff" stroke="#555"/><path d="M-12 8 v10 M-4 8 v10 M6 8 v10 M12 8 v10" stroke="#555" stroke-width="3"/></g>'; });
      else s += '<text class="s2-t sm" x="236" y="' + (gy + 30) + '" text-anchor="middle">축사</text>';
      if (m === 5 || m === 6) [70, 130].forEach(function (x) { s += '<circle cx="' + x + '" cy="' + (gy + 18) + '" r="11" fill="#d8b04a" stroke="#b58f2e" stroke-width="2"/>'; });
    } else {                                       // 서울 벼농사
      const water = m >= 4 && m <= 7, froze = m <= 1 || m === 11;
      s += '<rect x="0" y="' + gy + '" width="' + w + '" height="40" fill="' + (froze ? "#cfc6b4" : "#9b7a52") + '"/>' +
        (water ? '<rect x="0" y="' + (gy - 4) + '" width="' + w + '" height="14" fill="#6aa7d4" opacity=".85"/>' : "") + (froze ? '<g fill="#fff" opacity=".8"><ellipse cx="80" cy="' + (gy + 12) + '" rx="40" ry="6"/><ellipse cx="200" cy="' + (gy + 22) + '" rx="50" ry="6"/></g>' : "");
      const hh = [0, 0, 0, 0, 8, 16, 34, 44, 44, 0, 0, 0][m], col = m === 8 ? "#d9b440" : m === 7 ? "#8bb04a" : "#4f9a2e";
      if (m === 3) s += '<rect x="30" y="' + (gy - 8) + '" width="70" height="8" fill="#5fae3e"/><text class="s2-t sm" x="65" y="' + (gy + 30) + '" text-anchor="middle">못자리</text>';
      if (hh) for (let x = 24; x < w - 10; x += 16) s += '<path d="M' + x + ' ' + (gy + 4) + ' v-' + hh + ' M' + x + ' ' + (gy + 4 - hh * .5) + ' l-6 -' + (hh * .3) + ' M' + x + ' ' + (gy + 4 - hh * .6) + ' l6 -' + (hh * .3) + '" stroke="' + col + '" stroke-width="2.5" fill="none"/>' + (m >= 7 ? '<path d="M' + x + ' ' + (gy + 4 - hh) + ' q6 4 5 12" stroke="' + (m === 8 ? "#c89a2a" : "#9bbc4a") + '" stroke-width="3" fill="none"/>' : "");
      if (m === 9) for (let x = 24; x < w - 10; x += 16) s += '<path d="M' + x + ' ' + (gy + 4) + ' v-6" stroke="#c9a35a" stroke-width="2.5"/>';
      if (m === 9) s += '<g fill="#d9b440" stroke="#a88a2a"><path d="M100 ' + gy + ' l10 -26 l10 26Z"/><path d="M170 ' + gy + ' l10 -26 l10 26Z"/></g>';
      s += (m === 6 ? '<g fill="#8d99ad"><ellipse cx="140" cy="' + (y0 + 30) + '" rx="60" ry="18"/><ellipse cx="100" cy="' + (y0 + 26) + '" rx="30" ry="14"/></g><g stroke="#2b6fe3" stroke-width="2">' + [100, 120, 140, 160, 180].map(function (x) { return '<path d="M' + x + ' ' + (y0 + 50) + ' l-4 14"/>'; }).join("") + '</g>' : m >= 4 && m <= 8 ? '<circle cx="250" cy="' + (y0 + 34) + '" r="18" fill="#ffcf33"/>' : "");
    }
    /* 이달 기후 막대 */
    const c = C(FARM[k].id), by = y0 + h + 20;
    s += '<g>' + c.p.map(function (p, i) { const hh = Math.min(60, p / 6); return '<rect x="' + (8 + i * 23) + '" y="' + (by + 60 - hh) + '" width="15" height="' + f1(hh) + '" fill="' + (i === m ? "#2b6fe3" : "#bcd3f2") + '"/>'; }).join("") +
      '<polyline fill="none" stroke="#e0483a" stroke-width="2" points="' + c.t.map(function (t, i) { return (15.5 + i * 23) + "," + f1(by + 40 - t * 1.2); }).join(" ") + '"/>' +
      '<circle cx="' + (15.5 + m * 23) + '" cy="' + f1(by + 40 - c.t[m] * 1.2) + '" r="5" fill="#e0483a" stroke="#fff" stroke-width="2"/></g>' +
      '<text class="s2-t" x="' + (w / 2) + '" y="40" text-anchor="middle">' + FARM[k].t + '</text>' +
      '<text class="s2-t sm fm-ev" x="' + (w / 2) + '" y="' + (y0 + h - 8) + '" text-anchor="middle">' + FARM[k].ev[m] + '</text></g>';
    return s;
  }
  function farmBlock() {
    return {
      title: "시뮬레이터 — 세 온대의 농업 달력",
      html: '<div class="av-ctl"><div class="fm-play"></div></div><div class="p2-row fm-read"></div><div class="p2-figwrap"><svg class="p2-svg fm-svg" viewBox="0 0 960 360" role="img" aria-label="세 온대 지역의 달별 농업"></svg></div>' +
        K.cap("같은 온대라도 비가 오는 계절이 달라 농업이 다름 — 아래 막대 = 월 강수량, 선 = 월평균 기온(평년값), 그림은 모식도"),
      init: function (el) {
        const svg = el.querySelector(".fm-svg");
        const pl = Anim.player(el.querySelector(".fm-play"), { steps: MON, interval: 1800, loop: true, start: 4,
          onStep: function (m) {
            svg.innerHTML = fieldSvg(0, m, 10) + fieldSvg(1, m, 335) + fieldSvg(2, m, 660);
            el.querySelector(".fm-read").innerHTML = FARM.map(function (f, k) {
              const c = C(f.id);
              return big(f.t, deg(c.t[m]) + " · " + Math.round(c.p[m]) + "mm", f.ev[m], ["warm", "key", "rain"][k]);
            }).join("");
          } });
        return function () { pl.pause(); };
      }
    };
  }

  /* ==========================================================
     5-4 시베리아 강의 봄 홍수 — 남쪽(상류)부터 녹고 북쪽(하구)은 아직 얼어 있음
     ========================================================== */
  const RIV = [[300, 390], [330, 360], [310, 330], [350, 300], [330, 270], [370, 240], [350, 210], [390, 180], [370, 150], [410, 120], [390, 95], [420, 72], [405, 48]];
  function riverBlock() {
    const n = RIV.length - 1;
    let s = svgOpen(960, 420, "북쪽으로 흐르는 시베리아의 강", "rv-svg") +
      '<rect width="960" height="420" fill="#e6efe2"/><rect width="960" height="44" fill="#9fc3e0"/><text class="s2-t" x="120" y="30">북극해 (하구)</text>' +
      '<g fill="#2f5a45" opacity=".5">' + Array.from({ length: 40 }, function (_, i) { const x = 40 + (i * 97) % 560, y = 80 + (i * 53) % 320; return Math.abs(x - 360) < 70 ? "" : '<polygon points="' + x + ',' + (y - 14) + ' ' + (x - 7) + ',' + y + ' ' + (x + 7) + ',' + y + '"/>'; }).join("") + '</g>' +
      '<g class="rv-flood"></g>' +
      RIV.slice(0, n).map(function (p, k) { const q = RIV[k + 1]; return '<line class="rv-seg" data-k="' + k + '" x1="' + p[0] + '" y1="' + p[1] + '" x2="' + q[0] + '" y2="' + q[1] + '"/>'; }).join("") +
      '<text class="s2-t" x="300" y="412" text-anchor="middle">상류 (남쪽)</text>' +
      '<g class="s2-t sm">' + [[390, "50°N"], [230, "60°N"], [72, "70°N"]].map(function (l) { return '<text x="40" y="' + l[0] + '">' + l[1] + '</text><line x1="80" x2="600" y1="' + (l[0] - 4) + '" y2="' + (l[0] - 4) + '" stroke="#9aa3ad" stroke-dasharray="4 6"/>'; }).join("") + '</g>' +
      '<path d="M470 360 V90" stroke="#1b2233" stroke-width="3"/><path d="M462 100 l8 -16 l8 16Z" fill="#1b2233"/><text class="s2-t sm" x="484" y="230">강물이 흐르는 방향</text>' +
      '<g transform="translate(640 60)"><rect width="290" height="300" rx="16" fill="#fff" stroke="#d7dce5"/><text class="s2-t" x="145" y="34" text-anchor="middle">구간별 상태</text>' +
      '<g class="rv-leg">' + Array.from({ length: n }, function (_, i) { const k = n - 1 - i; return '<rect class="rv-cell" data-k="' + k + '" x="30" y="' + (50 + i * 19) + '" width="230" height="15" rx="4"/>'; }).join("") + '</g>' +
      '<text class="s2-t sm" x="145" y="292" text-anchor="middle">위 = 하구(북) · 아래 = 상류(남)</text></g>' +
    '</svg>';
    return {
      title: "시뮬레이터 — 시베리아 강의 봄 홍수",
      html: '<div class="av-ctl"><div class="rv-play"></div></div><div class="p2-row rv-read"></div><div class="p2-figwrap">' + s + '</div>' +
        K.cap("오비강 · 예니세이강 · 레나강은 남 → 북으로 흐름 — 봄에 따뜻한 남쪽(상류)이 먼저 녹고 북쪽(하구)은 아직 얼어 물길이 막힘 → 범람 (예시 모형)"),
      init: function (el) {
        const svg = el.querySelector(".rv-svg");
        function open(k, m) { const v = m + .5, br = 3.8 + k * .22, fr = 10.3 - k * .1; return v >= br && v < fr; }
        const pl = Anim.player(el.querySelector(".rv-play"), { steps: MON, interval: 1700, loop: true, start: 4,
          onStep: function (m) {
            let nOpen = 0, flood = -1;
            svg.querySelectorAll(".rv-seg").forEach(function (l) { const k = +l.dataset.k, o = open(k, m); l.classList.toggle("open", o); if (o) nOpen++; });
            svg.querySelectorAll(".rv-cell").forEach(function (r) { const k = +r.dataset.k; r.setAttribute("class", "rv-cell " + (open(k, m) ? "open" : "ice")); });
            if (m >= 3 && m <= 6) for (let k = 0; k < n - 1; k++) if (open(k, m) && !open(k + 1, m)) { flood = k + 1; break; }
            const fl = svg.querySelector(".rv-flood");
            fl.innerHTML = flood >= 0 ? '<ellipse cx="' + RIV[flood][0] + '" cy="' + RIV[flood][1] + '" rx="90" ry="34" fill="#6aa7d4" opacity=".45"/><text class="s2-t warn" x="' + (RIV[flood][0] - 100) + '" y="' + (RIV[flood][1] + 5) + '" text-anchor="end">얼음에 막혀 범람!</text>' : "";
            el.querySelector(".rv-read").innerHTML = big(MON[m], nOpen === 0 ? "강 전체가 얼어 있음" : nOpen === n ? "강 전체가 흐름" : "녹은 구간 " + nOpen + " / " + n, nOpen && nOpen < n ? (m <= 6 ? "남쪽(상류)부터 녹음" : "북쪽(하구)부터 얼기 시작") : "", "key") +
              big("봄 홍수", flood >= 0 ? "위험" : "—", flood >= 0 ? "녹은 물 + 얼음 조각이 언 하류에 막힘" : "", flood >= 0 ? "warm" : "") +
              big("겨울 이용", "얼음 도로", "언 강 위로 차량 · 목재 운반");
          } });
        return function () { pl.pause(); };
      }
    };
  }

  /* ==========================================================
     5-5 북극 바다 얼음 — 계절 변화와 줄어드는 여름 얼음
     ========================================================== */
  const ICE = { old: [14.5, 15.4, 15.6, 14.9, 13.4, 11.9, 9.2, 6.9, 6.3, 8.5, 11.0, 13.1], now: [13.5, 14.3, 14.6, 14.0, 12.7, 10.8, 7.9, 5.3, 4.5, 6.3, 9.6, 11.9] };
  function iceBlock() {
    const cx = 230, cy = 210, R0 = 190;
    const X = function (i) { return 520 + i * 36; }, Y = function (v) { return 360 - v * 18; };
    let s = svgOpen(960, 420, "북극 바다 얼음 면적의 계절 변화", "ic-svg") +
      '<defs><clipPath id="ic-clip"><circle cx="' + cx + '" cy="' + cy + '" r="' + R0 + '"/></clipPath></defs>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + R0 + '" fill="#2d6aa3"/>' +
      '<path class="ic-ice" clip-path="url(#ic-clip)" fill="#f4f9fd" stroke="#cfe3f3" stroke-width="3"/>' +
      '<g clip-path="url(#ic-clip)" fill="#b6a987" stroke="#8e8266" stroke-width="2">' +
        '<path d="M20 90 Q80 120 110 170 Q90 230 40 270 L0 300 L0 60Z"/><path d="M60 330 Q140 330 200 380 L230 420 L0 420 L0 320Z"/>' +
        '<path d="M300 400 Q330 350 400 340 Q440 300 470 250 L480 420Z"/><path d="M420 60 Q380 110 400 150 Q440 170 480 150 L480 0 L400 0Z"/>' +
        '<path d="M180 20 Q230 70 280 60 Q310 30 300 0 L190 0Z" fill="#e8eef3"/>' +
      '</g><circle cx="' + cx + '" cy="' + cy + '" r="' + R0 + '" fill="none" stroke="#1b2233" stroke-width="2"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="#e0483a"/><text class="s2-t sm" x="' + (cx + 8) + '" y="' + (cy - 6) + '">북극점</text>' +
      '<text class="s2-t sm" x="60" y="190">북아메리카</text><text class="s2-t sm" x="380" y="330">유라시아</text><text class="s2-t sm" x="206" y="44">그린란드</text>' +
      '<g>' + [0, 5, 10, 15].map(function (v) { return '<line x1="510" x2="930" y1="' + Y(v) + '" y2="' + Y(v) + '" class="p2-grid"/><text class="p2-ax" x="504" y="' + (Y(v) + 5) + '" text-anchor="end">' + v + '</text>'; }).join("") +
      MON.map(function (t, i) { return '<text class="p2-ax" x="' + X(i) + '" y="384" text-anchor="middle">' + (i + 1) + '</text>'; }).join("") +
      '<text class="p2-unit" x="504" y="70" text-anchor="end">백만 km²</text>' +
      '<polyline class="ic-l old" points="' + ICE.old.map(function (v, i) { return X(i) + "," + Y(v); }).join(" ") + '"/>' +
      '<polyline class="ic-l now" points="' + ICE.now.map(function (v, i) { return X(i) + "," + Y(v); }).join(" ") + '"/>' +
      '<circle class="ic-mk" r="7"/>' +
      '<g transform="translate(700 40)"><line x1="0" x2="30" y1="0" y2="0" class="ic-l old"/><text class="s2-t sm" x="38" y="5">1981~2010 평균</text>' +
      '<line x1="0" x2="30" y1="24" y2="24" class="ic-l now"/><text class="s2-t sm" x="38" y="29">최근 10년 평균</text></g></g>' +
    '</svg>';
    return {
      title: "시뮬레이터 — 북극 바다 얼음",
      html: '<div class="av-ctl"><div class="ic-play"></div><div class="ed-grp"><span>시기</span>' + seg("ic", ["1981~2010 평균", "최근 10년 평균"], 1) + '</div></div>' +
        '<div class="p2-row ic-read"></div><div class="p2-figwrap">' + s + '</div>' +
        K.cap("북극에서 내려다본 모식도(얼음 크기는 면적에 맞춰 그림) · 달별 면적은 위성 관측 근사값 — 여름(9월) 얼음이 크게 줄어듦"),
      init: function (el) {
        const svg = el.querySelector(".ic-svg");
        let m = 2, sc = 1;
        function icePath(ext) {
          const r = R0 * Math.sqrt(ext / 17) * 1.02;
          let d = "";
          for (let i = 0; i <= 72; i++) { const a = i / 72 * Math.PI * 2, rr = r * (1 + .07 * Math.sin(5 * a + 1) + .05 * Math.sin(9 * a) + .03 * Math.sin(14 * a + 2)); d += (i ? "L" : "M") + f1(cx + Math.cos(a) * rr) + " " + f1(cy + Math.sin(a) * rr); }
          return d + "Z";
        }
        function set() {
          const arr = sc ? ICE.now : ICE.old, v = arr[m];
          svg.querySelector(".ic-ice").setAttribute("d", icePath(v));
          const mk = svg.querySelector(".ic-mk"); mk.setAttribute("cx", X(m)); mk.setAttribute("cy", Y(v)); mk.setAttribute("class", "ic-mk " + (sc ? "now" : "old"));
          svg.querySelectorAll(".ic-l").forEach(function (l) { l.classList.toggle("dim", l.classList.contains(sc ? "old" : "now")); });
          el.querySelector(".ic-read").innerHTML = big(MON[m] + " 바다 얼음", v.toFixed(1) + "백만 km²", "한반도 면적의 약 " + Math.round(v / .223) + "배", "cold") +
            big("9월 최소 비교", ICE.old[8] + " → " + ICE.now[8], "약 " + Math.round((1 - ICE.now[8] / ICE.old[8]) * 100) + "% 줄어듦", "warm") +
            big("영향", "북극곰 사냥터 감소", "여름 북극 항로 · 자원 개발 늘어남");
        }
        bindSeg(el, "ic", function (i) { sc = i; set(); });
        const pl = Anim.player(el.querySelector(".ic-play"), { steps: MON, interval: 1500, loop: true, start: 2, onStep: function (k) { m = k; set(); } });
        return function () { pl.pause(); };
      }
    };
  }

  /* ==========================================================
     5-6 높이 올라가면 — 기온 · 기압 · 산소 · 물 끓는 온도
     ========================================================== */
  const HMARK = [[106, "이키토스"], [2850, "키토"], [3640, "라파스"], [4900, "만년설"]];
  function altBlock() {
    const Yh = function (h) { return 380 - h / 6000 * 320; }, Xh = function (h) { return 60 + h / 6000 * 480; };
    let s = svgOpen(960, 420, "해발 고도에 따른 기온 · 기압 · 산소", "ht-svg") +
      '<defs><linearGradient id="ht-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f6fc0"/><stop offset="1" stop-color="#cfe8f8"/></linearGradient></defs>' +
      '<rect width="600" height="420" fill="url(#ht-sky)"/>' +
      '<polygon points="0,420 0,380 60,380 540,60 600,110 600,420" fill="#8a7d6a"/>' +
      '<polygon points="' + Xh(4900) + ',' + Yh(4900) + ' 540,60 600,110 600,' + (Yh(4900) + 30) + '" fill="#fff"/>' +
      '<polygon points="0,400 0,380 60,380 ' + Xh(1200) + ',' + Yh(1200) + ' ' + (Xh(1200) + 40) + ',420 0,420" fill="#4f9a3e" opacity=".75"/>' +
      '<polygon points="' + Xh(1200) + ',' + Yh(1200) + ' ' + Xh(3200) + ',' + Yh(3200) + ' ' + (Xh(3200) + 50) + ',420 ' + (Xh(1200) + 40) + ',420" fill="#8fb35a" opacity=".6"/>' +
      '<polygon points="' + Xh(3200) + ',' + Yh(3200) + ' ' + Xh(4900) + ',' + Yh(4900) + ' ' + (Xh(4900) + 50) + ',420 ' + (Xh(3200) + 50) + ',420" fill="#c9b77a" opacity=".6"/>' +
      [0, 1000, 2000, 3000, 4000, 5000, 6000].map(function (h) { return '<line x1="0" x2="20" y1="' + Yh(h) + '" y2="' + Yh(h) + '" stroke="#fff" stroke-width="2"/><text class="ht-ax" x="24" y="' + (Yh(h) + 5) + '">' + h.toLocaleString() + 'm</text>'; }).join("") +
      HMARK.map(function (p) { return '<circle cx="' + Xh(p[0]) + '" cy="' + Yh(p[0]) + '" r="5" fill="#fff" stroke="#1b2233" stroke-width="2"/><text class="ht-mk" x="' + (Xh(p[0]) + 10) + '" y="' + (Yh(p[0]) + 18) + '">' + p[1] + ' ' + p[0].toLocaleString() + 'm</text>'; }).join("") +
      '<g class="ht-man"><circle cx="0" cy="-30" r="7" fill="#c98f62"/><path d="M-9 -22 h18 l3 18 h-24Z" fill="#e0483a"/><path d="M-6 -4 l-4 14 M6 -4 l4 14" stroke="#3d2f2a" stroke-width="4"/><path d="M10 -18 l10 16" stroke="#6b4c35" stroke-width="3"/></g>' +
      '<g transform="translate(620 20)"><rect width="330" height="380" rx="16" fill="#fff" stroke="#d7dce5"/>' +
        bar(30, 50, 40, 250, 50, "#e0483a", "기온") + bar(110, 50, 40, 250, 100, "#7a5cc8", "기압") + bar(190, 50, 40, 250, 100, "#2f9e8f", "산소") + bar(270, 50, 40, 250, 100, "#e6a700", "끓는점") +
        '<g class="ht-v">' + [50, 130, 210, 290].map(function (x) { return '<text class="s2-t sm" x="' + x + '" y="36" text-anchor="middle"></text>'; }).join("") + '</g></g>' +
    '</svg>';
    return {
      title: "시뮬레이터 — 높이 올라가면",
      html: '<div class="av-ctl"><div class="p2-slider mw-sl"><label for="ht-h">해발 고도</label><input type="range" id="ht-h" min="0" max="6000" step="50" value="2850"><span class="p2-sl-v"></span></div>' +
        '<button type="button" class="anim-btn ht-play">▶ 산 오르기</button></div>' +
        '<div class="p2-row ht-read"></div><div class="p2-figwrap">' + s + '</div>' +
        K.cap("적도 부근 해수면 27℃ 기준, 100m마다 0.6℃ 하강 · 기압과 산소는 해수면 = 100 (예시 모형) · 물 끓는 온도는 약 300m마다 1℃씩 낮아짐"),
      init: function (el) {
        const svg = el.querySelector(".ht-svg"), inp = el.querySelector("#ht-h"), btn = el.querySelector(".ht-play");
        let h = 2850, run = false;
        function body(h) { return h < 1500 ? ["평지와 비슷", ""] : h < 2500 ? ["조금 숨이 참", "빨리 걸으면 숨이 가쁨"] : h < 3500 ? ["고산병 주의", "두통 · 어지러움 — 천천히 적응"] : h < 5000 ? ["고산병 위험", "숨이 차고 잠들기 어려움"] : ["오래 살기 어려움", "사람이 사는 가장 높은 곳 약 5,000m"]; }
        function set(v) {
          h = clamp(v, 0, 6000); inp.value = h;
          el.querySelector(".p2-sl-v").textContent = Math.round(h).toLocaleString() + "m";
          const T = 27 - h * .006, P = 1013 * Math.exp(-h / 8400), O = P / 1013 * 100, B = 100 - h / 300;
          svg.querySelector(".ht-man").setAttribute("transform", "translate(" + f1(Xh(h) - 4) + " " + f1(Yh(h) - 2) + ")");
          const bars = svg.querySelectorAll(".s2-bar");
          setBar(bars[0], clamp((T + 10) / 40 * 100, 0, 100)); setBar(bars[1], O); setBar(bars[2], O); setBar(bars[3], clamp((B - 70) / 30 * 100, 0, 100));
          const tv = svg.querySelectorAll(".ht-v text");
          tv[0].textContent = deg(T); tv[1].textContent = Math.round(P) + "hPa"; tv[2].textContent = Math.round(O) + "%"; tv[3].textContent = Math.round(B) + "℃";
          el.querySelector(".ht-read").innerHTML = big("기온", deg(T), "해수면보다 " + f1(27 - T).toFixed(1) + "℃ 낮음", T < 5 ? "cold" : T > 20 ? "warm" : "key") +
            big("산소", "해수면의 " + Math.round(O) + "%", "공기가 희박해짐") + big("몸의 느낌", body(h)[0], body(h)[1], h >= 2500 ? "warm" : "") +
            big("물 끓는 온도", Math.round(B) + "℃", h > 3000 ? "밥이 설익기 쉬움 → 압력솥" : "");
        }
        inp.addEventListener("input", function () { run = false; sync(); set(+inp.value); });
        function sync() { btn.classList.toggle("on", run); btn.textContent = run ? "⏸ 멈춤" : "▶ 산 오르기"; }
        btn.addEventListener("click", function () { run = !run; if (run && h >= 6000) set(0); sync(); });
        set(2850);
        if (REDUCED) return function () {};
        let last = performance.now(), on = true;
        (function tick(now) {
          if (!on || !inp.isConnected) return;
          const dt = Math.min(.1, (now - last) / 1000); last = now;
          if (run) { set(h + dt * 600); if (h >= 6000) { run = false; sync(); } }
          requestAnimationFrame(tick);
        })(last);
        return function () { on = false; };
      }
    };
  }

  insertAfterPrefix("5-1", "경관 탐험", swiddenBlock());
  insertAfterPrefix("5-2", "경관 탐험", nomadBlock());
  insertAfterPrefix("5-3", "경관 탐험", farmBlock());
  insertAfterPrefix("5-4", "경관 탐험", riverBlock());
  insertAfterPrefix("5-5", "경관 탐험", iceBlock());
  insertAfterPrefix("5-6", "경관 탐험", altBlock());

  /* 기후대 공통 순서 (2026-10-01): 주민 생활 → 분포 → 형성 원인 → 나머지(기존 순서 유지)
     — 주민 생활 삽화와 정보로 수업을 시작하도록, 모든 블록을 끼워 넣은 뒤 마지막에 정렬 */
  const HEAD = ["주민 생활", "분포", "형성 원인"];
  ["5-1", "5-2", "5-3", "5-4", "5-5", "5-6"].forEach(function (ch) {
    const bl = CHAPTER_CONTENT[ch].blocks;
    const head = HEAD.map(function (t) { return bl.filter(function (b) { return b.title === t; })[0]; }).filter(Boolean);
    CHAPTER_CONTENT[ch].blocks = head.concat(bl.filter(function (b) { return head.indexOf(b) < 0; }));
  });
})();
