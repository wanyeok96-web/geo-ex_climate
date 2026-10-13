/* ============================================================
   지오엑스-세계의 기후 — chapters/part5-sims3.js
   PART 5 시뮬레이터 3차 (2026-10-02) — 각 챕터 2차 시뮬레이터 다음에 끼워 넣음
   5-1 열대 우림 vs 플랜테이션 · 5-2 건조 지역의 농업 · 5-3 서안 vs 동안 겨울 바람
   5-5 백야 현상 — 지지 않는 해 · 5-6 적도 고산 vs 저지대의 하루
   변화량 · 지수는 설명용 예시 값(화면에 표시), 월별 기온은 data/cities.js 평년값, 태양 위치는 천문 계산
   ============================================================ */
"use strict";

(function () {
  const C = function (id) { return CITY_BY_ID[id]; };
  const K = P2F.kit;
  const MON = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  const clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  const f1 = function (v) { return Math.round(v * 10) / 10; };
  const deg = function (v) { return (v < 0 ? "−" : "") + Math.abs(f1(v)).toFixed(1) + "℃"; };
  const RAD = Math.PI / 180;
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
    bl.splice(i < 0 ? bl.length - 4 : i + 1, 0, block);
  }
  /* 슬라이더 + ▶ 재생 (값이 끝에 닿으면 처음부터) */
  function sliderCtl(id, label, min, max, step, val, playTxt) {
    return '<div class="av-ctl"><div class="p2-slider mw-sl"><label for="' + id + '">' + label + '</label><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><span class="p2-sl-v"></span></div>' +
      '<button type="button" class="anim-btn s3-play">▶ ' + playTxt + '</button></div>';
  }
  function bindSlider(el, id, min, max, perSec, set, get, playTxt) {
    const inp = el.querySelector("#" + id), btn = el.querySelector(".s3-play");
    let run = false;
    function sync() { btn.classList.toggle("on", run); btn.textContent = run ? "⏸ 멈춤" : "▶ " + playTxt; }
    btn.addEventListener("click", function () { run = !run; if (run && get() >= max) set(min); sync(); });
    inp.addEventListener("input", function () { run = false; sync(); set(+inp.value); });
    if (REDUCED) return function () {};
    let last = performance.now(), on = true;
    (function tick(now) {
      if (!on || !inp.isConnected) return;
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      if (run) { let v = get() + dt * perSec; if (v >= max) { v = max; run = false; sync(); } set(v); }
      requestAnimationFrame(tick);
    })(last);
    return function () { on = false; };
  }
  function blob(list, fill) { return '<g fill="' + fill + '">' + list.map(function (c) { return '<circle cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" r="' + f1(c[2]) + '"/>'; }).join("") + '</g>'; }

  /* ==========================================================
     5-1 열대 우림 vs 플랜테이션
     ========================================================== */
  const NT = 16, TW = 60, GY = 300;
  function rainTree(x, s, k) {
    const h = (70 + (k % 3) * 18) * s;
    return '<rect x="' + f1(x - 3 * s) + '" y="' + f1(GY - h) + '" width="' + f1(6 * s) + '" height="' + f1(h) + '" fill="#5d4330"/>' +
      blob([[x, GY - h - 6 * s, 20 * s], [x - 15 * s, GY - h + 6 * s, 15 * s], [x + 15 * s, GY - h + 6 * s, 15 * s]], k % 2 ? "#2f7d3e" : "#276b36") +
      blob([[x - 5 * s, GY - h - 12 * s, 9 * s]], "#4aa152");
  }
  function oilPalm(x, y, s) {
    let o = '<path d="M' + x + ' ' + y + ' v-' + f1(30 * s) + '" stroke="#7a5a36" stroke-width="' + f1(4 * s) + '"/>';
    [-160, -120, -60, -20, 200, 240].forEach(function (a, i) {
      const r = a * RAD, L = 20 * s;
      o += '<path d="M' + x + ' ' + f1(y - 30 * s) + ' q' + f1(Math.cos(r) * L * .6) + ' ' + f1(Math.sin(r) * L * .6 - 6 * s) + ' ' + f1(Math.cos(r) * L) + ' ' + f1(Math.sin(r) * L * .5 + 4 * s) + '" stroke="' + (i % 2 ? "#5fa83e" : "#4f9a2e") + '" stroke-width="' + f1(3 * s) + '" fill="none" stroke-linecap="round"/>';
    });
    return o;
  }
  function plantBlock() {
    let s = '<svg class="p2-svg pl-svg" viewBox="0 0 960 400" role="img" aria-label="열대 우림이 기름야자 농장으로 바뀌는 모습">' +
      '<defs><linearGradient id="pl-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cde8f6"/><stop offset="1" stop-color="#eef7ea"/></linearGradient></defs>' +
      '<rect width="960" height="400" fill="url(#pl-sky)"/>' +
      '<path d="M0 170 Q120 130 240 160 Q360 120 480 156 Q600 124 720 158 Q840 130 960 160 V300 H0Z" fill="#a7cfad" opacity=".6"/>';
    for (let i = 0; i < NT; i++) {
      const x0 = i * TW;
      let f = "", p = "";
      for (let k = 0; k < 3; k++) f += rainTree(x0 + 12 + k * 18, .9 + ((i + k) % 2) * .15, i + k);
      for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) p += oilPalm(x0 + 10 + k * 20 + r * 8, GY - r * 10, .9 - r * .15);
      s += '<g class="pl-t" data-i="' + i + '"><rect class="pl-soil" x="' + x0 + '" y="' + GY + '" width="' + TW + '" height="12"/>' +
        '<g class="pl-f">' + f + '</g><g class="pl-p">' + p + '</g>' +
        '<g class="pl-fire"><path d="M' + (x0 + 20) + ' ' + GY + ' q-14 -26 0 -54 q6 20 14 8 q10 28 -14 46Z" fill="#f08a24"/><path d="M' + (x0 + 40) + ' ' + GY + ' q-10 -18 0 -36 q6 14 10 6 q6 18 -10 30Z" fill="#ffd34a"/>' +
          '<g class="pl-smoke" fill="#9aa0a6"><circle cx="' + (x0 + 30) + '" cy="' + (GY - 110) + '" r="22"/><circle cx="' + (x0 + 50) + '" cy="' + (GY - 150) + '" r="28"/></g></g></g>';
    }
    s += '<rect y="312" width="960" height="88" fill="#b8562f"/><rect y="340" width="960" height="20" fill="#7d7d7d"/><path d="M0 350 H960" stroke="#fff" stroke-width="2" stroke-dasharray="20 16"/>' +
      '<g class="pl-truck"><rect x="-80" y="318" width="44" height="26" rx="3" fill="#e0483a"/><rect x="-36" y="324" width="20" height="20" rx="3" fill="#c0392b"/><circle cx="-70" cy="346" r="6" fill="#333"/><circle cx="-26" cy="346" r="6" fill="#333"/>' +
        '<g fill="#e07a24">' + [0, 1, 2].map(function (k) { return '<circle cx="' + (-74 + k * 12) + '" cy="314" r="6"/>'; }).join("") + '</g></g>' +
      '<g transform="translate(880 216)"><rect x="-40" y="0" width="80" height="84" fill="#bfc6cf"/><rect x="18" y="-46" width="14" height="46" fill="#9aa3ad"/><polygon points="-46,0 0,-26 46,0" fill="#8a93a0"/>' +
        '<text class="s2-t sm" x="0" y="54" text-anchor="middle">팜유 공장</text></g>' +
      '<g class="pl-orang"><circle cx="0" cy="0" r="9" fill="#c0612b"/><circle cx="-4" cy="-2" r="1.6" fill="#1b2233"/><circle cx="4" cy="-2" r="1.6" fill="#1b2233"/><path d="M-8 6 q8 12 16 0" fill="#c0612b"/><path d="M-9 4 q-12 10 -16 22 M9 4 q12 10 16 22" stroke="#c0612b" stroke-width="4" fill="none" stroke-linecap="round"/></g>' +
      '<text class="s2-t" x="16" y="34">열대 우림</text><text class="s2-t pl-ltr" x="944" y="34" text-anchor="end">기름야자 농장(플랜테이션)</text>' +
      '<g class="pl-guard" style="opacity:0"><path d="M0 296 H420" stroke="#2f8f3a" stroke-width="4" stroke-dasharray="10 6"/><g transform="translate(400 250)"><rect x="-2" y="0" width="4" height="46" fill="#6b4c35"/><rect x="-62" y="-6" width="124" height="30" rx="6" fill="#2f8f3a"/><text x="0" y="14" text-anchor="middle" class="pl-gt">보호 구역</text></g></g>' +
      '<text class="s2-t pl-year" x="480" y="40" text-anchor="middle"></text></svg>';
    return {
      title: "시뮬레이터 — 열대 우림 vs 플랜테이션",
      html: sliderCtl("pl-y", "연도", 1990, 2020, 1, 1990, "숲의 변화 보기") + '<div class="av-ctl"><div class="ed-grp"><span>정책</span>' + seg("plk", ["개발 그대로", "🛡️ 보호 구역 지정(1995년부터)"], 0) + '</div></div>' +
        '<div class="p2-row pl-read"></div>' +
        '<div class="pl-main"><div class="p2-figwrap">' + s + '</div>' +
          '<div class="pl-side"><div class="pl-card gain"><b>얻는 것</b><ul class="pts sm"><li>팜유 · 천연고무 수출 → 국가 소득</li><li>농장 · 공장의 일자리</li><li>도로 · 학교 등 지역 개발</li></ul></div>' +
            '<div class="pl-card loss"><b>잃는 것</b><ul class="pts sm"><li>생물 다양성 감소 — 오랑우탄 등 서식지 파괴</li><li>숲을 태울 때 연기(연무) · 탄소 배출</li><li>원주민의 삶터 · 흙의 침식</li></ul></div>' +
            '<div class="pl-card idea"><b>대안</b><ul class="pts sm"><li>보호 구역 지정</li><li>인증 팜유 · 이미 개간한 땅 활용</li><li>숲과 작물을 함께 기르는 혼농임업</li></ul></div></div></div>' +
        K.cap("동남아시아 섬 지역(보르네오 · 수마트라) 같은 곳의 변화를 나타낸 예시 모형 — 비율 · 지수는 설명용 값 (1990년 = 100)"),
      init: function (el) {
        const svg = el.querySelector(".pl-svg");
        let y = 1990, guard = false;
        function set(v) {
          y = Math.round(clamp(v, 1990, 2020));
          el.querySelector("#pl-y").value = y; el.querySelector(".p2-sl-v").textContent = y + "년";
          const t = (y - 1990) / 30, conv0 = .1 + .5 * Math.pow(t, 1.15), conv = guard ? Math.min(conv0, .1 + .2 * Math.pow(t, 1.15)) : conv0, n = Math.round(conv * NT), front = NT - n - 1;
          svg.querySelectorAll(".pl-t").forEach(function (g) {
            const i = +g.dataset.i, c = i >= NT - n;
            g.classList.toggle("conv", c); g.classList.toggle("burn", i === front && y > 1990 && y < 2020);
          });
          const fx = (NT - n) * TW;
          svg.querySelector(".pl-orang").setAttribute("transform", "translate(" + f1(Math.max(40, fx - 80)) + " 196)");
          svg.querySelector(".pl-truck").setAttribute("transform", "translate(" + f1(980 - (y - 1990) * 18 % 1040) + " 0)");
          svg.querySelector(".pl-year").textContent = y + "년";
          const forest = Math.round((1 - conv) * 100), farm = Math.round(conv * 100), oil = Math.round(100 * conv / .1), bio = Math.round(100 * Math.pow((1 - conv) / .9, 1.5));
          el.querySelector(".pl-read").innerHTML = big("숲 면적", forest + "%", "", "key") + big("농장 면적", farm + "%", "", "warm") +
            big("팜유 생산", oil + "", "1990년 = 100", "warm") + big("생물 다양성", bio + "", "1990년 = 100" + (bio < 100 ? " · 줄어듦" : ""), bio < 70 ? "cold" : "");
          svg.querySelector(".pl-guard").style.opacity = guard && y >= 1995 ? 1 : 0;
        }
        bindSeg(el, "plk", function (i) { guard = !!i; set(y); });
        set(1990);
        return bindSlider(el, "pl-y", 1990, 2020, 3, set, function () { return y; }, "숲의 변화 보기");
      }
    };
  }

  /* ==========================================================
     5-2 건조 지역의 농업 — 관개 농업 · 오아시스 농업 · 센터 피벗
     ========================================================== */
  const DM = [
    { n: "🌊 관개 농업", where: "나일강 · 인더스강 · 티그리스강 · 유프라테스강",
      how: ["큰 강의 물을 수로로 끌어 들여 밀 · 목화 · 쌀 재배", "강 상류의 비 · 눈 녹은 물이 사막까지 흘러옴(외래 하천)"],
      risk: "물을 많이 대면 증발하며 소금이 쌓임 → 토양 염류화", fix: "배수로를 만들어 소금기 있는 물을 빼냄 · 물을 알맞게 대기" },
    { n: "🌴 오아시스 농업", where: "사하라 · 아라비아의 오아시스",
      how: ["샘 · 우물 · 카나트로 얻은 물", "대추야자 그늘 아래 과일나무 · 밀 · 채소를 함께 기름(다층 재배)"],
      risk: "지하수를 많이 퍼 올리면 지하수면이 내려가 샘 · 우물이 마름", fix: "점적 관개 — 뿌리 근처에 물방울로 조금씩 → 물 사용 약 40% 절약" },
    { n: "💦 센터 피벗(현대식)", where: "사우디아라비아 · 리비아 · 미국 대평원",
      how: ["깊은 땅속 지하수를 펌프로 퍼 올림", "긴 팔이 한가운데를 축으로 돌며 물을 뿌림 → 원 모양 농경지"],
      risk: "수만 년 전에 고인 화석 지하수는 다시 채워지지 않음 → 고갈", fix: "퍼 올리는 양 제한 · 물을 덜 쓰는 작물 · 바닷물을 민물로 바꾸기(해수 담수화)" }
  ];
  function dmModel(m, yr, u, fx) {
    if (m === 0) { const salt = clamp(yr / 30 * 55 * Math.pow(u, 1.6) * (fx ? .3 : 1), 0, 80), area = 40 + 35 * u; return { area: area, harvest: area * (1 - Math.max(0, salt - 15) / 90), risk: salt, rl: "흙 속 소금", ru: "%" }; }
    if (m === 1) { const ue = fx ? u * .6 : u, d = 4 + yr * .3 * ue * ue, ok = d < 12 ? 1 : Math.max(0, 1 - (d - 12) / 6), area = 20 + 15 * u; return { area: area, harvest: area * ok, risk: d, rl: "지하수면 깊이", ru: "m" }; }
    const left = clamp(100 - yr * 2.4 * u * (fx ? .45 : 1), 0, 100), on = left > 15 ? 1 : left / 15, area = 40 + 50 * u; return { area: area, harvest: area * on, risk: left, rl: "남은 지하수", ru: "%" };
  }
  function dmScene(m, yr, u, fx) {
    const st = dmModel(m, yr, u, fx);
    let s = "";
    if (m === 0) {
      const w = 40 + 70 * u, salt = st.risk;
      s += '<rect width="960" height="400" fill="#e9cf96"/>' +
        '<path d="M430 0 Q470 100 440 200 Q410 300 460 400 H540 Q490 300 520 200 Q550 100 510 0Z" fill="#3a86c8"/>';
      [[-1, 0], [1, 1]].forEach(function (sd) {
        for (let r = 0; r < 8; r++) {
          const y = 12 + r * 48, cx = sd[0] < 0 ? 440 : 530;
          for (let c = 0; c < Math.ceil(w / 34); c++) {
            const x = sd[0] < 0 ? cx - 30 - (c + 1) * 34 : cx + 20 + c * 34;
            s += '<rect x="' + x + '" y="' + y + '" width="30" height="40" rx="3" fill="' + ["#6fae3e", "#88c44f", "#a8c85a"][(r + c) % 3] + '"/>';
            const nd = Math.round(salt / 8 * (c + 1) / 3);
            for (let d = 0; d < nd; d++) { const h1 = Math.sin((r * 31 + c * 17 + d * 7.3) * 12.9898) * 43758.5, h2 = Math.sin((r * 13 + c * 29 + d * 3.1) * 78.233) * 12345.6; s += '<circle cx="' + f1(x + 3 + (h1 - Math.floor(h1)) * 24) + '" cy="' + f1(y + 3 + (h2 - Math.floor(h2)) * 34) + '" r="2.2" fill="#fff"/>'; }
          }
          s += '<path d="M' + (sd[0] < 0 ? 440 : 530) + ' ' + (y + 20) + ' H' + (sd[0] < 0 ? 440 - w - 30 : 530 + w + 20) + '" stroke="#5aa6e0" stroke-width="3" stroke-dasharray="8 6"/>' +
            (fx ? '<path d="M' + (sd[0] < 0 ? 440 - w - 30 : 530 + w + 20) + ' ' + (y + 44) + ' H' + (sd[0] < 0 ? 440 : 530) + '" stroke="#8a6a3a" stroke-width="2.5" stroke-dasharray="3 4"/>' : "");
        }
      });
      s += '<text class="s2-t" x="485" y="390" text-anchor="middle">나일강</text><text class="s2-t sm" x="20" y="30">관개 수로 →</text>' +
        '<text class="s2-t sm" x="940" y="390" text-anchor="end">흰 점 = 쌓인 소금' + (fx ? ' · 갈색 점선 = 배수로' : '') + '</text>';
    } else if (m === 1) {
      const d = st.risk, wy = Math.min(394, 268 + d * 5.5), ok = d < 12 ? 1 : Math.max(0, 1 - (d - 12) / 6);
      const leaf = ok > .6 ? ["#3f8a3a", "#4f9d44"] : ok > .2 ? ["#9aa04a", "#b2a84e"] : ["#9a7a4a", "#b08a5a"];
      s += '<rect width="960" height="260" fill="#f6e2b6"/><rect y="260" width="960" height="140" fill="#c79a5d"/>' +
        '<rect y="' + f1(wy) + '" width="960" height="' + f1(400 - wy) + '" fill="#6aa7d4" opacity=".5"/>' +
        '<line x1="0" x2="960" y1="' + f1(wy) + '" y2="' + f1(wy) + '" stroke="#2b6fe3" stroke-width="3" stroke-dasharray="10 6"/>' +
        '<text class="s2-t sm" x="940" y="' + f1(wy - 6) + '" text-anchor="end">지하수면 ' + f1(d) + 'm</text>' +
        '<line x1="0" x2="960" y1="334" y2="334" stroke="#7a5230" stroke-width="2" stroke-dasharray="3 5"/><text class="s2-t sm" x="20" y="328">대추야자 뿌리 깊이 약 12m</text>';
      [140, 300, 460, 620, 780].forEach(function (x, i) {
        s += '<path d="M' + x + ' 260 v-150" stroke="#7a5a36" stroke-width="10"/>';
        [-150, -110, -60, -20, 200].forEach(function (a, k) { const r = a * RAD; s += '<path d="M' + x + ' 110 q' + f1(Math.cos(r) * 34) + ' ' + f1(Math.sin(r) * 34 - 10) + ' ' + f1(Math.cos(r) * 60) + ' ' + f1(Math.sin(r) * 30 + 14) + '" stroke="' + leaf[k % 2] + '" stroke-width="7" fill="none" stroke-linecap="round"/>'; });
        if (fx) s += '<g fill="#3a86c8">' + [-30, -10, 10].map(function (dx) { return '<circle cx="' + (x + 60 + dx) + '" cy="258" r="3"/>'; }).join("") + '</g><path d="M' + (x + 20) + ' 256 H' + (x + 90) + '" stroke="#2b2b2b" stroke-width="2"/>';
        if (ok > .3) s += blob([[x - 8, 118, 5], [x + 6, 120, 5], [x, 126, 5]], "#8a4a1a");
        s += blob([[x + 60, 222, 22], [x + 44, 232, 16], [x + 76, 232, 16]], leaf[0]) + '<rect x="' + (x + 57) + '" y="240" width="6" height="20" fill="#5d4330"/>';
        for (let k = 0; k < 4; k++) s += '<path d="M' + (x - 50 + k * 10) + ' 260 v-' + (ok > .4 ? 16 : 6) + '" stroke="' + (ok > .4 ? "#9ab34e" : "#b99a58") + '" stroke-width="3"/>';
      });
      s += '<g transform="translate(880 250)"><rect x="-26" y="-30" width="52" height="30" fill="#b5804a"/><path d="M-30 -30 h60" stroke="#6b4c35" stroke-width="5"/><path d="M-20 -30 v-30 h40 v30" stroke="#6b4c35" stroke-width="4" fill="none"/>' +
        '<path d="M0 0 V' + f1(wy - 250) + '" stroke="#2b6fe3" stroke-width="3" stroke-dasharray="4 4"/><text class="s2-t sm" x="0" y="-70" text-anchor="middle">우물</text></g>' +
        '<text class="s2-t" x="20" y="34">대추야자(위) · 과일나무(가운데) · 밀 · 채소(아래)</text>';
    } else {
      const left = st.risk, nOn = Math.round(3 + 5 * (u - .6)), dry = left <= 15;
      s += '<rect width="960" height="400" fill="#e3c58a"/>';
      for (let i = 0; i < 40; i++) s += '<ellipse cx="' + ((i * 97) % 760) + '" cy="' + ((i * 61) % 400) + '" rx="22" ry="5" fill="#d6b474" opacity=".6"/>';
      for (let k = 0; k < 8; k++) {
        const cx = 90 + (k % 4) * 180, cy = 110 + Math.floor(k / 4) * 180, on = k < nOn;
        const g = on ? (dry ? (left / 15 > .4 ? "#9fb85a" : "#b9a26a") : "#5fae3e") : "#cdb07a";
        s += '<circle cx="' + cx + '" cy="' + cy + '" r="78" fill="' + g + '" stroke="' + (on ? "#4f8a2e" : "#b99a58") + '" stroke-width="2"/>' +
          (on ? '<circle cx="' + cx + '" cy="' + cy + '" r="52" fill="none" stroke="#fff" stroke-width="1.5" opacity=".4"/><g class="dm-arm' + (left <= 0 ? " stop" : "") + '" style="transform-origin:' + cx + 'px ' + cy + 'px"><line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + 76) + '" y2="' + cy + '" stroke="#e6ebf2" stroke-width="5"/>' +
            (dry ? "" : '<circle cx="' + (cx + 40) + '" cy="' + (cy + 6) + '" r="6" fill="#bfe1f6" opacity=".8"/><circle cx="' + (cx + 64) + '" cy="' + (cy + 6) + '" r="6" fill="#bfe1f6" opacity=".8"/>') + '</g>' : "") +
          '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="#6d757e"/>';
      }
      s += '<g transform="translate(840 40)"><rect width="90" height="320" rx="12" fill="#fff" stroke="#d7dce5"/><rect x="20" y="40" width="50" height="240" rx="8" fill="#eef1f5"/>' +
        '<rect x="20" y="' + f1(40 + 240 * (1 - left / 100)) + '" width="50" height="' + f1(240 * left / 100) + '" rx="8" fill="#2b6fe3"/>' +
        '<text class="s2-t sm" x="45" y="28" text-anchor="middle">지하수</text><text class="s2-t sm" x="45" y="306" text-anchor="middle">' + Math.round(left) + '%</text></g>' +
        '<text class="s2-t" x="20" y="34">위에서 본 원 모양 농경지</text>';
    }
    return { svg: s, st: st };
  }
  function dryFarmBlock() {
    return {
      title: "시뮬레이터 — 건조 지역의 농업",
      html: '<div class="av-ctl">' + seg("dm", DM.map(function (d) { return d.n; }), 0) + '<div class="ed-grp"><span>물 사용</span>' + seg("dmu", ["적게", "보통", "많이"], 1) + '</div></div>' +
        '<div class="av-ctl"><div class="ed-grp"><span>해결 방법</span>' + seg("dmf", ["적용 안 함", "🛠️ 적용"], 0) + '</div></div>' +
        sliderCtl("dm-y", "지난 해", 0, 30, 1, 0, "30년 지나 보기") +
        '<div class="p2-row dm-read"></div>' +
        '<div class="dm-main"><div class="p2-figwrap"><svg class="p2-svg dm-svg" viewBox="0 0 960 400" role="img" aria-label="건조 지역의 농업"></svg></div><div class="s5-side dm-side"></div></div>' +
        K.cap("건조 지역은 비가 적어 강 · 지하수의 물을 끌어 와 농사(관개) — 넓이 · 수확 · 물 문제는 설명용 예시 값"),
      init: function (el) {
        let m = 0, u = 1, yr = 0, fx = false;
        const U = [.6, 1, 1.6];
        function set(v) {
          yr = Math.round(clamp(v, 0, 30));
          el.querySelector("#dm-y").value = yr; el.querySelector(".p2-sl-v").textContent = yr + "년";
          const r = dmScene(m, yr, u, fx), st = r.st, d = DM[m];
          el.querySelector(".dm-svg").innerHTML = r.svg;
          const bad = m === 2 ? st.risk <= 30 : m === 1 ? st.risk >= 10 : st.risk >= 25;
          el.querySelector(".dm-read").innerHTML = big("농경지", Math.round(st.area) + "", "처음 보통 사용 = 75 기준 지수") + big("수확", Math.round(st.harvest) + "", st.harvest < st.area * .7 ? "줄어듦" : "", "key") +
            big(st.rl, f1(st.risk) + st.ru, bad ? "위험" : "괜찮음", bad ? "warm" : "cold");
          el.querySelector(".dm-side").innerHTML = '<div class="dm-h">' + d.n + '</div><div class="dm-w">📍 ' + d.where + '</div><ul class="pts sm">' + d.how.map(function (t) { return '<li>' + t + '</li>'; }).join("") + '</ul>' +
            '<div class="dm-risk' + (bad ? " on" : "") + '">⚠️ ' + d.risk + '</div><div class="dm-fix' + (fx ? " on" : "") + '">🛠️ ' + d.fix + '</div>';
        }
        bindSeg(el, "dm", function (i) { m = i; set(0); });
        bindSeg(el, "dmu", function (i) { u = U[i]; set(yr); });
        bindSeg(el, "dmf", function (i) { fx = !!i; set(yr); });
        set(0);
        return bindSlider(el, "dm-y", 0, 30, 4, set, function () { return yr; }, "30년 지나 보기");
      }
    };
  }

  /* ==========================================================
     5-3 서안 vs 동안 겨울 바람
     ========================================================== */
  const CW = [
    { a: "London", b: "Seoul", n: "런던 · 서울", view: [-32, 68, 150, 18],
      w: { warm: [[[-40, 50], [-20, 52], [-3, 52]], [[-38, 44], [-18, 47], [-2, 49]]], cold: [[[100, 52], [112, 45], [124, 39]], [[96, 46], [108, 40], [120, 35]]], cur: [[-60, 38], [-30, 48], [-8, 58]], H: [100, 50, "시베리아 고기압"] },
      s: { cool: [[[-40, 50], [-20, 52], [-3, 52]]], warm: [[[138, 24], [133, 29], [129, 33]], [[134, 18], [126, 24], [121, 29]]], H: [140, 20, "북태평양 고기압"] } },
    { a: "Vancouver", b: "Quebec", n: "밴쿠버 · 퀘벡", view: [-150, 64, -45, 30],
      w: { warm: [[[-150, 48], [-138, 49], [-124, 49]], [[-150, 54], [-138, 53], [-126, 52]]], cold: [[[-98, 58], [-84, 52], [-72, 47]], [[-100, 52], [-86, 48], [-74, 44]]], cur: [[-155, 42], [-140, 50], [-130, 56]], H: [-100, 58, "캐나다 고기압"] },
      s: { cool: [[[-150, 48], [-138, 49], [-124, 49]]], warm: [[[-95, 34], [-84, 40], [-73, 45]]], H: [-140, 36, "북태평양 고기압"] } }
  ];
  function coastWindBlock() {
    return {
      title: "시뮬레이터 — 서안 vs 동안 겨울 바람",
      html: '<div class="av-ctl">' + seg("cwp", CW.map(function (p) { return p.n; }), 0) + seg("cws", ["❄️ 1월(겨울)", "☀️ 7월(여름)"], 0) + '</div>' +
        '<div class="p2-row cw-read"></div>' +
        '<div class="s5-main"><div class="p2-mapbox cw-map"></div><div class="s5-side cw-side"></div></div>' +
        K.cap("같은 대륙의 서쪽(서안)과 동쪽(동안) — 겨울에 어디에서 오는 바람을 맞는지가 기온을 가름 · 기온은 평년값, 바람은 모식"),
      init: function (el) {
        let p = 0, sw = 0;
        let map = K.makeMap(el.querySelector(".cw-map"), { legend: false, info: false, view: CW[0].view, latLines: true }, draw);
        el.querySelector(".cw-map").classList.add("muted");
        function draw(u) {
          const P = CW[p], S = sw ? P.s : P.w, a = C(P.a), b = C(P.b);
          let o = "";
          if (S.cur) o += K.geoArrow(S.cur, u, "p2-cur warm", .9, true) + K.geoText(S.cur[1][0] - 4, S.cur[1][1] - 6, "난류", u, "cw-t warm", "middle", 3);
          (S.warm || []).forEach(function (pt) { o += K.geoArrow(pt, u, "cw-a warm", 1.3, true); });
          (S.cool || []).forEach(function (pt) { o += K.geoArrow(pt, u, "cw-a cool", 1.1, true); });
          (S.cold || []).forEach(function (pt) { o += K.geoArrow(pt, u, "cw-a cold", 1.3, true); });
          const H = S.H;
          o += '<g class="cw-h"><circle cx="' + H[0] + '" cy="' + (-H[1]) + '" r="' + f1(4 * u) + '" stroke-width="' + f1(.6 * u) + '"/>' +
            '<text x="' + H[0] + '" y="' + f1(-H[1] + 1.8 * u) + '" font-size="' + f1(5 * u) + '" text-anchor="middle">H</text></g>' + K.geoText(H[0], H[1] - 8 * u, H[2], u, "cw-t", "middle", 3);
          [[a, "a"], [b, "b"]].forEach(function (x) {
            const c = x[0], t = c.t[sw ? 6 : 0];
            o += '<circle class="cw-c ' + x[1] + '" cx="' + c.lon + '" cy="' + (-c.lat) + '" r="' + f1(2.4 * u) + '" stroke-width="' + f1(.7 * u) + '"/>' +
              K.geoText(c.lon + (x[1] === "a" ? 0 : 2 * u), c.lat + (x[1] === "b" && sw ? 4 * u : -6 * u), c.kr + " " + deg(t), u, "cw-ct " + x[1], "middle", 3.6);
          });
          return o;
        }
        function chart(a, b) {
          const X = function (i) { return 30 + i * 24; }, lo = Math.min(Math.min.apply(null, a.t), Math.min.apply(null, b.t), -10), hi = Math.max(Math.max.apply(null, a.t), Math.max.apply(null, b.t), 25);
          const Y = function (t) { return 150 - (t - lo) / (hi - lo) * 130; }, line = function (c, k) { return '<polyline class="cw-l ' + k + '" points="' + c.t.map(function (t, i) { return X(i) + "," + f1(Y(t)); }).join(" ") + '"/>'; };
          return '<svg class="p2-svg" viewBox="0 0 320 175"><line x1="24" x2="300" y1="' + f1(Y(0)) + '" y2="' + f1(Y(0)) + '" stroke="#8a93a6"/><text class="p2-ax" x="20" y="' + f1(Y(0) + 4) + '" text-anchor="end">0</text>' +
            '<rect x="' + (X(sw ? 6 : 0) - 10) + '" y="14" width="20" height="142" rx="6" fill="#ffe7a8" opacity=".6"/>' + line(a, "a") + line(b, "b") +
            [0, 3, 6, 9].map(function (i) { return '<text class="p2-ax" x="' + X(i) + '" y="170" text-anchor="middle">' + (i + 1) + '월</text>'; }).join("") + '</svg>';
        }
        function set() {
          const P = CW[p], a = C(P.a), b = C(P.b), m = sw ? 6 : 0, ra = Math.max.apply(null, a.t) - Math.min.apply(null, a.t), rb = Math.max.apply(null, b.t) - Math.min.apply(null, b.t);
          map.draw(draw);
          el.querySelector(".cw-read").innerHTML = big(a.kr + " (서안)", deg(a.t[m]), Math.abs(a.lat).toFixed(1) + "°N · 연교차 " + deg(ra), "warm") +
            big(b.kr + " (동안)", deg(b.t[m]), Math.abs(b.lat).toFixed(1) + "°N · 연교차 " + deg(rb), "cold") +
            big("위도 차이", Math.abs(a.lat - b.lat).toFixed(1) + "°", a.lat > b.lat ? a.kr + "이 더 북쪽" : b.kr + "이 더 북쪽", "key");
          el.querySelector(".cw-side").innerHTML = '<div class="cw-lg"><span class="a">● ' + a.kr + '</span><span class="b">● ' + b.kr + '</span> 월평균 기온</div>' + chart(a, b) +
            (sw ? '<ul class="pts sm"><li>서안: 바다에서 오는 <b>서늘한</b> 편서풍 → 여름이 덜 더움</li><li>동안: 바다에서 오는 덥고 습한 <b>여름 계절풍</b> → 무덥고 비가 많음</li></ul>'
                : '<ul class="pts sm"><li>서안: 난류 위를 지나온 <b>따뜻한 편서풍</b> → 겨울이 온화</li><li>동안: 대륙 고기압에서 부는 <b>차고 건조한 바람</b> → 겨울이 매우 추움</li><li>그래서 동안이 연교차가 큼</li></ul>');
        }
        bindSeg(el, "cwp", function (i) { p = i; el.querySelector(".cw-map").innerHTML = ""; map = K.makeMap(el.querySelector(".cw-map"), { legend: false, info: false, view: CW[p].view, latLines: true }, draw); set(); });
        bindSeg(el, "cws", function (i) { sw = i; set(); });
        set();
      }
    };
  }

  /* ==========================================================
     5-5 백야 현상 — 지지 않는 해 (지평선 파노라마 + 북극 위에서 본 낮 · 밤)
     ========================================================== */
  const MS_LAT = [[66.6, "북극권 66.6°N"], [69.6, "트롬쇠 69.6°N"], [78.2, "롱위에아뷔엔 78.2°N"], [37.6, "서울 37.6°N"]];
  const MS_DATE = [[23.44, "6월 21일 무렵"], [0, "3월 21일 무렵"], [-23.44, "12월 21일 무렵"]];
  function sunAt(lat, dec, h) {
    const Hh = (h - 12) * 15 * RAD, p = lat * RAD, d = dec * RAD;
    const sa = Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(Hh), alt = Math.asin(sa);
    let az = Math.atan2(Math.sin(Hh), Math.cos(Hh) * Math.sin(p) - Math.tan(d) * Math.cos(p)) / RAD + 180;   // 북 = 0°, 시계 방향
    return { alt: alt / RAD, az: (az + 360) % 360 };
  }
  function dayLen(lat, dec) { const c = -Math.tan(lat * RAD) * Math.tan(dec * RAD); return c <= -1 ? 24 : c >= 1 ? 0 : 2 * Math.acos(c) / RAD / 15; }
  function midnightSunBlock() {
    const PW = 640, PH = 300, HY = 220, AS = 2.6;
    const PX = function (az) { return ((az + 180) % 360) / 360 * PW; };            // 가운데 = 북쪽
    let pano = '<svg class="p2-svg ms-pano" viewBox="0 0 ' + PW + ' ' + PH + '" role="img" aria-label="지평선을 따라 도는 해">' +
      '<rect class="ms-sky" width="' + PW + '" height="' + HY + '"/>' +
      '<polygon points="0,' + HY + ' 60,196 120,206 200,186 260,204 320,192 380,206 440,188 520,204 580,194 640,' + HY + '" fill="#5f7a6a"/>' +
      '<rect y="' + HY + '" width="' + PW + '" height="' + (PH - HY) + '" fill="#e9f0f6"/>' +
      '<line x1="0" x2="' + PW + '" y1="' + HY + '" y2="' + HY + '" stroke="#1b2233" stroke-width="2"/>' +
      [["남", 0], ["서", 90], ["북", 180], ["동", 270], ["남", 360]].map(function (d) { const x = d[1] / 360 * PW; return '<line x1="' + x + '" x2="' + x + '" y1="' + HY + '" y2="' + (HY + 10) + '" stroke="#1b2233" stroke-width="2"/><text class="s2-t" x="' + clamp(x, 14, PW - 14) + '" y="' + (HY + 30) + '" text-anchor="middle">' + d[0] + '</text>'; }).join("") +
      '<g class="ms-path"></g><g class="ms-sun"><circle r="13"/></g>' +
      '<g transform="translate(120 212)"><rect x="-10" y="-14" width="20" height="14" fill="#d24a3a"/><polygon points="-13,-14 0,-24 13,-14" fill="#6b3a2a"/><rect x="18" y="-10" width="16" height="10" fill="#2b6fe3"/><polygon points="16,-10 26,-18 36,-10" fill="#264d8f"/></g>' +
      '<text class="s2-t ms-clock" x="16" y="30"></text></svg>';
    const R = 150, rr = function (lat) { return (90 - lat) / 60 * R; };
    let polar = '<svg class="p2-svg ms-polar" viewBox="-175 -185 350 360" role="img" aria-label="북극 위에서 본 낮과 밤">' +
      '<circle r="' + R + '" fill="#cfe6f8" stroke="#1b2233" stroke-width="2"/>' +
      '<g class="ms-night"></g>' +
      [60, 66.56].map(function (l) { return '<circle r="' + f1(rr(l)) + '" fill="none" stroke="' + (l > 66 ? "#e0483a" : "#8a93a6") + '" stroke-width="' + (l > 66 ? 2 : 1) + '" stroke-dasharray="5 4"/>'; }).join("") +
      '<text class="s2-t sm" x="0" y="' + f1(-rr(66.56) - 4) + '" text-anchor="middle" fill="#c0392b">북극권</text>' +
      '<circle r="4" fill="#1b2233"/><text class="s2-t sm" x="6" y="14">북극점</text>' +
      '<g transform="translate(0 -172)"><circle r="10" fill="#ffd54a" stroke="#f6a821" stroke-width="2"/><text class="s2-t sm" x="16" y="5">햇빛 방향</text></g>' +
      '<g class="ms-city"><circle r="7" fill="#e0483a" stroke="#fff" stroke-width="2.5"/></g>' +
      '<text class="s2-t sm" x="0" y="172" text-anchor="middle">회색 = 밤 · 빨간 점 = 우리 마을(하루 한 바퀴)</text></svg>';
    return {
      title: "시뮬레이터 — 백야 현상: 지지 않는 해",
      html: '<div class="av-ctl">' + seg("msl", MS_LAT.map(function (x) { return x[1]; }), 1) + seg("msd", MS_DATE.map(function (x) { return x[1]; }), 0) + '</div>' +
        sliderCtl("ms-h", "시각", 0, 24, .1, 0, "하루 재생") +
        '<div class="p2-row ms-read"></div>' +
        '<div class="ms-main"><div class="p2-figwrap">' + pano + '</div><div class="p2-figwrap ms-pw">' + polar + '</div></div>' +
        K.cap("왼쪽: 마을에서 본 하늘(가운데 = 북쪽) · 점선 = 하루 동안 해가 지나는 길 / 오른쪽: 북극 위에서 내려다본 지구 — 태양 위치는 천문 계산(대기 굴절 무시)"),
      init: function (el) {
        let li = 1, di = 0, h = 0;
        const pano = el.querySelector(".ms-pano"), polarSvg = el.querySelector(".ms-polar");
        function nightMask() {
          const dec = MS_DATE[di][0];
          let d = "";
          for (let lat = 30; lat < 90; lat += 2) for (let a = 0; a < 360; a += 6) {
            const Hh = a * RAD, p = (lat + 1) * RAD, de = dec * RAD;
            if (Math.sin(p) * Math.sin(de) + Math.cos(p) * Math.cos(de) * Math.cos(Hh) >= 0) continue;
            const r1 = rr(lat), r2 = rr(lat + 2), a1 = (a - 3 - 90) * RAD, a2 = (a + 3 - 90) * RAD;
            d += "M" + f1(r1 * Math.cos(a1)) + " " + f1(r1 * Math.sin(a1)) + "L" + f1(r1 * Math.cos(a2)) + " " + f1(r1 * Math.sin(a2)) + "L" + f1(r2 * Math.cos(a2)) + " " + f1(r2 * Math.sin(a2)) + "L" + f1(r2 * Math.cos(a1)) + " " + f1(r2 * Math.sin(a1)) + "Z";
          }
          polarSvg.querySelector(".ms-night").innerHTML = '<path d="' + d + '" fill="#26325a" opacity=".72"/>';
        }
        function path() {
          const lat = MS_LAT[li][0], dec = MS_DATE[di][0];
          let segs = [], cur = [], prevX = null;
          for (let t = 0; t <= 24.001; t += .25) {
            const s = sunAt(lat, dec, t), x = PX(s.az), y = HY - s.alt * AS;
            if (prevX !== null && Math.abs(x - prevX) > PW / 2) { segs.push(cur); cur = []; }
            cur.push(f1(x) + "," + f1(y)); prevX = x;
          }
          segs.push(cur);
          pano.querySelector(".ms-path").innerHTML = segs.map(function (sg) { return '<polyline points="' + sg.join(" ") + '" fill="none" stroke="#f6a821" stroke-width="2.5" stroke-dasharray="6 5"/>'; }).join("");
        }
        function set(v) {
          h = clamp(v, 0, 24);
          const lat = MS_LAT[li][0], dec = MS_DATE[di][0], s = sunAt(lat, dec, h), L = dayLen(lat, dec);
          el.querySelector("#ms-h").value = h;
          const hh = Math.floor(h) % 24, mm = Math.round((h % 1) * 60) % 60, tt = hh + ":" + (mm < 10 ? "0" : "") + mm;
          el.querySelector(".p2-sl-v").textContent = tt;
          pano.querySelector(".ms-sun").setAttribute("transform", "translate(" + f1(PX(s.az)) + " " + f1(HY - s.alt * AS) + ")");
          pano.querySelector(".ms-sun").classList.toggle("down", s.alt < 0);
          const a = s.alt, sky = a > 10 ? "#8ec5ee" : a > 0 ? "#f6c48a" : a > -6 ? "#7f8fc0" : "#1c2748";
          pano.querySelector(".ms-sky").setAttribute("fill", sky);
          pano.querySelector(".ms-clock").textContent = tt + " · 해의 높이 " + f1(a).toFixed(1) + "°";
          pano.querySelector(".ms-clock").setAttribute("class", "s2-t ms-clock" + (a < -6 ? " w" : ""));
          const ang = ((h - 12) * 15 - 90) * RAD, r = rr(Math.max(30, lat));
          polarSvg.querySelector(".ms-city").setAttribute("transform", "translate(" + f1(r * Math.cos(ang)) + " " + f1(r * Math.sin(ang)) + ")");
          const state = L >= 24 ? "백야" : L <= 0 ? "극야" : "해가 뜨고 짐";
          const minA = sunAt(lat, dec, 0).alt;
          el.querySelector(".ms-read").innerHTML = big("오늘의 하늘", state, L >= 24 ? "하루 종일 해가 지평선 위" : L <= 0 ? "하루 종일 해가 지평선 아래" : "", L >= 24 ? "warm" : L <= 0 ? "cold" : "key") +
            big("낮의 길이", L >= 24 ? "24시간" : L <= 0 ? "0시간" : Math.floor(L) + "시간 " + Math.round((L % 1) * 60) + "분", "") +
            big("자정의 해 높이", f1(minA).toFixed(1) + "°", minA >= 0 ? "자정에도 지평선 위" : "자정에는 지평선 아래", minA >= 0 ? "warm" : "");
        }
        bindSeg(el, "msl", function (i) { li = i; path(); set(h); });
        bindSeg(el, "msd", function (i) { di = i; nightMask(); path(); set(h); });
        nightMask(); path(); set(0);
        return bindSlider(el, "ms-h", 0, 24, 2.4, set, function () { return h; }, "하루 재생");
      }
    };
  }

  /* ==========================================================
     5-6 적도 고산 vs 저지대의 하루 — 키토 · 이키토스
     ========================================================== */
  const HD = [
    { id: "Quito", alt: "해발 약 2,850m", range: 11, hi: true },
    { id: "Iquitos", alt: "해발 약 106m", range: 9.5, hi: false }
  ];
  function dayT(c, R, h) {
    const mean = c.t.reduce(function (a, b) { return a + b; }, 0) / 12;
    const x = ((h % 24) + 24) % 24;
    const f = x >= 6 && x <= 14 ? -Math.cos(Math.PI * (x - 6) / 8) : Math.cos(Math.PI * (((x - 14) + 24) % 24) / 16);
    return mean + R / 2 * f;
  }
  function person(t) {
    const coat = t < 13 ? "#3d5a99" : t < 20 ? "#7a5cc8" : "#f0b43a", longArm = t < 20;
    return '<circle cx="0" cy="-58" r="9" fill="#c98f62"/>' + (t < 13 ? '<path d="M-10 -66 q10 -12 20 0" fill="#2c3e66"/>' : "") +
      '<rect x="-11" y="-48" width="22" height="30" rx="5" fill="' + coat + '"/>' +
      '<path d="M-11 -44 l-' + (longArm ? 9 : 6) + ' ' + (longArm ? 22 : 12) + ' M11 -44 l' + (longArm ? 9 : 6) + ' ' + (longArm ? 22 : 12) + '" stroke="' + (longArm ? coat : "#c98f62") + '" stroke-width="6" stroke-linecap="round"/>' +
      '<rect x="-9" y="-18" width="7" height="18" fill="#3d2f2a"/><rect x="2" y="-18" width="7" height="18" fill="#3d2f2a"/>';
  }
  function dayHighBlock() {
    const panel = function (k) {
      const hi = HD[k].hi;
      return '<g class="hd-p" transform="translate(' + (k * 480) + ' 0)"><rect class="hd-sky" width="470" height="240" rx="14"/>' +
        '<g class="hd-sun"><circle r="16" fill="#ffd54a" stroke="#f6a821" stroke-width="3"/></g><g class="hd-moon"><circle r="12" fill="#f3f0d8"/></g>' +
        (hi ? '<polygon points="0,240 0,150 80,90 140,130 210,60 290,120 360,80 470,150 470,240" fill="#8a7d6a"/><polygon points="210,60 196,80 210,76 222,88 232,74" fill="#fff"/>' +
              Array.from({ length: 10 }, function (_, i) { return '<rect x="' + (120 + i * 24) + '" y="' + (176 + (i % 2) * 6) + '" width="20" height="16" fill="' + ["#f3ecd9", "#e8c9a0", "#d98f6a"][i % 3] + '" stroke="#b5a58a"/>'; }).join("")
            : '<rect y="180" width="470" height="60" fill="#3a86c8"/>' + Array.from({ length: 8 }, function (_, i) { return blob([[30 + i * 52, 160 + (i % 2) * 8, 28], [48 + i * 52, 150, 20]], i % 2 ? "#2f7d3e" : "#276b36"); }).join("")) +
        '<rect y="236" width="470" height="24" rx="6" fill="' + (hi ? "#a4a45c" : "#4f9a3e") + '"/>' +
        '<g class="hd-man" transform="translate(70 236)"></g>' +
        '<g transform="translate(420 40)"><rect x="-10" y="0" width="20" height="120" rx="10" fill="#fff" stroke="#c9d8ea" stroke-width="2"/><rect class="hd-merc" x="-5" y="110" width="10" height="0" rx="5" fill="#e0483a"/><circle cy="126" r="14" fill="#e0483a" stroke="#fff" stroke-width="3"/></g>' +
        '<text class="s2-t hd-t" x="18" y="36"></text>' +
        '<text class="s2-t sm" x="14" y="276">' + C(HD[k].id).kr + ' · ' + HD[k].alt + '</text></g>';
    };
    const svg = '<svg class="p2-svg hd-svg" viewBox="0 0 950 290" role="img" aria-label="키토와 이키토스의 하루">' + panel(0) + panel(1) + '</svg>';
    return {
      title: "시뮬레이터 — 적도 고산 vs 저지대의 하루",
      html: sliderCtl("hd-h", "시각", 0, 24, .1, 6, "하루 재생") +
        '<div class="p2-row hd-read"></div>' +
        '<div class="p2-figwrap hd-fig">' + svg + '</div>' +
        '<div class="hd-bot"><div class="p2-figwrap hd-cw"><svg class="p2-svg hd-chart" viewBox="0 0 620 200"></svg></div><div class="s5-side hd-side"></div></div>' +
        K.cap("두 도시 모두 적도 부근(남위 약 0°~4°) — 하루 기온은 평년값의 연평균과 하루 기온 차(근사값)로 만든 예시 곡선"),
      init: function (el) {
        const svgEl = el.querySelector(".hd-svg"), ch = el.querySelector(".hd-chart");
        let h = 6;
        const lo = 5, hi = 36, X = function (x) { return 50 + x / 24 * 550; }, Y = function (t) { return 175 - (t - lo) / (hi - lo) * 160; };
        let base = '<rect x="50" y="15" width="550" height="160" fill="#f7f9fc"/>' + [10, 20, 30].map(function (t) { return '<line x1="50" x2="600" y1="' + f1(Y(t)) + '" y2="' + f1(Y(t)) + '" class="p2-grid"/><text class="p2-ax" x="44" y="' + f1(Y(t) + 4) + '" text-anchor="end">' + t + '℃</text>'; }).join("") +
          [0, 6, 12, 18, 24].map(function (x) { return '<text class="p2-ax" x="' + f1(X(x)) + '" y="192" text-anchor="middle">' + x + '시</text>'; }).join("");
        HD.forEach(function (d, k) {
          const c = C(d.id); let pts = "";
          for (let x = 0; x <= 24; x += .5) pts += f1(X(x)) + "," + f1(Y(dayT(c, d.range, x))) + " ";
          base += '<polyline class="hd-l k' + k + '" points="' + pts + '"/>';
          base += '<text class="hd-lb k' + k + '" x="' + f1(X(3)) + '" y="' + f1(Y(dayT(c, d.range, 3)) - 9) + '">' + c.kr + '</text>';
        });
        base += '<line class="hd-now" y1="15" y2="175"/>';
        ch.innerHTML = base;
        const yrRange = function (c) { return Math.max.apply(null, c.t) - Math.min.apply(null, c.t); };
        el.querySelector(".hd-side").innerHTML = '<div class="hd-st">일교차 vs 연교차</div>' + HD.map(function (d, k) {
          const c = C(d.id), yr = yrRange(c);
          return '<div class="hd-cmp k' + k + '"><b>' + c.kr + '</b><div class="hd-bar"><span>일교차</span><i style="width:' + (d.range / 12 * 100) + '%"></i><em>약 ' + d.range + '℃</em></div>' +
            '<div class="hd-bar y"><span>연교차</span><i style="width:' + (yr / 12 * 100) + '%"></i><em>' + deg(yr) + '</em></div></div>';
        }).join("") + '<ul class="pts sm"><li>두 도시 모두 연교차는 1℃ 안팎 — 적도 부근은 계절 차이가 거의 없음</li><li>고산 도시 키토는 하루 종일 서늘 → <b>상춘 기후</b>, 아침 · 밤에는 겉옷</li><li>저지대 이키토스는 밤에도 덥고 습함</li></ul>';
        function set(v) {
          h = clamp(v, 0, 24);
          el.querySelector("#hd-h").value = h;
          const hh = Math.floor(h) % 24, mm = Math.round((h % 1) * 60) % 60, tt = hh + ":" + (mm < 10 ? "0" : "") + mm;
          el.querySelector(".p2-sl-v").textContent = tt;
          const day = h >= 6 && h <= 18, a = (h - 6) / 12 * Math.PI, sx = 40 + (h - 6) / 12 * 340, sy = 200 - Math.sin(clamp(a, 0, Math.PI)) * 160;
          const temps = HD.map(function (d) { return dayT(C(d.id), d.range, h); });
          svgEl.querySelectorAll(".hd-p").forEach(function (g, k) {
            g.querySelector(".hd-sky").setAttribute("fill", day ? (h < 7 || h > 17 ? "#f6c48a" : HD[k].hi ? "#5aa6ee" : "#a9d4f0") : "#1c2748");
            g.querySelector(".hd-sun").setAttribute("transform", "translate(" + f1(sx) + " " + f1(sy) + ")"); g.querySelector(".hd-sun").style.opacity = day ? 1 : 0;
            const mh = (h + 12) % 24, ma = (mh - 6) / 12 * Math.PI;
            g.querySelector(".hd-moon").setAttribute("transform", "translate(" + f1(40 + (mh - 6) / 12 * 340) + " " + f1(200 - Math.sin(clamp(ma, 0, Math.PI)) * 160) + ")"); g.querySelector(".hd-moon").style.opacity = day ? 0 : 1;
            g.querySelector(".hd-man").innerHTML = person(temps[k]);
            const hgt = clamp((temps[k] - 0) / 35 * 110, 4, 110);
            g.querySelector(".hd-merc").setAttribute("y", f1(120 - hgt)); g.querySelector(".hd-merc").setAttribute("height", f1(hgt));
            g.querySelector(".hd-t").textContent = deg(temps[k]);
            g.querySelector(".hd-t").setAttribute("class", "s2-t hd-t" + (day ? "" : " w"));
          });
          const ln = ch.querySelector(".hd-now"); ln.setAttribute("x1", f1(X(h))); ln.setAttribute("x2", f1(X(h)));
          const wear = function (t) { return t < 13 ? "두꺼운 겉옷" : t < 20 ? "긴소매" : "반소매"; };
          el.querySelector(".hd-read").innerHTML = big("시각", tt, day ? "낮" : "밤") + big("키토", deg(temps[0]), wear(temps[0]), "cold") + big("이키토스", deg(temps[1]), wear(temps[1]), "warm") +
            big("두 도시 기온 차", deg(temps[1] - temps[0]), "해발 고도 차이 약 2,700m", "key");
        }
        set(6);
        return bindSlider(el, "hd-h", 0, 24, 2.4, set, function () { return h; }, "하루 재생");
      }
    };
  }

  insertAfterPrefix("5-1", "시뮬레이터 — 화전", plantBlock());
  insertAfterPrefix("5-2", "시뮬레이터 — 초원", dryFarmBlock());
  insertAfterPrefix("5-3", "시뮬레이터 — 세 온대", coastWindBlock());
  insertAfterPrefix("5-5", "시뮬레이터 — 백야와 극야", midnightSunBlock());
  insertAfterPrefix("5-6", "시뮬레이터 — 높이 올라가면", dayHighBlock());
})();
