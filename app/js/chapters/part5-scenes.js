/* ============================================================
   지오엑스-세계의 기후 — chapters/part5-scenes.js
   PART 5 「경관 탐험」 (2026-09-30) — 기후대마다 큰 경관 삽화(SVG) + 번호 누르기 → 설명 카드
   각 챕터 「식생 · 경관」 다음에 끼워 넣음 · 그림은 코드로 그린 모식도(실제 축척 아님)
   ============================================================ */
"use strict";

(function () {
  const W = 960, H = 540;
  function insertAfter(ch, title, block) {
    const bl = CHAPTER_CONTENT[ch].blocks, i = bl.findIndex(function (b) { return b.title === title; });
    bl.splice(i < 0 ? 2 : i + 1, 0, block);
  }
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  const f1 = function (v) { return Math.round(v * 10) / 10; };

  /* ---------- 그림 부품 ---------- */
  function grad(id, stops, x2, y2) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 || 0) + '" y2="' + (y2 === undefined ? 1 : y2) + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] !== undefined ? ' stop-opacity="' + s[2] + '"' : "") + '/>'; }).join("") + '</linearGradient>';
  }
  function blobs(list, fill, extra) {            // [[x, y, r], ...] 둥근 수관
    return '<g fill="' + fill + '"' + (extra || "") + '>' + list.map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '"/>'; }).join("") + '</g>';
  }
  function palm(x, y, h, lean) {                 // 야자: 밑동 (x, y), 높이 h
    const tx = x + (lean || 0), ty = y - h;
    let s = '<path d="M' + x + ' ' + y + ' Q' + (x + (lean || 0) * .2) + ' ' + (y - h * .55) + ' ' + tx + ' ' + ty + '" stroke="#7a5a36" stroke-width="' + Math.max(4, h / 18) + '" fill="none" stroke-linecap="round"/>';
    [-150, -120, -80, -40, -10, 20, 200].forEach(function (a, i) {
      const r = a * Math.PI / 180, L = h * (i % 2 ? .42 : .5);
      const ex = tx + Math.cos(r) * L, ey = ty + Math.sin(r) * L * .7 + L * .25;
      const mx = tx + Math.cos(r) * L * .5, my = ty + Math.sin(r) * L * .5 - L * .12;
      s += '<path d="M' + tx + ' ' + ty + ' Q' + f1(mx) + ' ' + f1(my) + ' ' + f1(ex) + ' ' + f1(ey) + '" stroke="' + (i % 2 ? "#3f8a3a" : "#4f9d44") + '" stroke-width="' + Math.max(3, h / 26) + '" fill="none" stroke-linecap="round"/>';
    });
    return s + '<circle cx="' + tx + '" cy="' + (ty + 4) + '" r="' + Math.max(3, h / 30) + '" fill="#8a5a2b"/>';
  }
  function conifer(x, y, h, col, snow) {         // 침엽수: 밑동 (x, y)
    const w = h * .34;
    let s = '<rect x="' + (x - h * .03) + '" y="' + (y - h * .16) + '" width="' + (h * .06) + '" height="' + (h * .16) + '" fill="#5b3f2a"/>';
    for (let k = 0; k < 3; k++) {
      const top = y - h + k * h * .26, bot = y - h * .12 - (2 - k) * h * .2, ww = w * (.55 + k * .25);
      s += '<polygon points="' + x + ',' + f1(top) + ' ' + f1(x - ww) + ',' + f1(bot) + ' ' + f1(x + ww) + ',' + f1(bot) + '" fill="' + col + '"/>';
      if (snow) s += '<polygon points="' + x + ',' + f1(top) + ' ' + f1(x - ww * .45) + ',' + f1(top + (bot - top) * .45) + ' ' + f1(x + ww * .45) + ',' + f1(top + (bot - top) * .45) + '" fill="#fff" opacity=".92"/>';
    }
    return s;
  }
  function spot(i, x, y) {
    return '<g class="sx-spot" data-i="' + i + '" transform="translate(' + x + ' ' + y + ')" tabindex="0" role="button" aria-label="' + (i + 1) + '번 살펴보기">' +
      '<circle class="sx-pulse" r="17"/><circle class="sx-dot" r="15"/><text y="6" text-anchor="middle">' + (i + 1) + '</text></g>';
  }

  /* ---------- 블록 틀 ---------- */
  function sceneBlock(o) {
    const svg = '<svg class="p2-svg sx-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + o.label + '">' +
      '<defs>' + o.defs + '</defs>' + o.art +
      '<g class="sx-spots">' + o.spots.map(function (p, i) { return spot(i, p.x, p.y); }).join("") + '</g></svg>';
    return {
      title: "경관 탐험 — " + o.name,
      html: '<div class="s5-main sx"><div class="p2-figwrap sx-fig">' + svg + '</div>' +
        '<div class="s5-side sx-side"><div class="sx-list">' + o.spots.map(function (p, i) {
          return '<button type="button" class="sx-b" data-i="' + i + '"><i>' + (i + 1) + '</i>' + p.t + '</button>'; }).join("") + '</div>' +
          '<div class="sx-card" aria-live="polite"></div>' +
          '<button type="button" class="anim-btn sx-tour">▶ 차례로 살펴보기</button></div></div>' +
        '<p class="p2-cap">' + fmtKo(o.cap) + '</p>',
      init: function (el) {
        const card = el.querySelector(".sx-card"), tourBtn = el.querySelector(".sx-tour");
        let cur = -1, timer = null;
        function show(i) {
          cur = i;
          el.querySelectorAll(".sx-spot").forEach(function (g) { g.classList.toggle("on", +g.dataset.i === i); });
          el.querySelectorAll(".sx-b").forEach(function (b) { b.classList.toggle("on", +b.dataset.i === i); });
          const p = o.spots[i];
          card.innerHTML = '<div class="sx-top"><span class="sx-emo" aria-hidden="true">' + p.emo + '</span><b>' + (i + 1) + '. ' + p.t + '</b></div>' +
            '<ul class="pts sm">' + p.d.map(function (t) { return '<li>' + fmtKo(t) + '</li>'; }).join("") + '</ul>';
          card.classList.remove("in"); void card.offsetWidth; card.classList.add("in");
        }
        function stop() { if (timer) { clearInterval(timer); timer = null; } tourBtn.classList.remove("on"); tourBtn.textContent = "▶ 차례로 살펴보기"; }
        el.addEventListener("click", function (e) {
          const t = e.target.closest(".sx-spot, .sx-b");
          if (t) { stop(); show(+t.dataset.i); return; }
          if (e.target.closest(".sx-tour")) {
            if (timer) { stop(); return; }
            show((cur + 1) % o.spots.length);
            timer = setInterval(function () { if (!el.isConnected) return stop(); show((cur + 1) % o.spots.length); }, 3800);
            tourBtn.classList.add("on"); tourBtn.textContent = "⏸ 멈춤";
          }
        });
        el.addEventListener("keydown", function (e) {
          const g = e.target.closest(".sx-spot");
          if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); stop(); show(+g.dataset.i); }
        });
        card.innerHTML = '<div class="sx-intro">그림의 번호나 목록을 누르면 설명이 나옴<br><small>' + o.spots.length + '곳 살펴보기</small></div>';
        return stop;
      }
    };
  }

  /* ==========================================================
     A 열대 — 열대 우림의 층 구조와 강가 마을
     ========================================================== */
  function sceneA() {
    const R = rnd(7);
    let art = '<rect width="960" height="470" fill="url(#sxA-sky)"/>' +
      '<path d="M0 230 Q40 190 80 214 Q120 170 170 206 Q220 176 260 200 Q320 160 370 196 Q430 168 480 198 Q540 164 600 196 Q660 170 720 200 Q780 176 840 204 Q900 180 960 206 V470 H0Z" fill="#a7cfad" opacity=".75"/>' +
      /* 강 · 흙 */
      '<rect y="470" width="960" height="70" fill="url(#sxA-soil)"/>' +
      '<path d="M690 470 Q720 452 780 452 H960 V540 H660 Q690 505 690 470Z" fill="url(#sxA-river)"/>' +
      '<g stroke="#e8f4fb" stroke-width="2" opacity=".6" fill="none"><path d="M730 480 q14 -5 28 0"/><path d="M820 500 q14 -5 28 0"/><path d="M880 470 q14 -5 28 0"/></g>';
    for (let i = 0; i < 26; i++) art += '<circle cx="' + f1(R() * 660) + '" cy="' + f1(482 + R() * 52) + '" r="' + f1(1.5 + R() * 2.5) + '" fill="#7a2f17" opacity=".5"/>';
    /* 하층 나무 · 야자 */
    art += '<g>' + [[250, 470, 150], [470, 470, 140], [610, 470, 120]].map(function (t) {
      return '<rect x="' + (t[0] - 4) + '" y="' + (t[1] - t[2] + 30) + '" width="8" height="' + (t[2] - 30) + '" fill="#5d4330"/>';
    }).join("") + '</g>' +
      blobs([[250, 338, 34], [228, 352, 26], [274, 350, 26], [470, 345, 30], [492, 358, 24], [448, 360, 22], [610, 368, 28], [630, 380, 20]], "#3f7f3a") +
      palm(370, 470, 120, -8) + palm(560, 470, 100, 10);
    /* 수관층 줄기 */
    art += [300, 420, 540, 650].map(function (x, i) { return '<path d="M' + (x - 9) + ' 470 L' + (x - 6) + ' 215 H' + (x + 6) + ' L' + (x + 9) + ' 470Z" fill="#5d4330"/>'; }).join("");
    /* 돌출목 줄기 · 판근 */
    art += '<path d="M168 470 L172 96 H190 L194 470Z" fill="#6b4c35"/>' +
      '<path d="M140 470 Q166 440 170 400 L172 470Z M222 470 Q196 440 192 400 L190 470Z M150 470 L170 430 L172 470Z" fill="#5a3e2b"/>' +
      '<path d="M180 150 Q150 130 120 128 M182 180 Q214 160 244 158" stroke="#6b4c35" stroke-width="7" fill="none" stroke-linecap="round"/>';
    /* 수관층 */
    const can = [];
    for (let i = 0; i < 16; i++) can.push([f1(226 + i * 32 + R() * 10), f1(190 + R() * 34), f1(40 + R() * 18)]);
    art += blobs(can.filter(function (c, i) { return i % 3 === 0; }), "#276b36") + blobs(can.filter(function (c, i) { return i % 3 === 1; }), "#2f7d3e") + blobs(can.filter(function (c, i) { return i % 3 === 2; }), "#3a8f47");
    art += blobs([[250, 170, 22], [340, 160, 26], [440, 166, 22], [560, 160, 26], [660, 172, 22]], "#4aa152", ' opacity=".8"');
    /* 돌출목 수관 */
    art += '<g><ellipse cx="180" cy="92" rx="96" ry="30" fill="#3f8f47"/><ellipse cx="140" cy="86" rx="46" ry="22" fill="#4aa152"/><ellipse cx="222" cy="84" rx="52" ry="22" fill="#4aa152"/><ellipse cx="180" cy="72" rx="44" ry="18" fill="#5cb563"/>' +
      '<ellipse cx="120" cy="128" rx="30" ry="12" fill="#3f8f47"/><ellipse cx="248" cy="156" rx="30" ry="12" fill="#3f8f47"/></g>';
    /* 그늘 · 덩굴 · 착생 · 땅 */
    art += '<rect y="240" width="690" height="230" fill="url(#sxA-shade)"/>' +
      '<g fill="none" stroke="#6b8e3a" stroke-width="4" stroke-linecap="round"><path d="M330 214 C300 280 360 320 330 380 S350 450 340 470"/><path d="M520 222 C540 290 500 330 526 400 S512 450 522 470"/></g>' +
      '<g fill="#86b84a"><path d="M300 262 l-10 -14 l12 6 l2 -16 l6 14 l10 -10 l-4 16 l14 0 l-14 8Z"/><path d="M186 250 l-10 -12 l12 5 l2 -14 l5 12 l9 -9 l-3 14 l12 0 l-12 7Z"/></g>' +
      '<circle cx="310" cy="258" r="4" fill="#d9467a"/><circle cx="196" cy="246" r="3.5" fill="#f08a3c"/>';
    for (let i = 0; i < 18; i++) {
      const x = f1(20 + R() * 650);
      art += '<path d="M' + x + ' 470 q-10 -18 -22 -20 M' + x + ' 470 q2 -22 -6 -30 M' + x + ' 470 q12 -16 22 -18" stroke="#4d8a3c" stroke-width="3" fill="none" stroke-linecap="round"/>';
    }
    for (let i = 0; i < 30; i++) art += '<ellipse cx="' + f1(R() * 680) + '" cy="' + f1(466 + R() * 6) + '" rx="5" ry="2" fill="' + (i % 2 ? "#8a6a3a" : "#a0783f") + '"/>';
    /* 고상 가옥 */
    art += '<g transform="translate(812 0)">' + [-44, -14, 16, 46].map(function (dx) { return '<rect x="' + (dx - 3) + '" y="398" width="6" height="' + (dx > 0 ? 70 : 62) + '" fill="#6b4c35"/>'; }).join("") +
      '<rect x="-58" y="394" width="120" height="8" fill="#8a643f"/><rect x="-50" y="336" width="104" height="60" fill="#c79a5b"/>' +
      '<path d="M-50 346 H54 M-50 360 H54 M-50 374 H54" stroke="#a87c44" stroke-width="2"/><rect x="-10" y="354" width="22" height="40" fill="#5d4330"/>' +
      '<polygon points="-72,340 2,280 76,340" fill="#b08a4a"/><path d="M-60 330 L2 290 L64 330" stroke="#8e6b35" stroke-width="3" fill="none"/>' +
      '<path d="M-58 402 L-86 452" stroke="#6b4c35" stroke-width="5"/><path d="M-96 452 H-70" stroke="#6b4c35" stroke-width="4"/></g>' +
      '<path d="M880 492 q30 10 60 0 l-8 10 h-44Z" fill="#6b4c35"/>';
    /* 높이 눈금 */
    art += '<g class="sx-scale"><line x1="30" y1="470" x2="30" y2="92"/>' + [[0, 470], [10, 395], [30, 245], [50, 95]].map(function (s) {
      return '<line x1="24" x2="36" y1="' + s[1] + '" y2="' + s[1] + '"/><text x="40" y="' + (s[1] + 5) + '">' + s[0] + 'm</text>'; }).join("") + '</g>';
    return sceneBlock({
      name: "열대 우림과 강가 마을", label: "열대 우림의 층 구조와 강가의 고상 가옥",
      defs: grad("sxA-sky", [[0, "#cde8f6"], [1, "#e8f5e4"]]) + grad("sxA-soil", [[0, "#b8562f"], [1, "#86381d"]]) +
        grad("sxA-river", [[0, "#6f9fbe"], [1, "#46779a"]]) + grad("sxA-shade", [[0, "#0a2a14", 0], [1, "#0a2a14", .42]]),
      art: art,
      spots: [
        { x: 180, y: 70, emo: "🌳", t: "돌출목층", d: ["높이 40~50m — 숲 위로 우뚝 솟은 큰 나무", "강한 햇볕과 바람을 그대로 받음", "판근(널빤지 모양 뿌리)으로 큰 몸을 지탱"] },
        { x: 440, y: 196, emo: "🌿", t: "수관층", d: ["높이 20~30m — 나뭇잎이 지붕처럼 이어짐", "햇빛을 가장 많이 받음 → 동식물이 가장 많이 사는 층", "상록 활엽수 — 1년 내내 잎이 푸름"] },
        { x: 470, y: 330, emo: "🌱", t: "하층", d: ["수관층에 가려 햇빛이 적게 드는 층", "그늘에 강한 작은 나무 · 야자류"] },
        { x: 400, y: 452, emo: "🍂", t: "지표층", d: ["햇빛이 거의 닿지 않아 어둡고 습함", "떨어진 잎이 고온 다습한 날씨에 빠르게 분해"] },
        { x: 300, y: 290, emo: "🪴", t: "덩굴 · 착생 식물", d: ["햇빛을 찾아 큰 나무를 타고 오르는 덩굴", "나무 위에 붙어 사는 착생 식물(난초 등)"] },
        { x: 560, y: 506, emo: "🧱", t: "붉은 흙(라테라이트)", d: ["많은 비가 양분을 씻어 내림 → 척박한 토양", "철 · 알루미늄 성분이 남아 붉은색"] },
        { x: 812, y: 300, emo: "🏠", t: "고상 가옥", d: ["바닥을 땅에서 띄움 → 습기 · 해충 · 침수 차단", "경사가 급한 지붕 → 빗물이 잘 흘러내림", "강가 마을 — 배로 이동"] }
      ],
      cap: "열대 우림은 높이에 따라 여러 층을 이룸 — 층마다 받는 햇빛과 사는 생물이 다름 (모식도)"
    });
  }

  /* ==========================================================
     B 건조 — 오아시스 마을과 카나트
     ========================================================== */
  function sceneB() {
    const R = rnd(11);
    let art = '<rect width="960" height="400" fill="url(#sxB-sky)"/>' +
      '<circle cx="820" cy="90" r="70" fill="url(#sxB-glow)"/><circle cx="820" cy="90" r="36" fill="#ffd54a"/>' +
      '<polygon points="700,300 780,212 830,246 880,196 960,250 960,330 700,330" fill="#b99b77"/><polygon points="780,212 800,236 766,232 830,246 850,224 880,196 900,222 868,226" fill="#cdb392" opacity=".8"/>' +
      '<path d="M0 290 Q90 240 190 268 Q280 232 380 262 Q470 238 560 270 Q640 250 720 290 Q840 312 960 296 V400 H0Z" fill="#ecc885"/>' +
      '<path d="M0 340 Q120 280 250 300 Q330 270 420 320 Q470 336 520 350 V400 H0Z" fill="#e3b56c"/>' +
      '<path d="M250 300 Q330 270 420 320" stroke="#f3d59b" stroke-width="3" fill="none"/>';
    /* 대상(낙타) */
    art += [300, 336, 372].map(function (x, i) {
      const y = 288 + i * 5;
      return '<g fill="#6b4a2a"><ellipse cx="' + x + '" cy="' + y + '" rx="13" ry="7"/><path d="M' + (x - 4) + ' ' + (y - 6) + ' q4 -8 8 0Z"/><rect x="' + (x + 9) + '" y="' + (y - 14) + '" width="3" height="12"/><circle cx="' + (x + 13) + '" cy="' + (y - 14) + '" r="3"/>' +
        '<rect x="' + (x - 10) + '" y="' + y + '" width="2.4" height="11"/><rect x="' + (x - 3) + '" y="' + y + '" width="2.4" height="11"/><rect x="' + (x + 4) + '" y="' + y + '" width="2.4" height="11"/><rect x="' + (x + 9) + '" y="' + y + '" width="2.4" height="11"/></g>';
    }).join("") + '<g fill="#3f5a8a"><circle cx="282" cy="276" r="3"/><rect x="280" y="279" width="4" height="12"/></g>';
    /* 땅 표면 · 단면 */
    art += '<rect y="386" width="960" height="18" fill="url(#sxB-sand)"/><rect y="404" width="960" height="136" fill="url(#sxB-under)"/>' +
      '<g stroke="#9a7148" stroke-width="1.5" opacity=".5" fill="none"><path d="M0 440 Q300 432 600 446 T960 438"/><path d="M0 482 Q280 474 560 488 T960 480"/></g>' +
      '<path d="M960 404 V540 H700 Q760 500 840 470 Q900 450 960 404Z" fill="#6aa7d4" opacity=".45"/>' +
      '<text class="sx-lbl" x="945" y="528" text-anchor="end">지하수가 스민 층</text>' +
      '<path class="sx-flow" d="M920 468 L760 440 L612 404" stroke="#3a86c8" stroke-width="7" fill="none" stroke-linecap="round"/>' +
      [680, 740, 800, 860].map(function (x) { const y = 404 + (x - 612) * (64 / 308); return '<rect x="' + (x - 4) + '" y="388" width="8" height="' + f1(y - 388) + '" fill="#4a3322"/><path d="M' + (x - 20) + ' 390 Q' + x + ' 370 ' + (x + 20) + ' 390Z" fill="#b98a4e"/><ellipse cx="' + x + '" cy="383" rx="5" ry="2.5" fill="#4a3322"/>'; }).join("") +
      '<text class="sx-lbl" x="700" y="456" text-anchor="middle">카나트(지하 수로)</text><text class="sx-lbl" x="872" y="364" text-anchor="middle">수직 굴</text>';
    /* 밭 · 오아시스 · 야자 */
    art += '<g>' + [0, 1, 2, 3, 4].map(function (k) { return '<rect x="' + (560 + k * 22) + '" y="378" width="18" height="12" rx="2" fill="' + (k % 2 ? "#6fae3e" : "#88c44f") + '"/>'; }).join("") + '</g>' +
      '<ellipse cx="470" cy="396" rx="78" ry="15" fill="#2f7fbf"/><ellipse cx="462" cy="393" rx="52" ry="7" fill="#79b8e6" opacity=".7"/>' +
      '<path d="M392 396 Q470 380 548 396" stroke="#7fb24a" stroke-width="5" fill="none"/>' +
      palm(402, 392, 110, -14) + palm(436, 392, 140, -6) + palm(512, 392, 150, 8) + palm(548, 392, 118, 16) + palm(616, 380, 96, 6);
    /* 흙벽돌집 */
    const HS = [[40, 330, 70, 60], [100, 310, 64, 80], [158, 340, 60, 50], [210, 322, 76, 68], [280, 346, 52, 44]];
    art += HS.map(function (h) {
      const x = h[0], y = h[1], w = h[2], hh = h[3];
      return '<g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + (392 - y) + '" fill="#c9955a"/><rect x="' + x + '" y="' + y + '" width="' + w + '" height="6" fill="#b5804a"/>' +
        '<rect x="' + (x - 2) + '" y="' + (y - 6) + '" width="5" height="8" fill="#b5804a"/><rect x="' + (x + w - 3) + '" y="' + (y - 6) + '" width="5" height="8" fill="#b5804a"/>' +
        '<rect x="' + (x + w * .2) + '" y="' + (y + 18) + '" width="8" height="8" fill="#4a3322"/><rect x="' + (x + w * .62) + '" y="' + (y + 18) + '" width="8" height="8" fill="#4a3322"/>' +
        (hh > 55 ? '<path d="M' + (x + w / 2 - 8) + ' 392 v-20 a8 8 0 0 1 16 0 v20Z" fill="#5a3e24"/>' : "") + '</g>';
    }).join("") +
      '<g><rect x="140" y="236" width="16" height="74" fill="#c9955a"/><rect x="136" y="228" width="24" height="10" fill="#b5804a"/><path d="M140 236 h16" stroke="#8a5f35" stroke-width="2"/></g>';
    for (let i = 0; i < 30; i++) art += '<circle cx="' + f1(R() * 960) + '" cy="' + f1(412 + R() * 120) + '" r="' + f1(1 + R() * 2) + '" fill="#7d5a36" opacity=".45"/>';
    return sceneBlock({
      name: "오아시스 마을", label: "사막의 오아시스 마을과 지하 수로",
      defs: grad("sxB-sky", [[0, "#9fd0f0"], [1, "#f7e6c4"]]) + grad("sxB-sand", [[0, "#f0cf8a"], [1, "#d9ad62"]]) + grad("sxB-under", [[0, "#c79a5d"], [1, "#8d653a"]]) +
        '<radialGradient id="sxB-glow"><stop offset="0" stop-color="#fff3b0" stop-opacity=".9"/><stop offset="1" stop-color="#fff3b0" stop-opacity="0"/></radialGradient>',
      art: art,
      spots: [
        { x: 110, y: 270, emo: "🏜️", t: "사구(모래 언덕)", d: ["바람에 날린 모래가 쌓인 언덕", "사막에는 모래 사막보다 자갈 · 암석 사막이 더 넓음"] },
        { x: 470, y: 420, emo: "💧", t: "오아시스", d: ["지하수가 솟거나 강물이 흘러 물을 얻을 수 있는 곳", "사막 속 마을과 교통로의 중심"] },
        { x: 512, y: 226, emo: "🌴", t: "대추야자", d: ["건조한 기후에 강한 나무 — 오아시스의 대표 작물", "열매는 주요 식량 · 교역품"] },
        { x: 190, y: 356, emo: "🧱", t: "흙벽돌집", d: ["나무가 귀함 → 흙벽돌로 지음", "두꺼운 벽 · 작은 창 → 낮의 열기와 모래바람 차단", "비가 적어 지붕이 평평함"] },
        { x: 820, y: 470, emo: "🚰", t: "카나트(지하 수로)", d: ["산기슭의 지하수를 땅속 수로로 끌어옴 → 증발 적음", "수직 굴 = 공사 · 청소용 구멍", "지역마다 이름이 다름 — 카나트 · 포가라 · 카레즈"] },
        { x: 336, y: 262, emo: "🐪", t: "대상 · 유목", d: ["낙타로 사막을 건너 물건을 사고파는 상인 무리(대상)", "물과 풀을 찾아 가축과 이동하는 유목"] },
        { x: 606, y: 360, emo: "🌾", t: "관개 농업", d: ["물을 끌어 대어 밀 · 채소 · 과일 재배", "큰 강 유역의 관개 농업 — 나일강"] }
      ],
      cap: "사막에서는 물이 있는 곳에 마을이 생김 — 증발을 줄이려 물을 땅속으로 끌어옴 (모식도)"
    });
  }

  /* ==========================================================
     C 온대 — 지중해 연안의 여름
     ========================================================== */
  function sceneC() {
    const R = rnd(5);
    let art = '<rect width="960" height="540" fill="url(#sxC-sky)"/>' +
      '<g stroke="#ffd95a" stroke-width="4" stroke-linecap="round">' + [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) { const r = a * Math.PI / 180; return '<line x1="' + f1(120 + Math.cos(r) * 46) + '" y1="' + f1(80 + Math.sin(r) * 46) + '" x2="' + f1(120 + Math.cos(r) * 66) + '" y2="' + f1(80 + Math.sin(r) * 66) + '"/>'; }).join("") + '</g>' +
      '<circle cx="120" cy="80" r="36" fill="#ffcf33"/>' +
      '<path d="M260 250 Q420 150 560 196 Q700 120 960 176 V540 H260Z" fill="#b9b98e" opacity=".7"/>' +
      '<path d="M0 360 H340 Q400 380 440 430 Q480 490 520 540 H0Z" fill="url(#sxC-sea)"/>' +
      '<path d="M340 360 Q400 380 440 430 Q480 490 520 540 H548 Q500 480 470 420 Q430 366 360 352Z" fill="#f2e2b4"/>' +
      '<path d="M360 352 Q470 250 620 222 Q760 196 960 214 V540 H548 Q500 480 470 420 Q430 366 360 352Z" fill="url(#sxC-hill)"/>' +
      '<g stroke="#fff" stroke-width="2" opacity=".5" fill="none"><path d="M60 410 q16 -6 32 0"/><path d="M180 450 q16 -6 32 0"/><path d="M110 500 q16 -6 32 0"/></g>' +
      '<path d="M160 470 l30 0 l-6 8 h-18Z" fill="#fff"/><path d="M175 470 v-26 l14 22Z" fill="#fff"/>';
    /* 마을 */
    const HS = [[630, 240], [664, 230], [700, 238], [736, 226], [772, 236], [648, 268], [686, 262], [724, 262], [762, 266], [800, 258], [612, 290], [840, 250]];
    art += HS.map(function (h, i) {
      const w = 30 + (i % 3) * 6, hh = 24 + (i % 2) * 8;
      return '<g><rect x="' + h[0] + '" y="' + h[1] + '" width="' + w + '" height="' + hh + '" fill="#f8f6f0" stroke="#dcd6c8"/>' +
        '<polygon points="' + (h[0] - 3) + ',' + h[1] + ' ' + (h[0] + w / 2) + ',' + (h[1] - 11) + ' ' + (h[0] + w + 3) + ',' + h[1] + '" fill="#c8643b"/>' +
        '<rect x="' + (h[0] + 7) + '" y="' + (h[1] + 9) + '" width="6" height="7" fill="#5a7fa8"/></g>';
    }).join("") +
      '<g><rect x="700" y="182" width="36" height="46" fill="#f8f6f0" stroke="#dcd6c8"/><path d="M700 184 a18 18 0 0 1 36 0Z" fill="#6f9fd1"/><rect x="714" y="160" width="8" height="12" fill="#f8f6f0"/><path d="M718 150 v12 M713 155 h10" stroke="#c8643b" stroke-width="2"/></g>';
    /* 관목 · 올리브 · 포도밭 · 밀밭 */
    for (let i = 0; i < 16; i++) { const x = 380 + R() * 240, y = 300 + R() * 50; art += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(8 + R() * 8) + '" ry="' + f1(5 + R() * 4) + '" fill="#4e6b34"/>'; }
    [[470, 368], [520, 356], [572, 370], [624, 356], [500, 400], [556, 404], [612, 396], [668, 390]].forEach(function (o) {
      art += '<path d="M' + o[0] + ' ' + (o[1] + 26) + ' q-3 -14 2 -24 q4 8 -1 24Z" fill="#6a5238"/>' +
        blobs([[o[0] - 12, o[1], 13], [o[0] + 10, o[1] - 2, 14], [o[0], o[1] - 12, 14]], "#8fa066") + blobs([[o[0] - 6, o[1] - 6, 7], [o[0] + 8, o[1] - 10, 6]], "#a9b884");
    });
    for (let r = 0; r < 9; r++) art += '<path d="M' + (700 + r * 28) + ' 470 L' + (760 + r * 26) + ' 350" stroke="#5f8a2a" stroke-width="7" stroke-linecap="round" stroke-dasharray="10 5"/>';
    art += '<path d="M548 540 Q560 470 700 460 Q820 452 960 470 V540Z" fill="#e2bf55"/>' +
      [0, 1, 2, 3, 4, 5, 6].map(function (k) { return '<path d="M' + (580 + k * 56) + ' 540 Q' + (600 + k * 52) + ' 500 ' + (640 + k * 48) + ' 468" stroke="#caa33e" stroke-width="2" fill="none"/>'; }).join("") +
      [[640, 506], [720, 496], [800, 510], [880, 498]].map(function (b) { return '<g><circle cx="' + b[0] + '" cy="' + b[1] + '" r="11" fill="#d8b04a" stroke="#b58f2e" stroke-width="2"/><circle cx="' + b[0] + '" cy="' + b[1] + '" r="4" fill="none" stroke="#b58f2e" stroke-width="1.5"/></g>'; }).join("");
    /* 해변 파라솔 */
    art += [[280, 392, "#e0483a"], [318, 404, "#2b6fe3"], [250, 418, "#f0b43a"]].map(function (p) {
      return '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + p[0] + '" y2="' + (p[1] + 22) + '" stroke="#555" stroke-width="2"/><path d="M' + (p[0] - 16) + ' ' + p[1] + ' a16 10 0 0 1 32 0Z" fill="' + p[2] + '"/>';
    }).join("");
    return sceneBlock({
      name: "지중해 연안의 여름", label: "지중해 연안 마을의 여름 풍경",
      defs: grad("sxC-sky", [[0, "#79c0f0"], [1, "#e2f2fb"]]) + grad("sxC-sea", [[0, "#2f8fd0"], [1, "#1b5e98"]]) + grad("sxC-hill", [[0, "#dcc57e"], [1, "#c4a458"]]),
      art: art,
      spots: [
        { x: 120, y: 80, emo: "☀️", t: "덥고 건조한 여름", d: ["여름 — 아열대 고압대의 영향 → 맑고 건조", "겨울 — 편서풍과 저기압 → 비", "지중해성 기후(Cs)"] },
        { x: 740, y: 214, emo: "🏘️", t: "흰 벽 집", d: ["흰색 벽 → 강한 햇빛 반사", "두꺼운 돌벽 · 작은 창 → 실내를 시원하게"] },
        { x: 560, y: 336, emo: "🫒", t: "올리브", d: ["잎이 작고 두꺼워 수분 증발이 적음, 뿌리가 깊음", "여름 가뭄에 강한 수목 작물 — 코르크참나무 · 오렌지도"] },
        { x: 860, y: 404, emo: "🍇", t: "포도", d: ["건조한 여름 · 강한 햇볕 → 당도 높은 포도", "포도주 생산 — 이탈리아 · 프랑스 남부 · 에스파냐"] },
        { x: 760, y: 486, emo: "🌾", t: "밀", d: ["비가 오는 겨울에 기르고 초여름에 수확", "여름에는 들판이 누렇게 마름"] },
        { x: 450, y: 300, emo: "🌿", t: "단단한 잎의 관목", d: ["키 작고 잎이 단단한 상록 관목(경엽수)", "여름 가뭄에 적응 — 산불이 잦음"] },
        { x: 290, y: 440, emo: "🏖️", t: "휴양 · 관광", d: ["맑고 건조한 여름 → 세계적인 휴양지", "지중해 연안 해변 · 휴양 도시"] }
      ],
      cap: "여름이 덥고 건조한 지중해 연안 — 가뭄에 강한 수목 작물과 겨울 밀, 흰 벽 집 (모식도)"
    });
  }

  /* ==========================================================
     D 냉대 — 타이가 마을의 겨울
     ========================================================== */
  function sceneD() {
    const R = rnd(3);
    let art = '<rect width="960" height="440" fill="url(#sxD-sky)"/>' +
      '<circle cx="820" cy="170" r="60" fill="url(#sxD-glow)"/><circle cx="820" cy="170" r="24" fill="#fff4cf"/>';
    for (let i = 0; i < 40; i++) { const x = i * 25 + R() * 10; art += conifer(x, 300 + R() * 8, 60 + R() * 30, "#6f8c92"); }
    art += '<rect y="296" width="960" height="150" fill="#f3f7fb"/>';
    for (let i = 0; i < 22; i++) { const x = 330 + i * 30 + R() * 12; art += conifer(x, 372 + R() * 6, 90 + R() * 40, i % 2 ? "#2f5a45" : "#27503c", true); }
    art += '<rect y="370" width="960" height="70" fill="url(#sxD-snow)"/>' +
      /* 언 강 · 목재 */
      '<path d="M430 440 Q560 396 960 386 V428 Q620 432 500 440Z" fill="#d7e7f4" stroke="#b9cfe2" stroke-width="2"/>' +
      '<g stroke="#a9c2d8" stroke-width="1.5" fill="none"><path d="M560 424 l20 -8 l14 6"/><path d="M760 410 l18 -6 l10 8"/></g>' +
      '<g transform="translate(700 380)"><rect x="-4" y="22" width="92" height="6" rx="2" fill="#6b4a2f"/>' + [0, 1, 2].map(function (r) { return [0, 1, 2, 3].map(function (c) { return '<circle cx="' + (6 + c * 20 + r * 10) + '" cy="' + (16 - r * 11) + '" r="7" fill="#b07a4a" stroke="#7a5230" stroke-width="2"/>'; }).slice(0, 4 - r).join(""); }).join("") + '</g>' +
      '<g transform="translate(640 386)"><rect x="-26" y="-8" width="40" height="26" rx="4" fill="#d24a3a"/><rect x="-18" y="-18" width="22" height="12" rx="2" fill="#d24a3a"/><rect x="-14" y="-15" width="14" height="8" fill="#bfe1f6"/><circle cx="-16" cy="20" r="6" fill="#333"/><circle cx="6" cy="20" r="6" fill="#333"/><path d="M14 10 H58" stroke="#555" stroke-width="3"/></g>';
    /* 지상 배관 */
    art += '<path d="M470 352 H960" stroke="#9aa3ad" stroke-width="10"/><path d="M470 349 H960" stroke="#c6ccd3" stroke-width="3"/>' +
      [500, 580, 660, 740, 820, 900].map(function (x) { return '<path d="M' + x + ' 356 V376 M' + (x - 8) + ' 376 H' + (x + 8) + '" stroke="#6d757e" stroke-width="4"/>'; }).join("");
    /* 통나무집 */
    art += '<g transform="translate(210 0)"><rect x="-90" y="300" width="180" height="94" fill="#8a5a35"/>' +
      [0, 1, 2, 3, 4, 5, 6].map(function (k) { return '<path d="M-90 ' + (308 + k * 13) + ' H90" stroke="#6b4327" stroke-width="3"/><circle cx="-90" cy="' + (306 + k * 13) + '" r="6" fill="#b07a4a" stroke="#6b4327"/><circle cx="90" cy="' + (306 + k * 13) + '" r="6" fill="#b07a4a" stroke="#6b4327"/>'; }).join("") +
      '<polygon points="-108,304 0,214 108,304" fill="#5b3a24"/><polygon points="-112,300 0,208 112,300 100,300 0,222 -100,300" fill="#fff"/><polygon points="-100,300 0,222 100,300 60,296 0,248 -60,296" fill="#f1f5f9"/>' +
      '<rect x="44" y="222" width="18" height="40" fill="#7a4a30"/><rect x="40" y="216" width="26" height="10" fill="#fff"/>' +
      '<g class="sx-smoke" fill="#cfd6dd"><circle cx="54" cy="200" r="10"/><circle cx="64" cy="180" r="13"/><circle cx="80" cy="156" r="16"/></g>' +
      [-54, 26].map(function (x) { return '<rect x="' + x + '" y="324" width="32" height="30" fill="#f6e7b0" stroke="#fff" stroke-width="5"/><rect x="' + (x + 5) + '" y="329" width="22" height="20" fill="none" stroke="#6b4327" stroke-width="2"/><path d="M' + (x + 16) + ' 324 V354 M' + x + ' 339 H' + (x + 32) + '" stroke="#fff" stroke-width="2"/>'; }).join("") +
      '<rect x="-12" y="344" width="26" height="50" fill="#5b3a24"/></g>';
    art += conifer(62, 400, 150, "#2f5a45", true) + conifer(360, 404, 120, "#27503c", true);
    /* 땅 단면 */
    art += '<rect y="440" width="960" height="12" fill="#3f2d1f"/><rect y="452" width="960" height="30" fill="#d9d5c9"/><rect y="482" width="960" height="26" fill="#a8683a"/><rect y="508" width="960" height="32" fill="#8fa7bf"/>' +
      '<g stroke="#fff" stroke-width="1.2" opacity=".6">' + [40, 160, 280, 400, 520, 640, 760, 880].map(function (x) { return '<path d="M' + x + ' 516 l6 6 l-6 6 M' + (x + 30) + ' 520 l-5 5 l5 5"/>'; }).join("") + '</g>' +
      '<text class="sx-lbl" x="945" y="472" text-anchor="end">회백색 층(양분이 빠져나감)</text><text class="sx-lbl" x="945" y="530" text-anchor="end">영구 동토층</text>';
    return sceneBlock({
      name: "타이가 마을의 겨울", label: "냉대 타이가 지역 마을의 겨울 풍경과 땅 단면",
      defs: grad("sxD-sky", [[0, "#b6cadd"], [1, "#eef3f8"]]) + grad("sxD-snow", [[0, "#ffffff"], [1, "#e1eaf3"]]) +
        '<radialGradient id="sxD-glow"><stop offset="0" stop-color="#fff6d6" stop-opacity=".9"/><stop offset="1" stop-color="#fff6d6" stop-opacity="0"/></radialGradient>',
      art: art,
      spots: [
        { x: 520, y: 290, emo: "🌲", t: "타이가(침엽수림)", d: ["가문비나무 · 전나무 · 소나무 등 침엽수림", "원뿔 모양 · 가는 잎 → 눈이 쉽게 미끄러짐", "목재 · 펄프 생산 — 임업 발달"] },
        { x: 210, y: 250, emo: "🏠", t: "통나무집", d: ["풍부한 목재로 지은 집", "지붕 경사가 급함 → 눈이 쌓이지 않게"] },
        { x: 178, y: 339, emo: "🪟", t: "이중창 · 두꺼운 벽", d: ["길고 추운 겨울 → 열이 빠져나가지 않게", "난방 시설 발달 — 러시아의 페치카"] },
        { x: 800, y: 410, emo: "🧊", t: "언 강", d: ["겨울에 강이 얼어 도로로 이용", "통나무를 모았다가 봄에 강물로 흘려보냄"] },
        { x: 640, y: 330, emo: "🛢️", t: "땅 위 배관", d: ["영구 동토층이 녹지 않게 기둥 위에 설치", "석유 · 천연가스 개발"] },
        { x: 120, y: 468, emo: "🟫", t: "회백색 토양(포드졸)", d: ["침엽수 잎이 산성 물질을 만들어 양분을 씻어 내림", "척박 → 농사에 불리"] },
        { x: 120, y: 524, emo: "❄️", t: "영구 동토층", d: ["1년 내내 얼어 있는 땅 — 냉대 북부 · 한대", "여름에 겉부분만 녹음"] }
      ],
      cap: "길고 추운 겨울 — 침엽수림(타이가)과 임업, 추위에 대비한 집과 땅 위 배관 (모식도)"
    });
  }

  /* ==========================================================
     E 한대 — 툰드라의 여름
     ========================================================== */
  function sceneE() {
    const R = rnd(9);
    let art = '<rect width="960" height="330" fill="url(#sxE-sky)"/>' +
      '<circle cx="160" cy="250" r="90" fill="url(#sxE-glow)"/><circle cx="160" cy="250" r="30" fill="#ffd98a"/>' +
      '<polygon points="560,300 620,210 680,236 740,170 800,200 860,150 960,190 960,310 560,310" fill="#f4f8fc"/>' +
      '<polygon points="740,170 760,230 720,250 800,200 820,260 860,150 880,240" fill="#cfe0ef"/>' +
      '<path d="M700 250 L690 300 M790 230 L800 300 M880 220 L870 300" stroke="#9fc0de" stroke-width="2"/>' +
      '<rect y="300" width="960" height="36" fill="url(#sxE-sea)"/>' +
      [[40, 316, 40], [150, 322, 28], [300, 312, 50], [460, 320, 34], [640, 318, 44]].map(function (p) { return '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="' + p[2] + '" ry="5" fill="#fff"/>'; }).join("") +
      '<path d="M0 334 Q200 324 480 330 Q720 336 960 326 V540 H0Z" fill="url(#sxE-ground)"/>';
    for (let i = 0; i < 70; i++) {
      const x = R() * 960, y = 340 + R() * 200, c = ["#7fa05a", "#95ad62", "#c8c79a", "#a2573a", "#6d8c49"][i % 5];
      art += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(10 + R() * 24) + '" ry="' + f1(4 + R() * 7) + '" fill="' + c + '" opacity=".85"/>';
    }
    [[250, 392, 60], [120, 440, 44], [560, 420, 50], [360, 500, 36]].forEach(function (p) {
      art += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="' + p[2] + '" ry="' + (p[2] * .22) + '" fill="#5d9ccf" stroke="#b7d6ec" stroke-width="3"/>';
    });
    for (let i = 0; i < 40; i++) art += '<circle cx="' + f1(R() * 960) + '" cy="' + f1(350 + R() * 190) + '" r="2.4" fill="' + (i % 2 ? "#f5d34a" : "#fff") + '"/>';
    /* 순록 */
    [[380, 440], [420, 452], [462, 436], [500, 456], [440, 470], [530, 440]].forEach(function (d, i) {
      const x = d[0], y = d[1], c = i % 2 ? "#6b5540" : "#7d6650";
      art += '<g fill="' + c + '"><ellipse cx="' + x + '" cy="' + y + '" rx="16" ry="8"/><rect x="' + (x + 12) + '" y="' + (y - 14) + '" width="5" height="12"/><ellipse cx="' + (x + 18) + '" cy="' + (y - 15) + '" rx="6" ry="4"/>' +
        '<rect x="' + (x - 12) + '" y="' + (y + 5) + '" width="3" height="12"/><rect x="' + (x - 4) + '" y="' + (y + 5) + '" width="3" height="12"/><rect x="' + (x + 4) + '" y="' + (y + 5) + '" width="3" height="12"/><rect x="' + (x + 10) + '" y="' + (y + 5) + '" width="3" height="12"/></g>' +
        '<path d="M' + (x + 15) + ' ' + (y - 18) + ' l-6 -12 m3 6 l-7 -2 M' + (x + 20) + ' ' + (y - 18) + ' l6 -12 m-3 6 l7 -2" stroke="#d8c7a8" stroke-width="2" fill="none"/>';
    });
    art += '<g><circle cx="340" cy="428" r="7" fill="#e8b48a"/><path d="M330 436 h20 l4 30 h-28Z" fill="#c0392b"/><path d="M332 436 h16 l-8 -14Z" fill="#c0392b"/><path d="M328 450 h26" stroke="#f1c40f" stroke-width="3"/></g>';
    /* 고상식 주택 */
    [[700, "#d24a3a"], [770, "#2b6fe3"], [840, "#e8a33a"], [905, "#3a9a6a"]].forEach(function (h, i) {
      const x = h[0], y = 352 + (i % 2) * 8;
      art += '<g>' + [-18, 0, 18].map(function (dx) { return '<rect x="' + (x + dx - 2) + '" y="' + (y + 22) + '" width="4" height="16" fill="#555"/>'; }).join("") +
        '<rect x="' + (x - 26) + '" y="' + (y - 8) + '" width="52" height="32" fill="' + h[1] + '"/><polygon points="' + (x - 30) + ',' + (y - 8) + ' ' + x + ',' + (y - 28) + ' ' + (x + 30) + ',' + (y - 8) + '" fill="#3d3d3d"/>' +
        '<rect x="' + (x - 16) + '" y="' + y + '" width="10" height="9" fill="#dff0fb"/><rect x="' + (x + 6) + '" y="' + y + '" width="10" height="9" fill="#dff0fb"/></g>';
    });
    /* 개썰매 */
    art += '<g transform="translate(600 480)"><path d="M-40 10 H10 q8 0 10 -8" stroke="#6b4a2f" stroke-width="4" fill="none"/><rect x="-36" y="-10" width="40" height="14" fill="#9a6a3c"/><path d="M-36 -10 V-26 M4 -10 V-22" stroke="#6b4a2f" stroke-width="3"/>' +
      [30, 56, 82].map(function (x) { return '<g fill="#8b8f96"><ellipse cx="' + x + '" cy="4" rx="10" ry="6"/><circle cx="' + (x + 9) + '" cy="-2" r="5"/><path d="M' + (x + 7) + ' -6 l2 -5 l3 5Z"/></g>'; }).join("") +
      '<path d="M10 0 H90" stroke="#555" stroke-width="1.5"/></g>';
    return sceneBlock({
      name: "툰드라의 여름", label: "한대 툰드라 지역의 여름 풍경",
      defs: grad("sxE-sky", [[0, "#9dcdf0"], [1, "#f6e8cf"]]) + grad("sxE-sea", [[0, "#5a88b0"], [1, "#3c6a93"]]) + grad("sxE-ground", [[0, "#8c8a58"], [1, "#6c6a40"]]) +
        '<radialGradient id="sxE-glow"><stop offset="0" stop-color="#ffe0a0" stop-opacity=".95"/><stop offset="1" stop-color="#ffe0a0" stop-opacity="0"/></radialGradient>',
      art: art,
      spots: [
        { x: 180, y: 500, emo: "🌿", t: "이끼 · 지의류", d: ["짧은 여름에 땅 표면이 녹으며 자람", "나무는 자라지 못함 — 최난월 평균 기온 10℃ 미만"] },
        { x: 250, y: 370, emo: "💧", t: "여름 웅덩이", d: ["아래가 영구 동토층 → 녹은 물이 빠지지 못해 습지", "모기 등 곤충이 많음"] },
        { x: 470, y: 408, emo: "🦌", t: "순록 유목", d: ["이끼 · 지의류를 먹는 순록을 몰고 이동", "사미족 · 네네츠족 등"] },
        { x: 800, y: 330, emo: "🏠", t: "고상식 주택", d: ["기둥을 박아 바닥을 띄움 → 건물 열로 동토층이 녹지 않게", "이글루는 사냥 때 쓰던 임시 집"] },
        { x: 640, y: 452, emo: "🛷", t: "개썰매 · 스노모빌", d: ["눈과 얼음 위의 이동 수단", "오늘날은 스노모빌 · 비행기도 이용"] },
        { x: 820, y: 200, emo: "🏔️", t: "빙하 · 빙상", d: ["빙설 기후(EF) — 가장 따뜻한 달도 0℃ 미만", "그린란드 · 남극 대륙을 덮은 두꺼운 얼음"] },
        { x: 160, y: 250, emo: "☀️", t: "지지 않는 해(백야)", d: ["여름 — 해가 지지 않거나 잠깐 짐", "겨울 — 해가 뜨지 않는 극야"] }
      ],
      cap: "짧은 여름에만 땅 겉이 녹는 툰드라 — 이끼 · 지의류와 순록, 기둥 위의 집 (모식도)"
    });
  }

  /* ==========================================================
     H 고산 — 안데스의 고산 도시
     ========================================================== */
  function sceneH() {
    const R = rnd(13);
    let art = '<rect width="960" height="540" fill="url(#sxH-sky)"/>' +
      '<circle cx="860" cy="70" r="24" fill="#fffbe0"/><circle cx="860" cy="70" r="48" fill="#fffbe0" opacity=".25"/>' +
      '<polygon points="0,300 120,150 200,210 330,90 440,190 560,70 680,170 780,110 900,200 960,170 960,340 0,340" fill="url(#sxH-mtn)"/>' +
      '<polygon points="330,90 300,130 322,124 340,140 360,118 380,134" fill="#fff"/><polygon points="560,70 522,120 546,114 564,132 586,110 608,126" fill="#fff"/>' +
      '<polygon points="780,110 756,140 776,136 792,150 810,132" fill="#fff"/><polygon points="120,150 100,176 118,172 132,184 146,170" fill="#fff"/>' +
      '<path d="M0 320 Q200 250 420 280 Q640 250 960 290 V540 H0Z" fill="#b9b46c"/>' +
      '<path d="M0 360 Q200 300 400 330 Q640 310 960 350 V540 H0Z" fill="#a4a45c"/>';
    /* 계단식 밭 */
    for (let k = 0; k < 9; k++) {
      const y = 330 + k * 18, c = ["#7da04a", "#98b35a", "#b99a58", "#6f9444"][k % 4];
      art += '<path d="M' + (20 + k * 6) + ' ' + y + ' Q180 ' + (y - 22) + ' ' + (360 - k * 10) + ' ' + (y + 4) + ' L' + (360 - k * 10) + ' ' + (y + 14) + ' Q180 ' + (y - 8) + ' ' + (20 + k * 6) + ' ' + (y + 14) + 'Z" fill="' + c + '"/>' +
        '<path d="M' + (20 + k * 6) + ' ' + (y + 14) + ' Q180 ' + (y - 8) + ' ' + (360 - k * 10) + ' ' + (y + 14) + '" stroke="#7a6a48" stroke-width="2.5" fill="none"/>';
    }
    /* 도시 */
    for (let i = 0; i < 46; i++) {
      const x = 440 + (i % 12) * 26 + R() * 8, y = 338 + Math.floor(i / 12) * 24 + R() * 6, c = ["#e9e2d0", "#e8c9a0", "#d98f6a", "#f1e7c9", "#c9d7e3"][i % 5];
      art += '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="20" height="16" fill="' + c + '" stroke="#b5a58a"/><rect x="' + f1(x) + '" y="' + f1(y) + '" width="20" height="4" fill="#b8573a"/>';
    }
    art += '<g><rect x="590" y="300" width="48" height="40" fill="#f3ecd9" stroke="#b5a58a"/><rect x="586" y="276" width="14" height="30" fill="#f3ecd9" stroke="#b5a58a"/><rect x="628" y="276" width="14" height="30" fill="#f3ecd9" stroke="#b5a58a"/>' +
      '<path d="M586 276 l7 -12 l7 12Z M628 276 l7 -12 l7 12Z" fill="#b8573a"/><path d="M604 340 v-14 a10 10 0 0 1 20 0 v14Z" fill="#6b4a2f"/></g>';
    /* 호수 · 갈대배 */
    art += '<path d="M680 460 Q800 432 960 446 V540 H660 Q650 490 680 460Z" fill="url(#sxH-lake)"/>' +
      '<path d="M790 486 Q830 502 880 484 L872 494 Q830 508 798 496Z" fill="#d9b85a" stroke="#a88a3a" stroke-width="2"/><path d="M834 486 V456 L852 478" stroke="#8a6a3a" stroke-width="2" fill="#f3ead0"/>' +
      '<g stroke="#8aa04a" stroke-width="2">' + [700, 712, 724, 738].map(function (x) { return '<path d="M' + x + ' 470 v-22"/>'; }).join("") + '</g>';
    /* 푸나의 라마 · 사람 */
    function llama(x, y, c) {
      return '<g fill="' + c + '"><ellipse cx="' + x + '" cy="' + y + '" rx="14" ry="8"/><rect x="' + (x + 9) + '" y="' + (y - 22) + '" width="6" height="20"/><ellipse cx="' + (x + 15) + '" cy="' + (y - 23) + '" rx="7" ry="4"/><path d="M' + (x + 11) + ' ' + (y - 27) + ' l1 -6 l2 6Z M' + (x + 15) + ' ' + (y - 27) + ' l1 -6 l2 6Z"/>' +
        '<rect x="' + (x - 11) + '" y="' + (y + 5) + '" width="3" height="13"/><rect x="' + (x - 4) + '" y="' + (y + 5) + '" width="3" height="13"/><rect x="' + (x + 3) + '" y="' + (y + 5) + '" width="3" height="13"/><rect x="' + (x + 9) + '" y="' + (y + 5) + '" width="3" height="13"/></g>';
    }
    art += llama(420, 296, "#f1ece0") + llama(462, 290, "#8b6b4a") + llama(500, 300, "#f1ece0") + llama(250, 480, "#8b6b4a");
    art += '<g transform="translate(300 470)"><circle cx="0" cy="-40" r="9" fill="#c98f62"/><ellipse cx="0" cy="-49" rx="17" ry="4" fill="#3d2f2a"/><rect x="-8" y="-60" width="16" height="11" rx="3" fill="#3d2f2a"/>' +
      '<path d="M-24 -28 L24 -28 L18 12 L-18 12Z" fill="#c0392b"/><path d="M-22 -18 H22 M-20 -6 H20" stroke="#f1c40f" stroke-width="3"/><path d="M-21 -12 H21" stroke="#2b6fe3" stroke-width="2"/>' +
      '<rect x="-10" y="12" width="7" height="22" fill="#3d2f2a"/><rect x="3" y="12" width="7" height="22" fill="#3d2f2a"/></g>';
    return sceneBlock({
      name: "안데스의 고산 도시", label: "안데스 산지의 고산 도시와 계단식 밭",
      defs: grad("sxH-sky", [[0, "#2f74c8"], [1, "#bfe0f7"]]) + grad("sxH-mtn", [[0, "#8a7d72"], [1, "#6f665e"]]) + grad("sxH-lake", [[0, "#3f86c8"], [1, "#2a5f98"]]),
      art: art,
      spots: [
        { x: 560, y: 100, emo: "🏔️", t: "만년설", d: ["높이 약 5,000m 이상 — 1년 내내 눈이 덮임", "녹은 물 → 산 아래 마을의 물"] },
        { x: 190, y: 360, emo: "🥔", t: "계단식 밭", d: ["비탈을 깎아 계단 모양으로 만든 밭", "고도에 따라 옥수수 · 감자 · 키노아"] },
        { x: 540, y: 370, emo: "🏙️", t: "고산 도시", d: ["적도 부근 2,000~3,000m — 1년 내내 봄 같은 날씨", "키토 · 보고타 · 라파스 — 덥고 습한 저지대보다 살기 좋아 도시 발달"] },
        { x: 462, y: 262, emo: "🦙", t: "라마 · 알파카", d: ["높고 추운 초원(푸나)에서 방목", "털 · 고기 · 짐 운반"] },
        { x: 300, y: 410, emo: "🧣", t: "판초 · 모자", d: ["일교차가 큼 → 입고 벗기 쉬운 판초", "햇볕(자외선)이 강함 → 챙 있는 모자"] },
        { x: 836, y: 450, emo: "🛶", t: "호수의 갈대배", d: ["티티카카호(약 3,800m) — 토토라 갈대로 만든 배 · 섬", "높은 곳에 있는 큰 호수"] },
        { x: 860, y: 70, emo: "☀️", t: "강한 햇볕 · 큰 일교차", d: ["공기가 희박 → 낮에 햇볕이 강하고 밤에 빨리 식음", "연교차는 작지만 일교차가 큼"] }
      ],
      cap: "적도 부근 높은 산지 — 봄 같은 날씨의 고산 도시, 고도에 따른 토지 이용 (모식도)"
    });
  }

  insertAfter("5-1", "식생 · 경관", sceneA());
  insertAfter("5-2", "식생 · 경관", sceneB());
  insertAfter("5-3", "식생 · 경관", sceneC());
  insertAfter("5-4", "식생 · 경관", sceneD());
  insertAfter("5-5", "식생 · 경관", sceneE());
  insertAfter("5-6", "식생 · 경관", sceneH());
})();
