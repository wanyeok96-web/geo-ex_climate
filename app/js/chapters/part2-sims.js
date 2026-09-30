/* ============================================================
   지오엑스-세계의 기후 — chapters/part2-sims.js
   PART 2 시뮬레이터형 그림 (선생님 수정, 2026-09-29)
   - chapters/part2-figs.js(Cursor 원본)의 그림을 같은 이름으로 바꿔 끼움: P2F.latSun = …
     (part2.js가 불러오기 전에 실행 — index.html에서 part2-figs.js 다음, part2.js 앞)
   - 원본의 부품(P2F.kit)을 그대로 쓰고, 움직임은 requestAnimationFrame(요소가 화면에서 빠지면 멈춤)
   - 수치 모형은 모두 설명용 예시 값 — 화면에 「예시 값」으로 표시
   ============================================================ */
"use strict";

(function () {
  const K = P2F.kit, U = P2F.util, C = K.C;
  const NS = "http://www.w3.org/2000/svg";
  const clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  const lerp = function (a, b, t) { return a + (b - a) * t; };
  function deg1(v) { const r = Math.round(v * 10) / 10; return (r < 0 ? "−" : "") + Math.abs(r).toFixed(1) + "℃"; }
  function degI(v) { const r = Math.round(v); return (r < 0 ? "−" : "") + Math.abs(r) + "℃"; }
  function el(tag, attrs) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  /* 기온 → 색 (차가움 파랑 → 따뜻함 주황 → 뜨거움 빨강) */
  function tColor(t) {
    const s = [[-10, [60, 110, 220]], [5, [110, 170, 240]], [15, [120, 200, 150]], [22, [245, 190, 70]], [30, [240, 120, 50]], [40, [210, 50, 40]]];
    for (let i = 0; i < s.length - 1; i++) {
      if (t <= s[i + 1][0]) {
        const k = clamp((t - s[i][0]) / (s[i + 1][0] - s[i][0]), 0, 1), a = s[i][1], b = s[i + 1][1];
        return "rgb(" + [0, 1, 2].map(function (j) { return Math.round(lerp(a[j], b[j], k)); }).join(",") + ")";
      }
    }
    return t < s[0][0] ? "rgb(60,110,220)" : "rgb(210,50,40)";
  }
  /* 반복 움직임: fn(시간 s, 지난 시간 dt) — host가 화면에서 빠지면 멈춤 */
  function loop(host, fn) {
    if (REDUCED) { fn(0, 0); return function () {}; }
    let id = 0, t0 = performance.now(), last = t0, on = true;
    (function tick(now) {
      if (!on || !host.isConnected) return;
      fn((now - t0) / 1000, Math.min(0.1, (now - last) / 1000));
      last = now;
      id = requestAnimationFrame(tick);
    })(t0);
    return function () { on = false; cancelAnimationFrame(id); };
  }

  /* 그라데이션 · 그림자 (문서에 한 번만) */
  (function defs() {
    const box = document.createElement("div");
    box.setAttribute("aria-hidden", "true");
    box.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    box.innerHTML = '<svg width="0" height="0"><defs>' +
      '<linearGradient id="p2g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfdcff"/><stop offset="1" stop-color="#eef6ff"/></linearGradient>' +
      '<linearGradient id="p2g-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#162142"/><stop offset="1" stop-color="#3b4d7a"/></linearGradient>' +
      '<linearGradient id="p2g-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7bc8c"/><stop offset="1" stop-color="#b0915f"/></linearGradient>' +
      '<linearGradient id="p2g-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd06f"/><stop offset="1" stop-color="#57a247"/></linearGradient>' +
      '<linearGradient id="p2g-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb4ee"/><stop offset="1" stop-color="#2d73bf"/></linearGradient>' +
      '<linearGradient id="p2g-mtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a78663"/><stop offset="1" stop-color="#7a5b3d"/></linearGradient>' +
      '<linearGradient id="p2g-warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc58a"/><stop offset="1" stop-color="#f08a4b"/></linearGradient>' +
      '<linearGradient id="p2g-cold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9d8ff"/><stop offset="1" stop-color="#6fa3ea"/></linearGradient>' +
      '<radialGradient id="p2g-sun"><stop offset="0" stop-color="#fff7c2"/><stop offset=".6" stop-color="#ffd84a"/><stop offset="1" stop-color="#f5b300"/></radialGradient>' +
      '<radialGradient id="p2g-glow"><stop offset="0" stop-color="#ffe680" stop-opacity=".75"/><stop offset="1" stop-color="#ffe680" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="p2g-earth" cx=".38" cy=".35"><stop offset="0" stop-color="#8fd0ff"/><stop offset=".75" stop-color="#3b86d6"/><stop offset="1" stop-color="#245a9e"/></radialGradient>' +
      '<filter id="p2f-soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity=".22"/></filter>' +
      '</defs></svg>';
    document.body.appendChild(box);
  })();

  /* 경로를 따라 흐르는 알갱이 (해류 · 계절풍 · 바람 순환)
     container 안에서 sel에 맞는 path를 매 순간 찾아(다시 그려져도 따라감) 알갱이를 얹음 */
  function flowDots(container, sel, o) {
    o = o || {};
    let paths = [], dots = [];
    function rebuild(list) {
      dots.forEach(function (d) { if (d.g.parentNode) d.g.parentNode.removeChild(d.g); });
      dots = []; paths = list;
      list.forEach(function (p) {
        const len = p.getTotalLength(); if (!len) return;
        const sw = parseFloat(p.getAttribute("stroke-width")) || o.r || 3;
        const g = el("g", { class: "fp" + (o.cls ? " " + o.cls : "") });
        p.parentNode.insertBefore(g, p.nextSibling);
        const n = Math.max(o.min || 2, Math.round(len / (o.gap ? o.gap(sw) : sw * 6)));
        const cs = [];
        for (let i = 0; i < n; i++) { const c = el("circle", { r: (o.r ? o.r : sw * 0.62).toFixed(3) }); g.appendChild(c); cs.push(c); }
        dots.push({ p: p, g: g, len: len, cs: cs, speed: o.speed ? o.speed(sw, len) : sw * 5 });
      });
    }
    return loop(container, function (t) {
      const list = [].slice.call(container.querySelectorAll(sel));
      if (list.length !== paths.length || list.some(function (p, i) { return p !== paths[i]; })) rebuild(list);
      dots.forEach(function (d) {
        if (d.p.closest(".anim-paused")) return;
        d.cs.forEach(function (c, i) {
          const s = ((i / d.cs.length) * d.len + t * d.speed) % d.len, pt = d.p.getPointAtLength(s);
          c.setAttribute("cx", pt.x.toFixed(2)); c.setAttribute("cy", pt.y.toFixed(2));
          c.setAttribute("opacity", Math.min(1, s / (d.len * 0.12), (d.len - s) / (d.len * 0.12)).toFixed(2));
        });
      });
    });
  }

  /* 읽기 줄 */
  function readRow(cls, items) {
    return '<div class="p2-row ' + cls + '">' + items.map(function (x) { return K.big(x[0], x[1], x[2] || "", x[3] || ""); }).join("") + '</div>';
  }

  /* ==========================================================
     2-1 기후 요소
     ========================================================== */

  /* 기온 ① 의미 — 하루 동안: 백엽상(그늘 1.5m) 기온 vs 햇볕 아래 지면 온도 */
  function airT(h) { return 8 + 7 * Math.sin(Math.PI * (h - 8) / 12); }
  function groundT(h) { return 6 + 26 * Math.max(0, Math.sin(Math.PI * (h - 6.5) / 13)); }
  P2F.tMeasure = function () {
    const g = 320;
    const s = K.svgOpen(600, 360, "하루 동안의 기온 측정", "tm-svg") +
      '<rect class="p2-sky tm-sky" x="0" y="0" width="600" height="' + g + '"/>' +
      '<g class="tm-sun"><circle r="46" fill="url(#p2g-glow)"/><circle r="22" fill="url(#p2g-sun)"/></g>' +
      '<path class="tm-arc" d="M40 ' + (g - 10) + ' Q300 ' + (-150) + ' 560 ' + (g - 10) + '"/>' +
      '<rect class="p2-grass" x="0" y="' + g + '" width="600" height="40"/>' +
      '<g class="p2-shelter" filter="url(#p2f-soft)">' +
        '<line x1="236" y1="236" x2="236" y2="' + g + '"/><line x1="324" y1="236" x2="324" y2="' + g + '"/>' +
        '<polygon class="roof" points="214,150 280,120 346,150"/><rect x="222" y="150" width="116" height="86" rx="4"/>' +
        [0, 1, 2, 3, 4, 5, 6].map(function (i) { return '<line class="louver" x1="230" x2="330" y1="' + (160 + i * 11) + '" y2="' + (160 + i * 11) + '"/>'; }).join("") +
      '</g>' +
      '<g class="tm-th a" transform="translate(280 166)"><rect x="-6" y="0" width="12" height="52" rx="6"/><circle cx="0" cy="56" r="9"/><rect class="lv" x="-3" y="4" width="6" height="52"/></g>' +
      '<g class="tm-th b" transform="translate(470 ' + (g - 70) + ')"><rect x="-6" y="0" width="12" height="52" rx="6"/><circle cx="0" cy="56" r="9"/><rect class="lv" x="-3" y="4" width="6" height="52"/></g>' +
      '<g class="tm-heat">' + [440, 470, 500].map(function (x) { return '<path d="M' + x + ' ' + (g - 2) + 'q7 -9 0 -18t0 -18"/>'; }).join("") + '</g>' +
      '<g class="p2-dim"><line x1="380" y1="' + g + '" x2="380" y2="200"/><line x1="370" x2="390" y1="200" y2="200"/><line x1="370" x2="390" y1="' + g + '" y2="' + g + '"/><text x="396" y="266">1.5m</text></g>' +
      '<text class="p2-lbl" x="280" y="108" text-anchor="middle">백엽상 (그늘)</text>' +
      '<text class="p2-lbl sm" x="470" y="' + (g - 84) + '" text-anchor="middle">햇볕 아래 지면</text>' +
      '<text class="tm-clock" x="24" y="40">6시</text>' +
    '</svg>';
    return {
      html: '<div class="p2-slider"><label for="p2-hour">시각</label><input type="range" id="p2-hour" min="6" max="20" step="0.5" value="14"><span class="p2-sl-v"></span></div>' +
        '<div class="p2-ctl tm-ctl"></div>' +
        readRow("tm-read", []) +
        '<div class="p2-figwrap">' + s + K.photo("stevenson-screen", "tl") + '</div>' +
        K.cap("예시 값 — 햇볕 아래 지면은 크게 오르내리지만, 그늘진 백엽상 속 기온은 안정적 → <b>기온은 지면 약 1.5m 그늘에서 측정</b>"),
      init: function (fig) {
        const svg = fig.querySelector(".tm-svg"), inp = fig.querySelector("input");
        let h = 14, stop = function () {};
        function lv(sel, t) { svg.querySelector(sel + " .lv").style.transform = "scaleY(" + clamp((t + 5) / 40, 0.05, 1).toFixed(3) + ")"; }
        function set(v) {
          h = v; inp.value = v;
          const k = (v - 6) / 14, x = lerp(40, 560, k), y = 310 - Math.sin(Math.PI * k) * 230;
          svg.querySelector(".tm-sun").setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")");
          svg.classList.toggle("dusk", v < 7 || v > 18.5);
          const a = airT(v), gT = groundT(v);
          lv(".tm-th.a", a); lv(".tm-th.b", gT);
          svg.querySelector(".tm-heat").style.opacity = clamp((gT - 12) / 15, 0, 1).toFixed(2);
          const hh = Math.floor(v), mm = v % 1 ? "30" : "00";
          svg.querySelector(".tm-clock").textContent = hh + ":" + mm;
          fig.querySelector(".p2-sl-v").textContent = hh + "시" + (mm === "30" ? " 30분" : "");
          fig.querySelector(".tm-read").innerHTML = K.big("기온 (백엽상 · 그늘 1.5m)", deg1(a), "관측하는 값", "key") + K.big("햇볕 아래 지면", deg1(gT), "참고 — 기온 아님", "warm");
        }
        inp.addEventListener("input", function () { stop(); pl.pause(); set(+inp.value); });
        const HRS = [6, 10, 14, 18];
        const pl = K.player(fig, ".tm-ctl", ["아침 6시", "오전 10시", "오후 2시", "저녁 6시"], function (i) {
          stop(); stop = K.tween(h, HRS[i], 900, function (v) { set(Math.round(v * 2) / 2); });
        }, { interval: 2200, start: 2 });
        return function () { stop(); pl.pause(); };
      }
    };
  };

  /* 기온 ② 평균 기온 — 달마다 하나씩 모아 연평균 만들기 */
  P2F.tMean = function () {
    const c = C("Seoul"), W = 620, H = 340, L = 54, R = 24, T = 26, B = 42, lo = -10, hi = 30;
    const cw = (W - L - R) / 12, xm = function (m) { return L + m * cw + cw / 2; }, y = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
    let s = K.svgOpen(W, H, "서울 월평균 기온으로 연평균 구하기", "tmn-svg");
    for (let v = lo; v <= hi; v += 10) s += '<line class="p2-grid' + (v === 0 ? " zero" : "") + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="p2-ax" x="' + (L - 8) + '" y="' + (y(v) + 5) + '" text-anchor="end">' + v + '</text>';
    s += '<text class="p2-unit" x="' + (L - 8) + '" y="' + (T - 8) + '" text-anchor="end">℃</text>';
    s += '<polyline class="tmn-line" points=""/>';
    c.t.forEach(function (v, m) {
      s += '<g class="tmn-p" data-m="' + m + '"><circle cx="' + xm(m) + '" cy="' + y(v) + '" r="7"/><text x="' + xm(m) + '" y="' + (y(v) - 14) + '" text-anchor="middle">' + U.n1(v) + '</text></g>' +
        '<text class="p2-mon" x="' + xm(m) + '" y="' + (H - B + 24) + '" text-anchor="middle">' + (m + 1) + '</text>';
    });
    s += '<g class="tmn-mean"><line x1="' + L + '" x2="' + (W - R) + '" y1="0" y2="0"/><rect x="' + (W - R - 230) + '" y="-44" width="230" height="36" rx="10"/><text x="' + (W - R - 115) + '" y="-20" text-anchor="middle"></text></g>';
    s += '<line class="p2-base" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/></svg>';
    return {
      html: '<div class="p2-ctl tmn-ctl"></div><div class="p2-readout tmn-t" aria-live="polite"></div>' +
        '<div class="p2-figwrap">' + s + '</div>' + K.cap("하루 평균 → <b>월평균 기온</b>(점 12개) → 12달의 평균 = <b>연평균 기온</b>"),
      init: function (fig) {
        const svg = fig.querySelector(".tmn-svg");
        function show(k) {
          const n = Math.min(k + 1, 12), vals = c.t.slice(0, n), mv = U.mean(vals), fin = k >= 12;
          svg.querySelectorAll(".tmn-p").forEach(function (p) { const m = +p.getAttribute("data-m"); p.classList.toggle("on", m < n); p.classList.toggle("now", m === n - 1 && !fin); });
          svg.querySelector(".tmn-line").setAttribute("points", vals.map(function (v, m) { return xm(m) + "," + y(v); }).join(" "));
          const g = svg.querySelector(".tmn-mean");
          g.setAttribute("transform", "translate(0 " + y(mv).toFixed(1) + ")");
          g.classList.toggle("fin", fin);
          g.querySelector("text").textContent = (fin ? "연평균 " : n + "달 평균 ") + deg1(mv);
          fig.querySelector(".tmn-t").innerHTML = fin
            ? "12달 월평균 기온의 합 ÷ 12 = <b>연평균 기온 " + deg1(mv) + "</b>"
            : "<b>" + n + "월</b> 월평균 기온 " + deg1(c.t[n - 1]) + " 추가 → 지금까지 " + n + "달의 평균 " + deg1(mv);
        }
        const pl = K.player(fig, ".tmn-ctl", K.MON.concat(["연평균"]), show, { interval: 900, start: 12 });
        return function () { pl.pause(); };
      }
    };
  };

  /* 강수 ② 비가 내리는 원리 — 공기 덩어리가 올라가며 식고, 응결 고도에서 구름 */
  const LIFT_PATH = [
    [[262, 312], [262, 250], [266, 190], [272, 140]],
    [[40, 300], [130, 296], [200, 240], [270, 160], [292, 132]],
    [[90, 306], [200, 262], [300, 220], [372, 180], [396, 150]],
    [[70, 306], [180, 306], [270, 300], [300, 230], [302, 140]]
  ];
  P2F.pLift = function () {
    return {
      html: K.seg("lift", K.LIFT.map(function (l) { return l.name; }), 0) + '<div class="p2-ctl lift-ctl"></div>' +
        '<div class="p2-figwrap p2-scene lift" data-st="4">' + K.liftScene(0) + '</div>' + '<p class="p2-cap lift-t">' + fmtKo(K.LIFT[0].t) + '</p>',
      init: function (fig) {
        const sc = fig.querySelector(".p2-scene");
        let kind = 0;
        function addParcel() {
          const svg = sc.querySelector("svg"), P = LIFT_PATH[kind];
          const d = "M" + P.map(function (p) { return p.join(" "); }).join("L");
          const path = el("path", { d: d, class: "lf-path" });
          const g = el("g", { class: "lf-parcel" });
          g.appendChild(el("circle", { r: "17" }));
          const tx = el("text", { y: "5", "text-anchor": "middle" }); g.appendChild(tx);
          svg.appendChild(path); svg.appendChild(g);
          return { path: path, g: g, tx: tx, len: path.getTotalLength() };
        }
        let P = addParcel();
        const stop = loop(sc, function (t) {
          if (!P.g.isConnected) P = addParcel();
          const k = (t % 4.2) / 4.2, s = k * P.len, pt = P.path.getPointAtLength(s);
          const temp = 25 - (312 - pt.y) / 20, cond = pt.y <= 152;
          P.g.setAttribute("transform", "translate(" + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ")");
          P.g.querySelector("circle").setAttribute("fill", cond ? "#e9eef5" : tColor(temp));
          P.g.classList.toggle("cond", cond);
          P.tx.textContent = Math.round(temp) + "℃";
          P.g.setAttribute("opacity", Math.min(1, (1 - k) * 8).toFixed(2));
        });
        const pl = K.player(fig, ".lift-ctl", ["공기 상승", "냉각", "수증기 응결", "구름", "강수"], function (k) { sc.setAttribute("data-st", k); }, { interval: 1700, start: 4 });
        K.bindSeg(fig, "lift", function (i) {
          kind = i;
          sc.innerHTML = K.liftScene(i);
          P = addParcel();
          fig.querySelector(".lift-t").innerHTML = fmtKo(K.LIFT[i].t);
          pl.reset(); pl.play();
        });
        return function () { stop(); pl.pause(); };
      }
    };
  };

  /* 바람 ② 풍향과 풍속 — 나침반 위로 바람 줄기가 흐름, 방향 바꾸면 부드럽게 회전 */
  const DIRS = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
  P2F.wDirection = function () {
    const cx = 300, cy = 180, R = 130;
    let ticks = "";
    const N16 = ["북", "북북동", "북동", "동북동", "동", "동남동", "남동", "남남동", "남", "남남서", "남서", "서남서", "서", "서북서", "북서", "북북서"];
    N16.forEach(function (n, i) {
      const a = i * Math.PI / 8 - Math.PI / 2, main = i % 2 === 0;
      ticks += '<line class="tick' + (main ? " main" : "") + '" x1="' + (cx + Math.cos(a) * (R - (main ? 16 : 9))) + '" y1="' + (cy + Math.sin(a) * (R - (main ? 16 : 9))) + '" x2="' + (cx + Math.cos(a) * R) + '" y2="' + (cy + Math.sin(a) * R) + '"/>';
      if (main) ticks += '<text class="p2-lbl' + (i % 4 ? " sm" : "") + '" x="' + (cx + Math.cos(a) * (R + 22)) + '" y="' + (cy + Math.sin(a) * (R + 22) + 6) + '" text-anchor="middle">' + n + '</text>';
    });
    let streaks = "";
    for (let i = 0; i < 9; i++) streaks += '<line class="wd-st" x1="' + (cx - 100 + i * 25) + '" x2="' + (cx - 100 + i * 25) + '" y1="' + (cy - 150) + '" y2="' + (cy - 118) + '" style="animation-delay:' + (-(i * 0.37) % 1.4).toFixed(2) + 's"/>';
    const s = K.svgOpen(600, 360, "풍향 나침반", "wd-svg") +
      '<circle class="p2-compass" cx="' + cx + '" cy="' + cy + '" r="' + R + '"/>' + ticks +
      '<g class="wd-rot" style="transform-origin:' + cx + 'px ' + cy + 'px">' +
        '<clipPath id="wd-clip"><circle cx="' + cx + '" cy="' + cy + '" r="' + (R - 2) + '"/></clipPath>' +
        '<g clip-path="url(#wd-clip)" class="wd-streaks">' + streaks + '</g>' +
        '<g class="p2-dir">' + K.ar(cx, cy - R + 20, cx, cy + R - 24, "p2-arrow wind dir", 12) + '</g>' +
      '</g>' +
      '<circle class="p2-cdot" cx="' + cx + '" cy="' + cy + '" r="6"/>' +
    '</svg>';
    function label(i) { return '<b class="p2-dirname">' + DIRS[i] + '풍</b> — ' + DIRS[i] + "쪽에서 " + DIRS[(i + 4) % 8] + "쪽으로 부는 바람"; }
    return {
      html: K.seg("dir", DIRS.map(function (d) { return d + "풍"; }), 7) + '<div class="p2-figwrap">' + s + K.photo("wind-vane", "tr") + '</div>' +
        '<div class="p2-readout dir-t">' + label(7) + '</div>' + K.cap("풍속: 바람의 빠르기 — m/s(초속)로 나타냄"),
      init: function (fig) {
        const g = fig.querySelector(".wd-rot");
        let cur = 7 * 45;
        function set(i) {
          let tgt = i * 45;                       // 가까운 쪽으로 돌기
          while (tgt - cur > 180) tgt -= 360;
          while (cur - tgt > 180) tgt += 360;
          cur = tgt;
          g.style.transform = "rotate(" + cur + "deg)";
          fig.querySelector(".dir-t").innerHTML = label(i);
        }
        K.bindSeg(fig, "dir", set);
        set(7);
      }
    };
  };

  /* 바람 ③ 여러 규모의 바람 — 해륙풍: 공기가 순환 고리를 따라 흐름 */
  const origWScale = P2F.wScale;
  P2F.wScale = function () {
    const f = origWScale();
    return {
      html: f.html,
      init: function (fig) {
        const sc = fig.querySelector(".p2-scene");
        function addLoop() {
          const svg = sc.querySelector("svg");
          if (!svg || svg.querySelector(".sb-loop")) return;
          const night = /밤/.test(svg.getAttribute("aria-label"));
          const d = night ? "M140 225 L460 225 L490 205 L490 115 L460 95 L140 95 L110 115 L110 205 Z" : "M460 225 L140 225 L110 205 L110 115 L140 95 L460 95 L490 115 L490 205 Z";
          svg.insertBefore(el("path", { d: d, class: "sb-loop", "stroke-width": "6" }), svg.firstChild.nextSibling);
        }
        const clean = f.init(fig);
        addLoop();
        const mo = new MutationObserver(addLoop); mo.observe(sc, { childList: true });
        const stop = flowDots(sc, ".sb-loop", { r: 5, gap: function () { return 55; }, speed: function () { return 120; } });
        return function () { mo.disconnect(); stop(); if (clean) clean(); };
      }
    };
  };

  /* ==========================================================
     2-2 기후 요인
     ========================================================== */

  /* 위도 ① 태양 고도와 에너지 — 지구 · 햇빛 띠 · 지표면 확대 · 에너지 게이지 */
  P2F.latSun = function () {
    const W = 900, H = 430, cx = 300, cy = 215, r = 165;
    function scene(phi) {
      const f = phi * Math.PI / 180, yc = cy - r * Math.sin(f), h = 30;
      const xh = function (yy) { return cx - Math.sqrt(Math.max(0, r * r - (yy - cy) * (yy - cy))); };
      const y1 = yc - h / 2, y2 = yc + h / 2;
      let rays = "";
      for (let i = 0; i < 7; i++) {
        const yy = cy - r + 20 + i * ((2 * r - 40) / 6);
        rays += '<line class="ls-ray" x1="20" y1="' + yy + '" x2="' + (xh(yy) - 3).toFixed(1) + '" y2="' + yy + '"/>';
      }
      let arc = "";
      for (let k = 0; k <= 12; k++) { const yy = y1 + k * h / 12; arc += (k ? "L" : "M") + xh(yy).toFixed(1) + " " + yy.toFixed(1); }
      let lats = "";
      [-60, -30, 0, 30, 60].forEach(function (l) {
        const yy = cy - r * Math.sin(l * Math.PI / 180), hw = r * Math.cos(l * Math.PI / 180);
        lats += '<line class="ls-lat' + (l === 0 ? " eq" : "") + '" x1="' + (cx - hw) + '" x2="' + (cx + hw) + '" y1="' + yy + '" y2="' + yy + '"/>' +
          '<text class="ls-latt" x="' + (cx + hw + 8) + '" y="' + (yy + 5) + '">' + (l === 0 ? "적도" : Math.abs(l) + "°" + (l > 0 ? "N" : "S")) + '</text>';
      });
      /* 오른쪽: 지표면 확대 — 같은 폭의 햇빛이 비스듬히 닿아 넓게 퍼짐 */
      const gx = 560, gy = 320, bw = 70, spread = bw / Math.max(Math.cos(f), 0.18), alt = 90 - phi;
      const ang = alt * Math.PI / 180, dx = Math.cos(ang), dy = Math.sin(ang);
      const a1 = gx + 20, a2 = a1 + Math.min(spread, 240);
      const L = Math.min(150, 80 / Math.max(dx, 0.01));
      const b1x = a1 - dx * L, b1y = gy - dy * L, b2x = a2 - dx * L, b2y = gy - dy * L;
      const e = Math.cos(f), eh = 190 * e;
      return '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 16) + '" class="ls-atm"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#p2g-earth)" class="ls-earth"/>' +
        '<path class="ls-night" d="M' + cx + ' ' + (cy - r) + ' A' + r + ' ' + r + ' 0 0 1 ' + cx + ' ' + (cy + r) + ' Z"/>' +
        lats + rays +
        '<polygon class="ls-beam" points="20,' + y1 + ' ' + xh(y1).toFixed(1) + ',' + y1 + ' ' + xh(y2).toFixed(1) + ',' + y2 + ' 20,' + y2 + '"/>' +
        '<path class="ls-foot" d="' + arc + '"/>' +
        '<circle class="ls-pin" cx="' + xh(yc).toFixed(1) + '" cy="' + yc.toFixed(1) + '" r="7"/>' +
        '<text class="p2-lbl sm" x="26" y="' + (y1 - 8) + '">같은 양의 햇빛</text>' +
        '<g class="ls-zoom">' +
          '<text class="p2-lbl sm" x="' + (gx - 10) + '" y="40">지표면 확대</text>' +
          '<rect class="ls-gnd" x="' + (gx - 20) + '" y="' + gy + '" width="250" height="26" rx="4"/>' +
          '<polygon class="ls-beam z" points="' + b1x.toFixed(1) + ',' + b1y.toFixed(1) + ' ' + a1 + ',' + gy + ' ' + a2.toFixed(1) + ',' + gy + ' ' + b2x.toFixed(1) + ',' + b2y.toFixed(1) + '"/>' +
          '<rect class="ls-hit" x="' + a1 + '" y="' + (gy - 5) + '" width="' + Math.min(220, spread).toFixed(1) + '" height="8" rx="3" style="opacity:' + (0.35 + 0.65 * e).toFixed(2) + '"/>' +
          '<path class="ls-angle" d="M' + (a1 - 42) + ' ' + gy + ' A42 42 0 0 1 ' + (a1 - 42 * dx).toFixed(1) + ' ' + (gy - 42 * dy).toFixed(1) + '"/>' +
          '<text class="ls-angt" x="' + (gx - 10) + '" y="' + (gy + 52) + '">태양 고도 ' + Math.round(alt) + '° — 비추는 폭 × ' + (1 / Math.max(Math.cos(f), 0.01)).toFixed(1) + '</text>' +
        '</g>' +
        '<g class="ls-gauge"><rect x="850" y="110" width="30" height="190" rx="8" class="ls-gbg"/>' +
          '<rect x="850" y="' + (300 - eh).toFixed(1) + '" width="30" height="' + eh.toFixed(1) + '" rx="8" class="ls-gfill" style="fill:' + tColor(-8 + 40 * e) + '"/>' +
          '<text x="865" y="96" text-anchor="middle" class="ls-gt">' + Math.round(e * 100) + '%</text><text x="865" y="324" text-anchor="middle" class="ls-gs">에너지</text></g>';
    }
    function read(phi) {
      const e = Math.cos(phi * Math.PI / 180);
      return K.big("태양 고도(정오)", Math.round(90 - phi) + "°", "춘분·추분") + K.big("비추는 면적", "× " + (1 / e).toFixed(1), "적도 = × 1.0") +
        K.big("단위 면적당 에너지", Math.round(e * 100) + "%", "적도 = 100%", "key");
    }
    return {
      html: '<div class="p2-slider"><label for="p2-lat">위도</label><input type="range" id="p2-lat" min="0" max="80" step="1" value="0"><span class="p2-sl-v">0°</span></div>' +
        '<div class="p2-ctl lat-ctl"></div>' +
        '<div class="p2-row lat-read">' + read(0) + '</div>' +
        '<div class="p2-figwrap"><svg class="p2-svg ls-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="위도에 따른 태양 에너지">' + scene(0) + '</svg></div>' +
        K.cap("춘분·추분 정오 모식도 — 위도가 높을수록 햇빛이 비스듬히 닿아 같은 에너지가 넓게 퍼짐"),
      init: function (fig) {
        const inp = fig.querySelector("input"), svg = fig.querySelector(".ls-svg");
        let cur = 0, stop = function () {};
        function set(v) {
          cur = v; inp.value = v;
          fig.querySelector(".p2-sl-v").textContent = Math.round(v) + "°";
          fig.querySelector(".lat-read").innerHTML = read(Math.round(v));
          svg.innerHTML = scene(v);
        }
        inp.addEventListener("input", function () { stop(); pl.pause(); set(+inp.value); });
        const pl = K.player(fig, ".lat-ctl", K.LAT_PRESET.map(function (p) { return p[0] + " " + p[1] + "°"; }), function (k) {
          stop(); stop = K.tween(cur, Math.round(K.LAT_PRESET[k][1]), 1000, set);
        }, { interval: 2400 });
        return function () { stop(); pl.pause(); };
      }
    };
  };

  /* 위도 ③ 에너지 과잉·부족 — 열 이동 화살표가 흐름 */
  const origBudget = P2F.latBudget;
  P2F.latBudget = function () {
    const f = origBudget();
    return { html: f.html.replace('<div class="p2-figwrap">', '<div class="p2-figwrap lb-flow">'), init: f.init };
  };

  /* 수륙 분포 ① 육지와 바다 — 가열·냉각 시뮬레이터 (시간에 따른 기온 곡선) */
  P2F.lsHeat = function () {
    const W = 900, H = 380, gx0 = 440, gx1 = 880, gy0 = 40, gy1 = 320, N = 140;
    const ty = function (t) { return gy1 - (t - 0) / 40 * (gy1 - gy0); };
    let s = '<svg class="p2-svg hs-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="육지와 바다의 가열·냉각">' +
      '<rect class="hs-sky" x="0" y="0" width="400" height="240" rx="0"/>' +
      '<g class="hs-sun"><circle cx="200" cy="70" r="50" fill="url(#p2g-glow)"/><circle cx="200" cy="70" r="24" fill="url(#p2g-sun)"/></g>' +
      '<g class="hs-moon"><circle cx="200" cy="70" r="20"/></g>' +
      '<g class="hs-rays">' + [110, 160, 240, 290].map(function (x, i) { return '<line x1="' + (200 + (x - 200) * .3) + '" y1="100" x2="' + x + '" y2="226" style="animation-delay:' + (i * .2) + 's"/>'; }).join("") + '</g>' +
      '<rect class="hs-land" x="0" y="240" width="200" height="120"/><rect class="p2-seab hs-sea" x="200" y="240" width="200" height="120"/>' +
      '<g class="hs-waves">' + [0, 1, 2].map(function (i) { return '<path d="M' + (210 + i * 60) + ' ' + (262 + i * 20) + ' q15 -8 30 0 t30 0"/>'; }).join("") + '</g>' +
      ['land', 'sea'].map(function (k, i) {
        const x = i ? 300 : 100;
        return '<g class="hs-th ' + k + '" transform="translate(' + x + ' 120)"><rect x="-10" y="0" width="20" height="96" rx="10"/><circle cx="0" cy="104" r="15"/><rect class="lv" x="-5" y="6" width="10" height="98"/></g>' +
          '<text class="hs-num ' + k + '" x="' + (x + 24) + '" y="160"></text>' +
          '<text class="p2-lbl" x="' + x + '" y="296" text-anchor="middle">' + (i ? "바다" : "육지") + '</text>';
      }).join("") +
      '<text class="p2-lbl sm" x="' + gx0 + '" y="26">시간에 따른 기온 (예시 값)</text>';
    for (let t = 0; t <= 40; t += 10) s += '<line class="p2-grid" x1="' + gx0 + '" x2="' + gx1 + '" y1="' + ty(t) + '" y2="' + ty(t) + '"/><text class="p2-ax" x="' + (gx0 - 6) + '" y="' + (ty(t) + 5) + '" text-anchor="end">' + t + '</text>';
    s += '<g class="hs-bands"></g><polyline class="hs-l land" points=""/><polyline class="hs-l sea" points=""/>' +
      '<g class="p2-legend"><line class="hs-l land" x1="' + (gx0 + 10) + '" x2="' + (gx0 + 40) + '" y1="' + (gy1 + 30) + '" y2="' + (gy1 + 30) + '"/><text x="' + (gx0 + 46) + '" y="' + (gy1 + 35) + '">육지</text>' +
      '<line class="hs-l sea" x1="' + (gx0 + 110) + '" x2="' + (gx0 + 140) + '" y1="' + (gy1 + 30) + '" y2="' + (gy1 + 30) + '"/><text x="' + (gx0 + 146) + '" y="' + (gy1 + 35) + '">바다</text>' +
      '<text x="' + (gx0 + 220) + '" y="' + (gy1 + 35) + '" class="hs-lg-t">노란 칸 = 햇빛 비춤</text></g></svg>';
    return {
      html: '<div class="p2-ctl hs-ctl">' + K.seg("sun", ["☀️ 햇빛 비춤 (여름·낮)", "🌙 햇빛 약함 (겨울·밤)"], 0) +
          '<button type="button" class="anim-btn hs-play on">⏸ 멈춤</button><button type="button" class="anim-btn anim-reset hs-reset" aria-label="처음부터">↻</button>' +
          '<label class="hs-auto"><input type="checkbox" checked> 자동 전환</label></div>' +
        '<div class="p2-row hs-read"></div>' +
        '<div class="p2-figwrap">' + s + '</div>' +
        K.cap("같은 햇빛을 받아도 육지는 빨리 데워지고 빨리 식음, 바다는 천천히 — 바다의 <b>비열</b>이 크기 때문 (예시 모형)"),
      init: function (fig) {
        const svg = fig.querySelector(".hs-svg");
        let land = 15, sea = 15, sun = true, run = true, hist = [], tick = 0, acc = 0;
        const autoBox = fig.querySelector(".hs-auto input");
        function setSun(on, fromSeg) {
          sun = on; svg.classList.toggle("night", !on);
          if (!fromSeg) fig.querySelectorAll('[data-seg="sun"] .p2-sb').forEach(function (b, i) { b.classList.toggle("on", i === (on ? 0 : 1)); });
        }
        K.bindSeg(fig, "sun", function (i) { setSun(i === 0, true); autoBox.checked = false; });
        function lv(k, t) { svg.querySelector(".hs-th." + k + " .lv").style.transform = "scaleY(" + clamp(t / 40, 0.04, 1).toFixed(3) + ")"; }
        function draw() {
          lv("land", land); lv("sea", sea);
          svg.querySelector(".hs-num.land").textContent = degI(land);
          svg.querySelector(".hs-num.sea").textContent = degI(sea);
          const xs = function (i) { return gx0 + i / (N - 1) * (gx1 - gx0); };
          svg.querySelector(".hs-l.land").setAttribute("points", hist.map(function (p, i) { return xs(i).toFixed(1) + "," + ty(p[0]).toFixed(1); }).join(" "));
          svg.querySelector(".hs-l.sea").setAttribute("points", hist.map(function (p, i) { return xs(i).toFixed(1) + "," + ty(p[1]).toFixed(1); }).join(" "));
          let bands = "", st = -1;
          hist.forEach(function (p, i) {
            if (p[2] && st < 0) st = i;
            if ((!p[2] || i === hist.length - 1) && st >= 0) { bands += '<rect x="' + xs(st).toFixed(1) + '" y="' + gy0 + '" width="' + (xs(p[2] ? i : i - 1) - xs(st) + 1).toFixed(1) + '" height="' + (gy1 - gy0) + '"/>'; st = -1; }
          });
          svg.querySelector(".hs-bands").innerHTML = bands;
          fig.querySelector(".hs-read").innerHTML = K.big("육지", degI(land), sun ? "빨리 데워짐" : "빨리 식음", "warm") + K.big("바다", degI(sea), sun ? "천천히 데워짐" : "천천히 식음", "cold") +
            K.big("육지 − 바다", (land - sea >= 0 ? "+" : "−") + Math.abs(Math.round(land - sea)) + "℃", "기온 차", "key");
        }
        function step() {
          tick++;
          if (autoBox.checked && tick % 60 === 0) setSun(!sun);
          const eq = sun ? 34 : 2;
          land += (eq - land) * 0.07; sea += (eq - sea) * 0.015;
          hist.push([land, sea, sun]); if (hist.length > N) hist.shift();
        }
        function reset() { land = 15; sea = 15; hist = []; tick = 0; setSun(true); draw(); }
        const stop = loop(svg, function (t, dt) {
          if (!run) return;
          acc += dt;
          while (acc > 0.09) { acc -= 0.09; step(); }
          draw();
        });
        fig.querySelector(".hs-play").addEventListener("click", function () {
          run = !run; this.classList.toggle("on", run); this.textContent = run ? "⏸ 멈춤" : "▶ 재생";
        });
        fig.querySelector(".hs-reset").addEventListener("click", reset);
        reset();
        if (REDUCED) { for (let i = 0; i < 90; i++) step(); draw(); }
        return stop;
      }
    };
  };

  /* 해류 ①②③ — 해류 화살표 위로 알갱이가 흐름 */
  ["curMap", "curWarm", "curCold"].forEach(function (name) {
    const orig = P2F[name];
    P2F[name] = function () {
      const f = orig();
      return {
        html: f.html,
        init: function (fig) {
          const clean = f.init(fig);
          const stop = flowDots(fig, ".p2-ov .p2-cur .ga-l", {
            gap: function (sw) { return sw * 5.5; },
            speed: function (sw) { return sw * 4.2; },
            r: 0
          });
          return function () { stop(); if (clean) clean(); };
        }
      };
    };
  });

  /* 계절풍 ① 원리 — 계절풍 화살표 위로 알갱이가 흐름 */
  const origMon = P2F.monPrinciple;
  P2F.monPrinciple = function () {
    const f = origMon();
    return {
      html: f.html,
      init: function (fig) {
        const clean = f.init(fig);
        const stop = flowDots(fig, ".p2-ov .p2-msn .ga-l", { gap: function (sw) { return sw * 4.5; }, speed: function (sw) { return sw * 4; } });
        return function () { stop(); if (clean) clean(); };
      }
    };
  };

  /* 지형 ① 해발 고도 — 산 오르기: 고도 · 기온 · 식생대 */
  const VEG = [[0, 1000, "열대 우림", "#2f8f3a"], [1000, 2500, "산지 숲", "#58a55a"], [2500, 3500, "고산 관목 · 경작지", "#a4c46a"], [3500, 4700, "고산 초원", "#cdb96d"], [4700, 6000, "만년설", "#f2f6fb"]];
  P2F.terAlt = function () {
    const base = C("Iquitos"), baseAlt = 100, lapse = 0.5, maxH = 5000;
    const CITY_ALT = [["Iquitos", 100], ["Bogota", 2640], ["Quito", 2850], ["La_Paz", 3640]];
    const g = 330, top = 50;
    const yOf = function (h) { return g - h / maxH * (g - top); };
    const xL = function (h) { return 90 + h / maxH * 200; };
    const xR = function (h) { return 490 - h / maxH * 200; };
    let axis = "";
    for (let h = 0; h <= maxH; h += 1000) axis += '<line class="p2-grid" x1="40" x2="620" y1="' + yOf(h) + '" y2="' + yOf(h) + '"/><text class="p2-ax" x="36" y="' + (yOf(h) + 5) + '" text-anchor="end">' + h.toLocaleString("ko-KR") + '</text>';
    const mtn = '90,' + g + ' 290,' + top + ' 490,' + g;
    let bands = VEG.map(function (v) { return '<rect x="80" y="' + yOf(Math.min(v[1], maxH)) + '" width="420" height="' + (yOf(v[0]) - yOf(Math.min(v[1], maxH))) + '" fill="' + v[3] + '"/>'; }).join("");
    let cities = "";
    CITY_ALT.forEach(function (ca, i) {
      const c = C(ca[0]), h = ca[1];
      cities += '<g class="p2-alt-city"><circle cx="' + xR(h) + '" cy="' + yOf(h) + '" r="7"/>' +
        '<text class="p2-lbl sm" x="' + (xR(h) + 12) + '" y="' + (yOf(h) + (i === 1 ? 16 : i === 2 ? -6 : 5)) + '">' + escHtml(c.kr) + ' ' + U.deg(U.mean(c.t)) + '</text></g>';
    });
    const s = K.svgOpen(660, 370, "해발 고도와 기온", "ta-svg") +
      '<rect class="p2-sky" x="0" y="0" width="660" height="' + g + '"/>' + axis + '<text class="p2-unit" x="36" y="' + (top - 18) + '" text-anchor="end">m</text>' +
      '<clipPath id="ta-clip"><polygon points="' + mtn + '"/></clipPath><g clip-path="url(#ta-clip)" class="ta-bands">' + bands + '</g>' +
      '<polygon class="ta-mtn" points="' + mtn + '"/>' +
      '<rect class="p2-ground" x="40" y="' + g + '" width="620" height="40"/>' + cities +
      '<g class="ta-hiker"><circle r="11"/><g class="ta-th" transform="translate(-44 -46)"><rect x="-7" y="0" width="14" height="44" rx="7"/><circle cx="0" cy="48" r="10"/><rect class="lv" x="-3.5" y="4" width="7" height="44"/></g>' +
        '<rect class="ta-tag" x="-104" y="-30" width="50" height="24" rx="6"/><text class="ta-tagt" x="-79" y="-13" text-anchor="middle"></text></g>' +
    "</svg>";
    return {
      html: '<div class="p2-slider"><label for="p2-alt">해발 고도</label><input type="range" id="p2-alt" min="0" max="' + maxH + '" step="100" value="100"><span class="p2-sl-v"></span></div>' +
        '<div class="p2-ctl ta-ctl"></div>' +
        '<div class="p2-row alt-read"></div>' +
        '<div class="p2-figwrap">' + s + '</div>' +
        K.cap("예상 기온 = 이키토스(해발 약 100m, 연평균 " + U.deg(U.mean(base.t)) + ")에서 100m마다 약 " + lapse + "℃ 낮아진다고 가정 · 산의 색 = 높이에 따른 식생대(안데스 예) · 오른쪽 점 = 실제 도시"),
      init: function (fig) {
        const inp = fig.querySelector("input"), hk = fig.querySelector(".ta-hiker");
        let cur = 100, stop = function () {};
        function zone(h) { for (let i = 0; i < VEG.length; i++) if (h < VEG[i][1]) return VEG[i]; return VEG[VEG.length - 1]; }
        function set(h) {
          cur = h; inp.value = h;
          const t = U.mean(base.t) - (h - baseAlt) / 100 * lapse, z = zone(h);
          hk.setAttribute("transform", "translate(" + xL(h).toFixed(1) + " " + yOf(h).toFixed(1) + ")");
          hk.querySelector(".lv").style.transform = "scaleY(" + clamp((t + 10) / 45, 0.05, 1).toFixed(3) + ")";
          hk.querySelector(".lv").style.fill = tColor(t);
          hk.querySelector(".ta-tagt").textContent = degI(t);
          fig.querySelector(".p2-sl-v").textContent = Math.round(h).toLocaleString("ko-KR") + "m";
          fig.querySelector(".alt-read").innerHTML = K.big("해발 고도", Math.round(h).toLocaleString("ko-KR") + "m", "") +
            K.big("예상 연평균 기온", U.deg(t), "100m마다 약 " + lapse + "℃ 하강", t < 15 ? "cold" : "warm") +
            K.big("식생대", z[2], "높이에 따라 바뀜", "key");
        }
        inp.addEventListener("input", function () { stop(); pl.pause(); set(+inp.value); });
        const HS = [100, 1000, 2000, 3000, 4000, 5000];
        const pl = K.player(fig, ".ta-ctl", ["저지대", "1,000m", "2,000m", "3,000m", "4,000m", "5,000m"], function (k) {
          stop(); stop = K.tween(cur, HS[k], 1100, function (v) { set(Math.round(v / 10) * 10); });
        }, { interval: 2000 });
        return function () { stop(); pl.pause(); };
      }
    };
  };

  /* 지형 ② 바람받이와 비 그늘 — 공기 덩어리 시뮬레이터 (고도 · 기온 · 습도) */
  P2F.terShadow = function () {
    const g = 320, peak = 100, top = 2000, cond = 1000;
    const yOfZ = function (z) { return g - z / top * (g - peak); };
    function model(z, up) {                             // z: 고도(m), up: 바람받이 쪽이면 true
      let t, rh, st;
      if (up && z <= cond) { t = 25 - z / 100 * 1.0; rh = 60 + 40 * z / cond; st = "올라가며 식음"; }
      else if (up) { t = 15 - (z - cond) / 100 * 0.5; rh = 100; st = "구름 · 비"; }
      else { t = 10 + (top - z) / 100 * 1.0; rh = Math.max(22, 100 * Math.pow(0.52, (top - z) / 1000 * 1.8)); st = z > cond ? "내려가며 데워짐" : "고온 건조"; }
      return { z: z, t: t, rh: rh, st: st, up: up };
    }
    function scene(fromEast) {
      const f = fromEast ? -1 : 1, X = function (dx) { return 300 + f * dx; };
      const P = [[-290, g - 14], [-220, g - 14]];
      for (let i = 0; i <= 20; i++) { const z = i / 20 * top; P.push([-220 + i / 20 * 200 + 6, yOfZ(z) - 14]); }
      for (let i = 20; i >= 0; i--) { const z = i / 20 * top; P.push([220 - i / 20 * 200 - 6, yOfZ(z) - 14]); }
      P.push([290, g - 14]);
      const d = "M" + P.map(function (p) { return X(p[0]).toFixed(1) + " " + p[1].toFixed(1); }).join("L");
      return K.svgOpen(600, 360, "바람받이 사면과 비 그늘", "tsh-svg") +
        '<rect class="p2-sky" x="0" y="0" width="600" height="' + g + '"/>' +
        '<rect class="tsh-dryglow" x="' + Math.min(X(40), X(300)) + '" y="' + (yOfZ(cond)) + '" width="260" height="' + (g - yOfZ(cond)) + '"/>' +
        '<line class="p2-cond" x1="0" x2="600" y1="' + yOfZ(cond) + '" y2="' + yOfZ(cond) + '"/>' +
        '<text class="p2-lbl sm muted" x="' + (fromEast ? 590 : 10) + '" y="' + (yOfZ(cond) - 8) + '" text-anchor="' + (fromEast ? "end" : "start") + '">응결 고도 약 1,000m</text>' +
        '<rect class="p2-ground" x="0" y="' + g + '" width="600" height="40"/>' +
        '<polygon class="ta-mtn tsh-mtn" points="80,' + g + ' 300,' + peak + ' 520,' + g + '"/>' +
        '<rect class="p2-wet" x="' + Math.min(X(-300), X(-60)) + '" y="' + (g - 2) + '" width="240" height="8"/>' +
        '<rect class="p2-dry" x="' + Math.min(X(60), X(300)) + '" y="' + (g - 2) + '" width="240" height="8"/>' +
        '<g class="tsh-cloud">' + K.cloud(X(-95), yOfZ(1500), 1.1, "p2-cloud dark") + K.rain(X(-95) - 50, yOfZ(1500) + 22, 100, g - yOfZ(1500) - 40, 7) + '</g>' +
        '<path class="tsh-path" d="' + d + '"/>' +
        '<text class="p2-lbl" x="' + X(-200) + '" y="180" text-anchor="middle">바람받이 사면</text>' +
        '<text class="p2-lbl" x="' + X(200) + '" y="180" text-anchor="middle">비 그늘</text>' +
        '<g class="tsh-parcel"><circle r="22"/><text y="6" text-anchor="middle"></text></g>' +
      "</svg>";
    }
    return {
      html: K.seg("wind", ["바람 → (서쪽에서)", "← 바람 (동쪽에서)"], 0) +
        '<div class="p2-slider"><label for="p2-tsh">공기의 위치</label><input type="range" id="p2-tsh" min="0" max="100" step="1" value="0"><span class="p2-sl-v"></span>' +
          '<button type="button" class="anim-btn tsh-play on">⏸ 멈춤</button></div>' +
        '<div class="p2-row tsh-read"></div>' +
        '<div class="p2-figwrap p2-scene">' + scene(false) + '</div>' +
        K.cap("예시 모형 — 올라갈 때: 구름 전 100m마다 약 1℃, 구름 속 약 0.5℃ 하강 / 내려갈 때: 100m마다 약 1℃ 상승 → 산을 넘은 바람은 <b>고온 건조</b> — 푄 (높새바람)"),
      init: function (fig) {
        const sc = fig.querySelector(".p2-scene"), inp = fig.querySelector("#p2-tsh");
        let k = 0, run = !REDUCED, path = null, len = 0, east = false;
        function bind() { path = sc.querySelector(".tsh-path"); len = path.getTotalLength(); }
        function set(v) {
          k = clamp(v, 0, 1); inp.value = Math.round(k * 100);
          if (!path || !path.isConnected) bind();
          const pt = path.getPointAtLength(k * len);
          const m = model(clamp((g - 14 - pt.y) / (g - peak) * top, 0, top), (east ? -1 : 1) * (pt.x - 300) < 0);
          const p = sc.querySelector(".tsh-parcel");
          p.setAttribute("transform", "translate(" + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ")");
          p.querySelector("circle").setAttribute("fill", m.rh >= 99.5 ? "#dfe6ef" : tColor(m.t));
          p.querySelector("text").textContent = degI(m.t);
          sc.querySelector(".tsh-svg").classList.toggle("raining", m.up && m.z > cond);
          sc.querySelector(".tsh-svg").classList.toggle("dry", !m.up && m.z < cond * 1.2);
          fig.querySelector(".p2-sl-v").textContent = m.up ? "바람받이 사면" : "비 그늘";
          fig.querySelector(".tsh-read").innerHTML = K.big("고도", Math.round(m.z / 10) * 10 + "m", "") +
            K.big("공기의 기온", deg1(m.t), "", m.t >= 20 ? "warm" : "cold") +
            K.big("상대 습도", Math.round(m.rh) + "%", m.rh >= 99.5 ? "포화 → 응결" : "", "rain") + K.big("상태", m.st, "", "key");
        }
        K.bindSeg(fig, "wind", function (i) { east = i === 1; sc.innerHTML = scene(east); bind(); set(k); });
        inp.addEventListener("input", function () { run = false; syncBtn(); set(+inp.value / 100); });
        const btn = fig.querySelector(".tsh-play");
        function syncBtn() { btn.classList.toggle("on", run); btn.textContent = run ? "⏸ 멈춤" : "▶ 재생"; }
        btn.addEventListener("click", function () { run = !run; syncBtn(); });
        syncBtn();
        bind(); set(REDUCED ? 0.8 : 0);
        return loop(sc, function (t, dt) { if (run) set((k + dt / 9) % 1); });
      }
    };
  };

  /* 기단과 전선 ① 기단 — 계절을 고르면 우리나라에 영향을 주는 기단과 바람 */
  const SEASON = [
    { n: "전체", act: [0, 1, 2, 3], t: "지도의 기단 누르기 → 성질과 영향 · 계절 버튼 → 그 계절의 기단" },
    { n: "❄️ 겨울", act: [0], t: "<b>시베리아 기단</b>(한랭 건조) → 북서 계절풍 · 한파 · 삼한사온" },
    { n: "🌧️ 초여름", act: [1, 2], t: "<b>오호츠크해 기단</b> + <b>북태평양 기단</b> → 장마 전선 · 영동의 높새바람" },
    { n: "☀️ 한여름", act: [2], t: "<b>북태평양 기단</b>(고온 다습) → 무더위 · 열대야" },
    { n: "🌀 늦여름~가을", act: [3, 2], t: "<b>적도 기단</b>(고온 다습) → 태풍과 함께 많은 비" }
  ];
  P2F.amMass = function () {
    function svg(u, sel, act) {
      return K.MASSES.map(function (m, i) {
        const on = act.indexOf(i) >= 0;
        return '<g class="p2-mass' + (sel === i ? " on" : "") + (on ? "" : " dim") + " c" + m.cell + '" data-mass="' + i + '">' +
          '<ellipse cx="' + m.at[0] + '" cy="' + (-m.at[1]) + '" rx="11" ry="6.5"/>' +
          K.geoText(m.at[0], m.at[1] - 1.1 * u, m.n, u, "p2-mass-t", "middle", 3.2) + '</g>' +
          (on && act.length < 4 ? K.geoArrow([[m.at[0], m.at[1]], [lerp(m.at[0], 127.5, .55), lerp(m.at[1], 36.8, .55) + (i === 0 ? 1.5 : -1.5)], [127.8, 36.6]], u, "p2-msn am-ar c" + m.cell, 1.1, true) : "");
      }).join("") + '<circle class="am-kr" cx="127.5" cy="-36.5" r="' + (1.4 * u) + '"/>';
    }
    return {
      html: K.seg("season", SEASON.map(function (x) { return x.n; }), 0) +
        '<div class="p2-duo wide"><div class="p2-mapbox muted" data-map="am"></div><div class="p2-stack">' +
          '<div class="p2-amwrap">' + K.amTable(-1) + '</div>' +
          '<div class="p2-readout am-t">' + SEASON[0].t + '</div></div></div>' +
        K.cap("기단의 성질 = 발원지의 성질: 대륙 → 건조, 해양 → 습함 / 고위도 → 한랭, 저위도 → 온난"),
      init: function (fig) {
        let sel = -1, si = 0;
        const m = K.makeMap(fig.querySelector('[data-map="am"]'), { legend: false, info: false, view: [90, 64, 176, 0] },
          function (u) { return svg(u, sel, SEASON[si].act); });
        function redraw() { m.draw(function (u) { return svg(u, sel, SEASON[si].act); }); }
        K.bindSeg(fig, "season", function (i) { si = i; sel = -1; fig.querySelector(".am-t").innerHTML = SEASON[i].t; fig.querySelector(".p2-amwrap").innerHTML = K.amTable(-1); redraw(); });
        m.root.addEventListener("click", function (e) {
          const gm = e.target.closest(".p2-mass");
          if (!gm) return;
          e.stopPropagation();
          sel = +gm.getAttribute("data-mass");
          redraw();
          fig.querySelector(".p2-amwrap").innerHTML = K.amTable(K.MASSES[sel].cell);
          fig.querySelector(".am-t").innerHTML = "<b>" + K.MASSES[sel].n + "</b> — " + K.MASSES[sel].t;
        }, true);
        return flowDots(fig, ".p2-ov .am-ar .ga-l", { gap: function (sw) { return sw * 5; }, speed: function (sw) { return sw * 4; } });
      }
    };
  };

  /* 기단과 전선 ② 전선 — 두 기단이 다가와 만나고, 따뜻한 공기가 전선면을 타고 올라 구름·비 */
  P2F.amFront = function () {
    const g = 320;
    const s = K.svgOpen(600, 360, "두 기단이 만나 전선이 생기는 과정", "fr-svg") +
      '<rect class="p2-sky" x="0" y="0" width="600" height="' + g + '"/>' +
      '<rect class="p2-ground" x="0" y="' + g + '" width="600" height="40"/>' +
      '<g class="fr-box warm"><rect x="20" y="120" width="220" height="200" rx="18" fill="url(#p2g-warm)"/><text class="p2-lbl" x="130" y="215" text-anchor="middle">따뜻한 공기</text><text class="p2-lbl sm" x="130" y="243" text-anchor="middle">가벼움 · 습함</text></g>' +
      '<g class="fr-box cold"><rect x="360" y="120" width="220" height="200" rx="18" fill="url(#p2g-cold)"/><text class="p2-lbl" x="470" y="215" text-anchor="middle">찬 공기</text><text class="p2-lbl sm" x="470" y="243" text-anchor="middle">무거움</text></g>' +
      '<g class="fr-met">' +
        '<polygon points="0,' + g + ' 0,86 600,86 600,126 180,' + g + '" fill="url(#p2g-warm)" opacity=".9"/>' +
        '<polygon points="180,' + g + ' 600,126 600,' + g + '" fill="url(#p2g-cold)"/>' +
        '<line class="p2-frontl" x1="180" y1="' + g + '" x2="600" y2="126"/>' +
        '<text class="p2-lbl cold-t" x="500" y="292" text-anchor="middle">찬 공기</text><text class="p2-lbl warm-t" x="70" y="130">따뜻한 공기</text>' +
        '<text class="p2-lbl sm" x="505" y="176" text-anchor="middle">전선면</text><text class="p2-lbl" x="180" y="' + (g + 30) + '" text-anchor="middle">전선</text>' +
      '</g>' +
      '<g class="fr-rise">' + K.ar(70, 296, 380, 190, "p2-arrow warm up", 6) + '<path class="fr-path" d="M70 296 L380 190"/><g class="fr-parcel"><circle r="15"/></g></g>' +
      '<g class="fr-cloud">' + K.cloud(400, 146, 1.2, "p2-cloud dark") + K.cloud(470, 132, .9, "p2-cloud dark") + '</g>' +
      '<g class="fr-rain">' + K.rain(355, 168, 150, 110, 9) + '</g>' +
    '</svg>';
    return {
      html: '<div class="p2-ctl fr-ctl"></div><div class="p2-figwrap p2-scene fr" data-st="4">' + s + '</div>' +
        K.cap("찬 공기는 무거워 아래로, 따뜻한 공기는 전선면을 따라 위로 → 식어서 구름·비 (전선성 강수)"),
      init: function (fig) {
        const sc = fig.querySelector(".fr"), path = sc.querySelector(".fr-path"), pc = sc.querySelector(".fr-parcel"), len = path.getTotalLength();
        const stop = loop(sc, function (t) {
          const k = (t % 3) / 3, pt = path.getPointAtLength(k * len);
          pc.setAttribute("transform", "translate(" + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ")");
          pc.querySelector("circle").setAttribute("fill", tColor(24 - k * 16));
        });
        const pl = K.player(fig, ".fr-ctl", ["두 기단", "다가감", "만남 — 전선", "따뜻한 공기 상승", "구름 · 비"], function (k) { sc.setAttribute("data-st", k); }, { interval: 1800, start: 4 });
        return function () { stop(); pl.pause(); };
      }
    };
  };
})();
