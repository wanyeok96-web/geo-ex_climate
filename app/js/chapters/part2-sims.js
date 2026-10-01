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
          '<label class="hs-auto"><input type="checkbox" checked> 자동 전환</label>' + K.seg("spd", ["속도 ×½", "×1", "×2"], 1) + '</div>' +
        '<div class="p2-row hs-read"></div>' +
        '<div class="p2-figwrap">' + s + '</div>' +
        K.cap("같은 햇빛을 받아도 육지는 빨리 데워지고 빨리 식음, 바다는 천천히 — 바다의 <b>비열</b>이 크기 때문 (예시 모형)"),
      init: function (fig) {
        const svg = fig.querySelector(".hs-svg");
        let land = 15, sea = 15, sun = true, run = true, hist = [], tick = 0, acc = 0, spd = 1;
        K.bindSeg(fig, "spd", function (i) { spd = [0.5, 1, 2][i]; });
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
          acc += dt * spd;
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
          '<button type="button" class="anim-btn tsh-play on">⏸ 멈춤</button>' + K.seg("spd", ["×½", "×1", "×2"], 1) + '</div>' +
        '<div class="p2-row tsh-read"></div>' +
        '<div class="p2-figwrap p2-scene">' + scene(false) + '</div>' +
        K.cap("예시 모형 — 올라갈 때: 구름 전 100m마다 약 1℃, 구름 속 약 0.5℃ 하강 / 내려갈 때: 100m마다 약 1℃ 상승 → 산을 넘은 바람은 <b>고온 건조</b> — 푄 (높새바람)"),
      init: function (fig) {
        const sc = fig.querySelector(".p2-scene"), inp = fig.querySelector("#p2-tsh");
        let k = 0, run = !REDUCED, path = null, len = 0, east = false, spd = 1;
        K.bindSeg(fig, "spd", function (i) { spd = [0.5, 1, 2][i]; });
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
        return loop(sc, function (t, dt) { if (run) set((k + dt / 9 * spd) % 1); });
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

  /* ==========================================================
     2차 시뮬레이터 (선생님 요청 — 시뮬레이션 기능 업그레이드, 2026-09-30)
     ========================================================== */
  const ALL = CITIES.filter(function (c) { return c.type !== "H" && c.lat > -60; });     // 고산 도시 · 남극 기지 제외
  const ZC = function (c) { return ZONES[c.type.charAt(0)] ? ZONES[c.type.charAt(0)].color : "#8a8f98"; };
  const range = function (c) { return U.maxOf(c.t) - U.minOf(c.t); };

  /* 산점도 틀: 축 · 눈금 → { svg 문자열 앞부분, x(), y() } */
  function scatterFrame(o) {
    const W = o.W || 600, H = o.H || 360, L = 58, R = 18, T = 34, B = 46;
    const x = function (v) { return L + (v - o.x0) / (o.x1 - o.x0) * (W - L - R); };
    const y = function (v) { return T + (o.y1 - v) / (o.y1 - o.y0) * (H - T - B); };
    let s = K.svgOpen(W, H, o.label, "sc-svg " + (o.cls || ""));
    for (let v = o.y0; v <= o.y1; v += o.ys) s += '<line class="p2-grid' + (v === 0 ? " zero" : "") + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="p2-ax" x="' + (L - 8) + '" y="' + (y(v) + 5) + '" text-anchor="end">' + (v < 0 ? "−" + -v : v) + '</text>';
    for (let v = o.x0; v <= o.x1; v += o.xs) s += '<text class="p2-ax" x="' + x(v) + '" y="' + (H - B + 22) + '" text-anchor="middle">' + v + (o.xu || "") + '</text>';
    s += '<text class="p2-unit" x="' + (L - 50) + '" y="' + (T - 16) + '" text-anchor="start">' + o.yu + '</text>' +
      '<text class="p2-unit" x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end">' + o.xl + '</text>' +
      '<line class="p2-base" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/>';
    return { s: s, x: x, y: y, W: W, H: H, L: L, R: R, T: T, B: B };
  }
  /* 최소 제곱 직선 */
  function fit(pts) {
    const n = pts.length, mx = U.mean(pts.map(function (p) { return p[0]; })), my = U.mean(pts.map(function (p) { return p[1]; }));
    let a = 0, b = 0;
    pts.forEach(function (p) { a += (p[0] - mx) * (p[1] - my); b += (p[0] - mx) * (p[0] - mx); });
    const k = b ? a / b : 0;
    return { k: k, c: my - k * mx, n: n };
  }

  /* 기온 ③ 기온의 연교차 — 세계 도시 산점도(위도 ↔ 연교차) + 도시 고르기 */
  P2F.tRange = function () {
    const PRE = [C("Singapore"), C("Seoul"), C("Ulaanbaatar")];
    const F = scatterFrame({ label: "위도와 기온의 연교차", x0: 0, x1: 90, xs: 15, xu: "°", y0: 0, y1: 45, ys: 15, yu: "연교차(℃)", xl: "위도(남·북 구분 없이)", cls: "tr-sc", W: 560, H: 430 });
    const pts = ALL.map(function (c) { return [Math.abs(c.lat), range(c)]; }), L1 = fit(pts);
    let s = F.s + '<line class="tr-fit" x1="' + F.x(0) + '" y1="' + F.y(L1.c) + '" x2="' + F.x(80) + '" y2="' + F.y(L1.c + L1.k * 80) + '"/>';
    s += ALL.map(function (c) {
      return '<circle class="tr-dot" data-id="' + c.id + '" cx="' + F.x(Math.abs(c.lat)).toFixed(1) + '" cy="' + F.y(range(c)).toFixed(1) + '" r="6" style="fill:' + ZC(c) + '"><title>' + escHtml(c.kr) + '</title></circle>';
    }).join("") + '<g class="tr-sel"><circle r="12"/><text y="-18" text-anchor="middle"></text></g></svg>';
    const opts = CITIES.slice().filter(function (c) { return c.type !== "H"; }).sort(function (a, b) { return a.kr.localeCompare(b.kr, "ko"); })
      .map(function (c) { return '<option value="' + c.id + '">' + escHtml(c.kr) + '</option>'; }).join("");
    function body(c) {
      const mx = U.maxOf(c.t), mn = U.minOf(c.t);
      return '<div class="p2-row">' +
          K.big("최난월", U.deg(mx), K.MON[c.t.indexOf(mx)], "warm") + K.big("최한월", U.deg(mn), K.MON[c.t.indexOf(mn)], "cold") +
          K.big("기온의 연교차", U.n1(mx - mn) + "℃", escHtml(c.kr) + " " + U.latTxt(c), "key") + '</div>';
    }
    return {
      html: '<div class="p2-ctl tr-ctl">' + K.seg("city", PRE.map(function (c) { return escHtml(c.kr) + " <small>" + U.latTxt(c) + "</small>"; }), 1) +
          '<label class="tr-pick">다른 도시 <select>' + opts + '</select></label></div>' +
        '<div class="tr-read">' + body(PRE[1]) + '</div>' +
        '<div class="tr-two"><div class="p2-figwrap tr-a">' + s + '</div><div class="p2-figwrap tr-b"></div></div>' +
        K.cap("점 하나 = 도시 하나(색 = 기후대) · 점을 누르면 그 도시 · 점선 = 전체 경향: 위도가 높을수록 연교차가 커짐, 같은 위도라도 대륙 내부는 더 큼"),
      init: function (fig) {
        const svg = fig.querySelector(".tr-sc"), sel = fig.querySelector(".tr-pick select");
        function show(c) {
          fig.querySelector(".tr-read").innerHTML = body(c);
          fig.querySelector(".tr-b").innerHTML = K.chart({ cities: [c], show: "t", range: true, label: c.kr + " 월평균 기온" });
          const g = svg.querySelector(".tr-sel");
          g.setAttribute("transform", "translate(" + F.x(Math.abs(c.lat)).toFixed(1) + " " + F.y(range(c)).toFixed(1) + ")");
          g.querySelector("text").textContent = c.kr;
          svg.querySelectorAll(".tr-dot").forEach(function (d) { d.classList.toggle("on", d.getAttribute("data-id") === c.id); });
          sel.value = c.id;
        }
        K.bindSeg(fig, "city", function (i) { show(PRE[i]); });
        sel.addEventListener("change", function () { fig.querySelectorAll('[data-seg="city"] .p2-sb').forEach(function (b) { b.classList.remove("on"); }); show(C(sel.value)); });
        svg.addEventListener("click", function (e) {
          const d = e.target.closest(".tr-dot");
          if (!d) return;
          fig.querySelectorAll('[data-seg="city"] .p2-sb').forEach(function (b) { b.classList.remove("on"); });
          show(C(d.getAttribute("data-id")));
        });
        show(PRE[1]);
      }
    };
  };

  /* 강수 ① 의미 — 우량계 시뮬레이터: 비 세기 · 눈 · 시간 · 강수량 */
  const RAINS = [
    { n: "🌦️ 약한 비", r: 2, drops: 10, v: 260 },
    { n: "🌧️ 보통 비", r: 8, drops: 26, v: 360 },
    { n: "⛈️ 강한 비", r: 30, drops: 60, v: 520 },
    { n: "❄️ 눈", r: 3, drops: 30, v: 70, snow: true }
  ];
  P2F.pMeasure = function () {
    const top = 120, bot = 320, mmMax = 50, pxPerMm = (bot - top) / mmMax;
    let ticks = "";
    for (let v = 0; v <= mmMax; v += 10) ticks += '<line class="tick" x1="352" x2="366" y1="' + (bot - v * pxPerMm) + '" y2="' + (bot - v * pxPerMm) + '"/><text class="p2-ax" x="372" y="' + (bot - v * pxPerMm + 5) + '">' + v + '</text>';
    const s = K.svgOpen(600, 360, "우량계로 강수량 재기", "pm-svg") +
      '<rect class="p2-sky pm-sky" x="0" y="0" width="600" height="330"/>' +
      '<g class="pm-fall"></g>' +
      '<g class="p2-gauge">' +
        '<polygon class="funnel" points="236,70 364,70 316,112 284,112"/>' +
        '<rect class="tube" x="250" y="' + top + '" width="100" height="' + (bot - top) + '" rx="6"/>' +
        '<rect class="water" x="252" y="' + bot + '" width="96" height="0" rx="4"/>' + ticks +
        '<text class="p2-unit" x="372" y="' + (top - 10) + '">mm</text>' +
      '</g>' +
      '<rect class="pm-snowbed" x="430" y="316" width="140" height="0" rx="4"/>' +
      '<text class="p2-lbl sm pm-snowt" x="500" y="344" text-anchor="middle"></text>' +
      '<rect class="p2-grass" x="0" y="330" width="600" height="30"/>' +
      '<text class="pm-clock" x="24" y="40">0:00</text>' +
    '</svg>';
    return {
      html: '<div class="p2-ctl pm-ctl">' + K.seg("rain", RAINS.map(function (x) { return x.n; }), 1) +
          '<button type="button" class="anim-btn pm-play">▶ 내리기</button><button type="button" class="anim-btn anim-reset pm-reset" aria-label="비우기">↻ 비우기</button></div>' +
        '<div class="p2-row pm-read"></div>' +
        '<div class="p2-figwrap">' + s + K.photo("rain-gauge", "tr") + '</div>' +
        K.cap("강수량 = 떨어진 물이 흘러가지 않고 고인 깊이(mm) · 눈은 녹여서 잼 — 눈 약 1cm ≈ 물 1mm (예시 모형: 1초 = 10분)"),
      init: function (fig) {
        const svg = fig.querySelector(".pm-svg"), fall = svg.querySelector(".pm-fall"), w = svg.querySelector(".water");
        let kind = 1, run = false, mm = 0, snowCm = 0, minutes = 0, parts = [];
        function setBtn() { const b = fig.querySelector(".pm-play"); b.classList.toggle("on", run); b.textContent = run ? "⏸ 멈춤" : "▶ 내리기"; }
        function paint() {
          const R = RAINS[kind];
          w.setAttribute("y", (bot - Math.min(mm, mmMax) * pxPerMm).toFixed(1));
          w.setAttribute("height", (Math.min(mm, mmMax) * pxPerMm).toFixed(1));
          svg.querySelector(".pm-snowbed").setAttribute("y", (316 - snowCm * 3).toFixed(1));
          svg.querySelector(".pm-snowbed").setAttribute("height", (snowCm * 3).toFixed(1));
          svg.querySelector(".pm-snowt").textContent = snowCm > 0.05 ? "쌓인 눈 " + snowCm.toFixed(1) + "cm" : "";
          const hh = Math.floor(minutes / 60), m2 = Math.floor(minutes % 60);
          svg.querySelector(".pm-clock").textContent = hh + ":" + (m2 < 10 ? "0" : "") + m2;
          fig.querySelector(".pm-read").innerHTML = K.big("강수 세기", R.r + "mm/시간", R.snow ? "눈 " + R.r + "cm/시간 ≈ 물 " + R.r + "mm" : R.n.replace(/^\S+ /, ""), "rain") +
            K.big("지난 시간", hh + "시간 " + m2 + "분", "1초 = 10분") + K.big("강수량", (Math.round(mm * 10) / 10).toFixed(1) + "mm", mm >= mmMax ? "눈금 끝 — 비우기" : "우량계 눈금", "key");
        }
        function makeParts() {
          const R = RAINS[kind];
          fall.innerHTML = ""; parts = [];
          for (let i = 0; i < R.drops; i++) {
            const e = R.snow ? el("circle", { r: "4", class: "pm-flake" }) : el("line", { class: "pm-drop", x1: 0, y1: 0, x2: -3, y2: 14 });
            fall.appendChild(e);
            parts.push({ e: e, x: 20 + Math.random() * 560, y: Math.random() * 330, v: R.v * (0.8 + Math.random() * 0.4), s: Math.random() * 6 });
          }
        }
        K.bindSeg(fig, "rain", function (i) { kind = i; makeParts(); paint(); });
        fig.querySelector(".pm-play").addEventListener("click", function () { run = !run; setBtn(); });
        fig.querySelector(".pm-reset").addEventListener("click", function () { mm = 0; snowCm = 0; minutes = 0; paint(); });
        makeParts(); setBtn(); paint();
        return loop(svg, function (t, dt) {
          const R = RAINS[kind];
          fall.style.opacity = run ? 1 : 0.15;
          parts.forEach(function (p) {
            if (run) { p.y += p.v * dt; if (R.snow) p.x += Math.sin(t * 2 + p.s) * 0.6; }
            if (p.y > 330) { p.y = -10; p.x = 20 + Math.random() * 560; }
            p.e.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ")");
          });
          if (!run || mm >= mmMax) return;
          const dm = dt * 10;                         // 1초 = 10분
          minutes += dm;
          if (R.snow) { snowCm += R.r * dm / 60; mm += R.r * dm / 60; } else mm += R.r * dm / 60;
          paint();
        });
      }
    };
  };

  /* 바람 ① 기압과 바람 — 두 지점의 기압을 바꾸면 바람의 방향 · 세기가 바뀜 */
  P2F.wPressure = function () {
    const s = K.svgOpen(600, 360, "기압 차와 바람", "wp-svg") +
      '<rect class="p2-sky" x="0" y="0" width="600" height="320"/><rect class="p2-ground" x="0" y="320" width="600" height="40"/>' +
      [["a", 40], ["b", 410]].map(function (x) {
        let dots = "";
        for (let i = 0; i < 40; i++) dots += '<circle data-i="' + i + '" cx="' + (x[1] + 16 + (i * 37) % 118) + '" cy="' + (70 + (i * 53) % 230) + '" r="5"/>';
        return '<g class="wp-col ' + x[0] + '"><rect class="wp-box" x="' + x[1] + '" y="50" width="150" height="270" rx="12"/><g class="wp-dots">' + dots + '</g>' +
          '<text class="p2-hl wp-hl" x="' + (x[1] + 75) + '" y="200" text-anchor="middle"></text><text class="p2-lbl sm wp-hp" x="' + (x[1] + 75) + '" y="250" text-anchor="middle"></text></g>';
      }).join("") +
      '<g class="wp-arrow"></g><g class="wp-parts"></g><text class="p2-lbl wp-t" x="300" y="270" text-anchor="middle"></text>' +
    '</svg>';
    return {
      html: '<div class="wp-sliders">' +
          '<div class="p2-slider"><label for="p2-pa">왼쪽 기압</label><input type="range" id="p2-pa" data-k="a" min="990" max="1034" step="1" value="1016"><span class="p2-sl-v wp-va"></span></div>' +
          '<div class="p2-slider"><label for="p2-pb">오른쪽 기압</label><input type="range" id="p2-pb" data-k="b" min="990" max="1034" step="1" value="1004"><span class="p2-sl-v wp-vb"></span></div>' +
        '</div>' +
        '<div class="p2-row wp-read"></div>' +
        '<div class="p2-figwrap">' + s + '</div>' + K.cap("공기가 많이 쌓인 곳 = 고기압 → 공기가 적은 저기압 쪽으로 이동 = 바람 · 기압 차가 클수록 강함 (풍속은 예시 값)"),
      init: function (fig) {
        const svg = fig.querySelector(".wp-svg");
        let pa = 1016, pb = 1004, parts = [];
        function set() {
          const d = pa - pb, ad = Math.abs(d), dir = d > 0 ? 1 : d < 0 ? -1 : 0;
          fig.querySelector(".wp-va").textContent = pa + "hPa"; fig.querySelector(".wp-vb").textContent = pb + "hPa";
          [["a", pa], ["b", pb]].forEach(function (x) {
            const g = svg.querySelector(".wp-col." + x[0]), n = Math.round(8 + (x[1] - 990) / 44 * 32), hi = x[1] > (x[0] === "a" ? pb : pa), lo = x[1] < (x[0] === "a" ? pb : pa);
            g.querySelectorAll(".wp-dots circle").forEach(function (c, i) { c.style.opacity = i < n ? 1 : 0; });
            g.classList.toggle("high", hi); g.classList.toggle("low", lo);
            g.querySelector(".wp-hl").textContent = hi ? "고" : lo ? "저" : "=";
            g.querySelector(".wp-hp").textContent = x[1] + "hPa";
          });
          const v = ad * 0.6;
          svg.querySelector(".wp-arrow").innerHTML = dir ? K.ar(dir > 0 ? 200 : 400, 292, dir > 0 ? 400 : 200, 292, "p2-arrow wind", 4 + Math.min(18, ad * 0.7)) : "";
          svg.querySelector(".wp-t").textContent = dir ? "바람 " + (dir > 0 ? "→" : "←") + " 약 " + v.toFixed(1) + "m/s" : "기압이 같음 → 바람 없음";
          fig.querySelector(".wp-read").innerHTML = K.big("기압 차", ad + "hPa", "", "key") +
            K.big("바람 방향", dir ? (dir > 0 ? "왼쪽 → 오른쪽" : "오른쪽 → 왼쪽") : "없음", "고기압 → 저기압") +
            K.big("바람 세기(예시)", v.toFixed(1) + "m/s", ad >= 20 ? "강함" : ad >= 8 ? "보통" : ad > 0 ? "약함" : "고요", "rain");
          const want = Math.min(24, Math.round(ad * 0.9));
          const box = svg.querySelector(".wp-parts");
          while (parts.length < want) { const c = el("circle", { r: "5" }); box.appendChild(c); parts.push({ e: c, x: 200 + Math.random() * 200, y: 268 + Math.random() * 44 }); }
          while (parts.length > want) { const p = parts.pop(); p.e.remove(); }
          svg.dataset.dir = dir; svg.dataset.sp = v;
        }
        fig.querySelectorAll(".wp-sliders input").forEach(function (inp) {
          inp.addEventListener("input", function () { if (inp.dataset.k === "a") pa = +inp.value; else pb = +inp.value; set(); });
        });
        set();
        return loop(svg, function (t, dt) {
          const dir = +svg.dataset.dir, sp = +svg.dataset.sp;
          parts.forEach(function (p) {
            p.x += dir * (40 + sp * 14) * dt;
            if (p.x > 400) p.x = 200; if (p.x < 200) p.x = 400;
            p.e.setAttribute("cx", p.x.toFixed(1)); p.e.setAttribute("cy", p.y.toFixed(1));
            p.e.setAttribute("opacity", Math.min(1, (p.x - 200) / 30, (400 - p.x) / 30).toFixed(2));
          });
        });
      }
    };
  };

  /* 위도 ② 위도별 기온 — 위도대 탐색기: 지도 띠 + 위도–연평균 기온 산점도 */
  P2F.latTemp = function () {
    const F = scatterFrame({ label: "위도와 연평균 기온", x0: 0, x1: 90, xs: 15, xu: "°", y0: -30, y1: 30, ys: 10, yu: "연평균(℃)", xl: "위도", cls: "lt-sc", W: 560, H: 430 });
    const pts = ALL.map(function (c) { return [Math.abs(c.lat), U.mean(c.t)]; }), L1 = fit(pts);
    const s = F.s + '<rect class="lt-band" x="0" y="' + F.T + '" width="0" height="' + (F.H - F.T - F.B) + '"/>' +
      '<line class="tr-fit" x1="' + F.x(0) + '" y1="' + F.y(L1.c) + '" x2="' + F.x(90) + '" y2="' + F.y(L1.c + L1.k * 90) + '"/>' +
      ALL.map(function (c) { return '<circle class="lt-dot" data-id="' + c.id + '" data-lat="' + Math.abs(c.lat).toFixed(2) + '" cx="' + F.x(Math.abs(c.lat)).toFixed(1) + '" cy="' + F.y(U.mean(c.t)).toFixed(1) + '" r="6" style="fill:' + ZC(c) + '"><title>' + escHtml(c.kr) + '</title></circle>'; }).join("") + '</svg>';
    return {
      html: '<div class="p2-slider"><label for="p2-lt">위도대</label><input type="range" id="p2-lt" min="0" max="80" step="1" value="0"><span class="p2-sl-v"></span></div>' +
        '<div class="p2-ctl lt-ctl"></div>' +
        '<div class="p2-row lt-read"></div>' +
        '<div class="tr-two"><div class="p2-mapbox lt-map" data-map="lat"></div><div class="p2-figwrap">' + s + '</div></div>' +
        K.cap("위도대(±5°) 안의 도시만 밝게 · 점선 = 전체 경향 — 위도 10°마다 연평균 기온 약 " + Math.abs(L1.k * 10).toFixed(1) + "℃씩 낮아짐 (고산 도시 · 남극 기지 제외)"),
      init: function (fig) {
        const inp = fig.querySelector("input"), svg = fig.querySelector(".lt-sc");
        let cur = 0, stop = function () {};
        const m = K.makeMap(fig.querySelector('[data-map="lat"]'), { legend: false, info: false, latLines: true, view: [-180, 80, 180, -60] }, function (u) { return band(u); });
        function band(u) {
          return [1, -1].map(function (sg) {
            const a = sg * cur;
            return '<rect class="lt-mband" x="-180" y="' + (-(a + 5)) + '" width="360" height="10"/>';
          }).join("") + '<text class="lt-mt" x="-176" y="' + (-(cur + 6)) + '" font-size="' + (3.6 * u).toFixed(2) + '">' + cur + '°N</text>';
        }
        function set(v) {
          cur = v; inp.value = v;
          fig.querySelector(".p2-sl-v").textContent = Math.round(v) + "° (±5°)";
          const inBand = ALL.filter(function (c) { return Math.abs(Math.abs(c.lat) - v) <= 5; });
          svg.querySelectorAll(".lt-dot").forEach(function (d) { d.classList.toggle("dim", Math.abs(+d.dataset.lat - v) > 5); });
          const b = svg.querySelector(".lt-band");
          b.setAttribute("x", F.x(Math.max(0, v - 5)).toFixed(1)); b.setAttribute("width", (F.x(Math.min(90, v + 5)) - F.x(Math.max(0, v - 5))).toFixed(1));
          m.draw(band);
          const avg = inBand.length ? U.mean(inBand.map(function (c) { return U.mean(c.t); })) : null;
          const names = inBand.slice().sort(function (a, c) { return Math.abs(a.lat) - Math.abs(c.lat); }).slice(0, 4).map(function (c) { return c.kr; }).join(" · ");
          fig.querySelector(".lt-read").innerHTML = K.big("위도대", Math.round(v) + "° ± 5°", "남·북반구 함께") +
            K.big("평균 연평균 기온", avg === null ? "—" : U.deg(avg), inBand.length + "개 도시", avg === null ? "" : avg < 5 ? "cold" : "warm") +
            K.big("이 위도대 도시", names || "없음", "", "key");
        }
        inp.addEventListener("input", function () { stop(); pl.pause(); set(+inp.value); });
        const LV = [0, 20, 40, 60, 75];
        const pl = K.player(fig, ".lt-ctl", ["적도 0°", "20°", "40°", "60°", "75°"], function (k) {
          stop(); stop = K.tween(cur, LV[k], 1000, function (v) { set(Math.round(v)); });
        }, { interval: 2200 });
        svg.addEventListener("click", function (e) { const d = e.target.closest(".lt-dot"); if (d) { stop(); pl.pause(); set(Math.round(+d.dataset.lat)); } });
        return function () { stop(); pl.pause(); };
      }
    };
  };

  /* 계절풍 ② 영향 — 달마다 재생: 바람 방향 · 강수 막대 */
  const MON_WIND = [0, 0, 0, 2, 1, 1, 1, 1, 1, 2, 0, 0];      // 0 겨울 계절풍 · 1 여름 계절풍 · 2 바뀌는 시기
  P2F.monEffect = function () {
    const list = [C("Seoul"), C("Mumbai")];
    return {
      html: '<div class="p2-ctl me-ctl">' + K.seg("city", ["서울", "뭄바이"], 0) + '</div><div class="p2-ctl me-play"></div>' +
        '<div class="p2-readout me-t"></div>' +
        '<div class="tr-two"><div class="p2-mapbox muted" data-map="me"></div><div class="p2-figwrap me-c"></div></div>' +
        K.cap("여름 계절풍(바다 → 대륙) 시기에 강수 집중, 겨울 계절풍(대륙 → 바다) 시기에는 건조"),
      init: function (fig) {
        let ci = 0, mon = 6;
        const m = K.makeMap(fig.querySelector('[data-map="me"]'), { legend: false, info: false, view: [55, 60, 170, -8],
          cities: [{ id: "Seoul", emph: true }, { id: "Mumbai", emph: true }] }, function (u) { return K.monsoonSvg(u, false); });
        function show() {
          const c = list[ci], w = MON_WIND[mon];
          m.draw(function (u) { return w === 2 ? "" : K.monsoonSvg(u, w === 0); });
          fig.querySelector(".me-c").innerHTML = K.chart({ cities: [c], show: "p", mark: [mon], label: c.kr + " 월 강수량" });
          fig.querySelector(".me-t").innerHTML = "<b>" + (mon + 1) + "월</b> · " + (w === 1 ? "여름 계절풍 — 바다 → 대륙, 습함" : w === 0 ? "겨울 계절풍 — 대륙 → 바다, 건조" : "계절풍이 바뀌는 시기") +
            " → " + escHtml(c.kr) + " 강수량 <b>" + U.n0(c.p[mon]) + "mm</b> (연강수량의 " + U.pct(c.p[mon], U.sum(c.p)) + "%)";
        }
        K.bindSeg(fig, "city", function (i) { ci = i; show(); });
        const pl = K.player(fig, ".me-play", K.MON, function (k) { mon = k; show(); }, { interval: 1300, loop: true, start: 6 });
        const stop = flowDots(fig, ".p2-ov .p2-msn .ga-l", { gap: function (sw) { return sw * 4.5; }, speed: function (sw) { return sw * 4; } });
        return function () { stop(); pl.pause(); };
      }
    };
  };

  /* ==========================================================
     3차 시뮬레이터 (2026-09-30) — 강수 계절 · 산곡풍 · 서→동 여행 · 서안/동안 쌍 · 에너지 수지 읽기
     ========================================================== */
  const SEASONS = [["봄", [2, 3, 4], "#58b07a"], ["여름", [5, 6, 7], "#e0483a"], ["가을", [8, 9, 10], "#e6a700"], ["겨울", [11, 0, 1], "#2b6fe3"]];
  function seasonOf(m, south) { const mm = south ? (m + 6) % 12 : m; for (let i = 0; i < 4; i++) if (SEASONS[i][1].indexOf(mm) >= 0) return i; return 0; }

  /* 강수 ③ 연강수량과 강수 계절 — 도시 고르기 · 계절 막대 · 계절 비율 원 · 유형 판정 */
  P2F.pSeason = function () {
    const PRE = [C("Singapore"), C("Seoul"), C("Rome")];
    const opts = CITIES.slice().sort(function (a, b) { return a.kr.localeCompare(b.kr, "ko"); }).map(function (c) { return '<option value="' + c.id + '">' + escHtml(c.kr) + '</option>'; }).join("");
    function share(c) {
      const south = c.lat < 0, tot = U.sum(c.p), s = [0, 0, 0, 0];
      c.p.forEach(function (v, m) { s[seasonOf(m, south)] += v; });
      return { s: s.map(function (v) { return v / tot; }), tot: tot, south: south };
    }
    function kind(sh) {
      if (sh.tot < 250) return ["연중 건조", "연강수량 250mm 미만 — 사막"];
      const su = sh.s[1], wi = sh.s[3];
      if (su >= wi * 2.5 && su >= 0.4) return ["여름 집중", "여름 " + Math.round(su * 100) + "% · 겨울 " + Math.round(wi * 100) + "% — 계절풍 · 우기"];
      if (wi >= su * 2.5) return ["여름 건조", "여름 " + Math.round(su * 100) + "% · 겨울 " + Math.round(wi * 100) + "% — 겨울에 비(지중해성)"];
      if (Math.max.apply(null, sh.s) < 0.33) return ["연중 고름", "어느 계절에나 비슷하게 내림"];
      const i = sh.s.indexOf(Math.max.apply(null, sh.s));
      return [SEASONS[i][0] + "에 많음", SEASONS[i][0] + " 강수 " + Math.round(sh.s[i] * 100) + "%"];
    }
    function bars(c, sh) {
      const W = 620, H = 330, L = 50, R = 16, T = 30, B = 42, cw = (W - L - R) / 12, mx = Math.max(100, Math.ceil(U.maxOf(c.p) / 100) * 100);
      const y = function (v) { return H - B - v / mx * (H - T - B); };
      let s = K.svgOpen(W, H, c.kr + " 월 강수량", "ps-svg");
      for (let v = 0; v <= mx; v += mx / 4) s += '<line class="p2-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="p2-ax" x="' + (L - 6) + '" y="' + (y(v) + 5) + '" text-anchor="end">' + Math.round(v) + '</text>';
      s += '<text class="p2-unit" x="' + (L - 6) + '" y="' + (T - 10) + '" text-anchor="end">mm</text>';
      c.p.forEach(function (v, m) {
        const si = seasonOf(m, sh.south), h = H - B - y(v);
        s += '<rect class="ps-bar" style="--i:' + m + ';fill:' + SEASONS[si][2] + '" x="' + (L + m * cw + cw * .14).toFixed(1) + '" y="' + y(v).toFixed(1) + '" width="' + (cw * .72).toFixed(1) + '" height="' + Math.max(1, h).toFixed(1) + '" rx="3"/>' +
          '<text class="p2-mon" x="' + (L + m * cw + cw / 2).toFixed(1) + '" y="' + (H - B + 22) + '" text-anchor="middle">' + (m + 1) + '</text>';
      });
      return s + '<line class="p2-base" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/></svg>';
    }
    function ring(sh) {
      const R = 92, r = 56, cx = 120, cy = 120;
      let a0 = -Math.PI / 2, s = '<svg class="p2-svg ps-ring" viewBox="0 0 240 240" role="img" aria-label="계절별 강수 비율">';
      sh.s.forEach(function (f, i) {
        const a1 = a0 + f * Math.PI * 2, big = f > .5 ? 1 : 0;
        const p = function (rr, a) { return (cx + rr * Math.cos(a)).toFixed(1) + " " + (cy + rr * Math.sin(a)).toFixed(1); };
        if (f > 0.002) s += '<path d="M' + p(R, a0) + ' A' + R + ' ' + R + ' 0 ' + big + ' 1 ' + p(R, a1) + ' L' + p(r, a1) + ' A' + r + ' ' + r + ' 0 ' + big + ' 0 ' + p(r, a0) + ' Z" fill="' + SEASONS[i][2] + '"/>';
        const am = (a0 + a1) / 2;
        if (f >= .08) s += '<text class="ps-rt" x="' + (cx + (R + r) / 2 * Math.cos(am)).toFixed(1) + '" y="' + (cy + (R + r) / 2 * Math.sin(am) + 5).toFixed(1) + '" text-anchor="middle">' + Math.round(f * 100) + '%</text>';
        a0 = a1;
      });
      return s + '<text class="ps-rc" x="120" y="116" text-anchor="middle">' + U.n0(sh.tot) + '</text><text class="ps-rs" x="120" y="138" text-anchor="middle">mm/년</text></svg>';
    }
    return {
      html: '<div class="p2-ctl">' + K.seg("city", ["싱가포르 <small>연중 고름</small>", "서울 <small>여름 집중</small>", "로마 <small>겨울 비</small>"], 1) +
          '<label class="tr-pick">다른 도시 <select>' + opts + '</select></label></div>' +
        '<div class="p2-row ps-read"></div>' +
        '<div class="tr-two ps-two"><div class="p2-figwrap ps-b"></div><div class="ps-side"><div class="ps-rw"></div>' +
          '<div class="ps-keys">' + SEASONS.map(function (x) { return '<span style="--sc:' + x[2] + '"><i></i>' + x[0] + '</span>'; }).join("") + '</div><p class="ps-note"></p></div></div>' +
        K.cap("막대 색 = 계절 · 원 = 계절별 강수 비율 — 연강수량이 같아도 <b>어느 계절에 내리는가</b>에 따라 기후가 다름"),
      init: function (fig) {
        const sel = fig.querySelector("select");
        function show(c) {
          const sh = share(c), kd = kind(sh);
          fig.querySelector(".ps-b").innerHTML = bars(c, sh);
          fig.querySelector(".ps-rw").innerHTML = ring(sh);
          fig.querySelector(".ps-note").innerHTML = sh.south ? "남반구 도시 — <b>12~2월이 여름</b>, 6~8월이 겨울" : "북반구 도시 — 6~8월 여름, 12~2월 겨울";
          fig.querySelector(".ps-read").innerHTML = K.big("연강수량", U.n0(sh.tot) + "mm", escHtml(c.kr) + " " + U.latTxt(c), "key") +
            K.big("여름 비율", Math.round(sh.s[1] * 100) + "%", "", "warm") + K.big("겨울 비율", Math.round(sh.s[3] * 100) + "%", "", "cold") + K.big("강수 유형", kd[0], kd[1], "rain");
          sel.value = c.id;
        }
        K.bindSeg(fig, "city", function (i) { show(PRE[i]); });
        sel.addEventListener("change", function () { fig.querySelectorAll('[data-seg="city"] .p2-sb').forEach(function (b) { b.classList.remove("on"); }); show(C(sel.value)); });
        show(PRE[1]);
      }
    };
  };

  /* 바람 ③ 여러 규모의 바람 — 해륙풍 + 산곡풍, 낮 ↔ 밤 */
  function valleyScene(night) {
    const g = 300;
    let s = K.svgOpen(600, 330, night ? "산곡풍 — 밤: 산바람" : "산곡풍 — 낮: 골바람", "vb-svg") +
      '<rect class="p2-sky' + (night ? " night" : "") + '" x="0" y="0" width="600" height="' + g + '"/>' +
      (night ? '<circle class="p2-moon" cx="520" cy="52" r="20"/>' : '<g class="ls-sunwrap"><circle cx="80" cy="56" r="40" fill="url(#p2g-glow)"/><circle cx="80" cy="56" r="20" fill="url(#p2g-sun)"/></g>') +
      '<polygon class="p2-mtn" points="0,90 90,70 300,' + (g - 10) + ' 510,70 600,90 600,' + (g + 30) + ' 0,' + (g + 30) + '"/>' +
      '<rect class="p2-grass" x="220" y="' + (g - 14) + '" width="160" height="44"/>';
    const up = [[270, g - 26, 110, 110], [330, g - 26, 490, 110]];
    up.forEach(function (p) {
      const a = night ? [p[2], p[3], p[0], p[1]] : p;
      s += '<path class="vb-flow" d="M' + a[0] + ' ' + a[1] + ' L' + a[2] + ' ' + a[3] + '" stroke-width="7"/>' + K.ar(a[0], a[1], a[2], a[3], "p2-arrow" + (night ? "" : " warm"), 6);
    });
    return s + '<text class="p2-lbl" x="300" y="' + (g - 40) + '" text-anchor="middle">골짜기</text>' +
      '<text class="p2-lbl" x="300" y="44" text-anchor="middle">' + (night ? "산바람 — 산 → 골짜기" : "골바람 — 골짜기 → 산") + '</text>' +
      '<text class="p2-lbl sm" x="300" y="70" text-anchor="middle">' + (night ? "산비탈이 빨리 식음 → 찬 공기가 비탈을 따라 내려옴" : "햇빛 받은 산비탈이 빨리 데워짐 → 공기가 비탈을 따라 올라감") + '</text></svg>';
  }
  P2F.wScale = function () {
    const f = origWScale();
    return {
      html: f.html.replace('<div class="p2-ctl day-ctl"></div>', K.seg("scale", ["🌊 해륙풍", "⛰️ 산곡풍"], 0) + '<div class="p2-ctl day-ctl"></div>'),
      init: function (fig) {
        const sc = fig.querySelector(".p2-scene");
        let kind = 0, night = false;
        function addLoop() {
          const svg = sc.querySelector("svg");
          if (kind || !svg || svg.querySelector(".sb-loop")) return;
          const nt = /밤/.test(svg.getAttribute("aria-label"));
          const d = nt ? "M140 225 L460 225 L490 205 L490 115 L460 95 L140 95 L110 115 L110 205 Z" : "M460 225 L140 225 L110 205 L110 115 L140 95 L460 95 L490 115 L490 205 Z";
          svg.insertBefore(el("path", { d: d, class: "sb-loop", "stroke-width": "6" }), svg.firstChild.nextSibling);
        }
        function draw() { sc.innerHTML = kind ? valleyScene(night) : K.seaBreeze(night); addLoop(); }
        const pl = K.player(fig, ".day-ctl", ["☀️ 낮", "🌙 밤"], function (i) { night = i === 1; draw(); }, { interval: 3200, loop: true });
        K.bindSeg(fig, "scale", function (i) { kind = i; draw(); });
        const stop = flowDots(sc, ".sb-loop, .vb-flow", { r: 5, gap: function () { return 50; }, speed: function () { return 110; } });
        return function () { stop(); pl.pause(); };
      }
    };
  };

  /* 수륙 분포 ② 대륙성 기후와 해양성 기후 — 50°N 부근 서쪽 해안 → 대륙 내부 → 동쪽 해안 여행 */
  const TRIP = ["Dublin", "London", "Berlin", "Moscow", "Ulaanbaatar", "Khabarovsk"];
  P2F.lsContinental = function () {
    const cs = TRIP.map(C), lo = -30, hi = 30;
    function chart(k) {
      const W = 900, H = 300, L = 50, R = 16, T = 20, cB = 150, bT = 196, bB = 270;
      const cw = (W - L - R) / 12, xm = function (m) { return L + m * cw + cw / 2; }, y = function (v) { return T + (hi - v) / (hi - lo) * (cB - T); };
      let s = K.svgOpen(W, H, "서쪽에서 동쪽으로 — 기온 변화", "trip-svg");
      for (let v = lo; v <= hi; v += 10) s += '<line class="p2-grid' + (v === 0 ? " zero" : "") + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="p2-ax" x="' + (L - 6) + '" y="' + (y(v) + 5) + '" text-anchor="end">' + v + '</text>';
      s += '<text class="p2-unit" x="' + (L - 6) + '" y="' + (T - 6) + '" text-anchor="end">℃</text>';
      for (let m = 0; m < 12; m += 1) s += '<text class="p2-mon" x="' + xm(m) + '" y="' + (cB + 18) + '" text-anchor="middle">' + (m + 1) + '</text>';
      cs.forEach(function (c, i) {
        if (i > k) return;
        s += '<polyline class="trip-l' + (i === k ? " now" : "") + '" style="--tc:' + tColor(40 - U.maxOf(c.t) + U.minOf(c.t) - 10) + '" points="' + c.t.map(function (v, m) { return xm(m) + "," + y(v).toFixed(1); }).join(" ") + '"/>';
      });
      const bw = (W - L - R) / cs.length, mx = 45;
      cs.forEach(function (c, i) {
        const rg = range(c), h = rg / mx * (bB - bT), x = L + i * bw + bw * .18;
        s += '<g class="trip-b' + (i > k ? " off" : i === k ? " now" : "") + '"><rect x="' + x.toFixed(1) + '" y="' + (bB - h).toFixed(1) + '" width="' + (bw * .64).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="5" style="fill:' + tColor(rg - 12) + '"/>' +
          '<text class="trip-bv" x="' + (x + bw * .32).toFixed(1) + '" y="' + (bB - h - 6).toFixed(1) + '" text-anchor="middle">' + U.n1(rg) + '</text>' +
          '<text class="trip-bn" x="' + (x + bw * .32).toFixed(1) + '" y="' + (bB + 16) + '" text-anchor="middle">' + escHtml(c.kr) + '</text></g>';
      });
      return s + '<text class="p2-lbl sm" x="' + L + '" y="' + (bT - 8) + '">기온의 연교차(℃)</text><line class="p2-base" x1="' + L + '" x2="' + (W - R) + '" y1="' + bB + '" y2="' + bB + '"/></svg>';
    }
    function route(u, k) {
      let s = '<polyline class="trip-route" points="' + cs.map(function (c) { return c.lon + "," + (-c.lat); }).join(" ") + '" stroke-width="' + (0.6 * u).toFixed(2) + '"/>';
      cs.forEach(function (c, i) {
        s += '<circle class="trip-pt' + (i === k ? " now" : i < k ? " done" : "") + '" cx="' + c.lon + '" cy="' + (-c.lat) + '" r="' + ((i === k ? 2.2 : 1.4) * u).toFixed(2) + '"/>' +
          (i === k ? K.geoText(c.lon, c.lat + 3.2 * u, escHtml(c.kr), u, "trip-t", "middle", 4) : "");
      });
      return s;
    }
    const why = ["대서양 바로 옆 — 편서풍이 바다 공기를 실어 옴 → 연교차 가장 작음", "바다와 가까움 — 겨울 온화", "바다에서 멀어짐 — 겨울이 추워지기 시작", "대륙 깊숙이 — 여름 덥고 겨울 매우 추움", "대륙 한가운데(고원) — 연교차 최대 수준, 강수도 적음", "대륙 동쪽 해안 — 바다 옆이지만 겨울에 대륙의 찬 바람(계절풍) → 연교차 큼"];
    return {
      html: '<div class="p2-ctl trip-ctl"></div><div class="p2-readout trip-t"></div>' +
        '<div class="tr-two rows"><div class="p2-mapbox muted" data-map="trip"></div><div class="p2-figwrap">' + chart(0) + '</div></div>' +
        K.cap("비슷한 위도(약 48°~55°N)를 서쪽 해안에서 동쪽으로 — 바다에서 멀수록 <b>대륙성</b>(연교차 큼), 바다 가까운 서안은 <b>해양성</b>(연교차 작음)"),
      init: function (fig) {
        let k = 0;
        const m = K.makeMap(fig.querySelector('[data-map="trip"]'), { legend: false, info: false, view: [-20, 68, 150, 30], latLines: true }, function (u) { return route(u, k); });
        const pl = K.player(fig, ".trip-ctl", cs.map(function (c) { return c.kr; }), function (i) {
          k = i;
          m.draw(function (u) { return route(u, k); });
          fig.querySelector(".tr-two .p2-figwrap").innerHTML = chart(k);
          const c = cs[i];
          fig.querySelector(".trip-t").innerHTML = "<b>" + escHtml(c.kr) + "</b> (" + U.latTxt(c) + ") · 1월 " + U.deg(c.t[0]) + " · 7월 " + U.deg(c.t[6]) + " · 연교차 <b>" + U.n1(range(c)) + "℃</b> — " + why[i];
        }, { interval: 2400 });
        return function () { pl.pause(); };
      }
    };
  };

  /* 수륙 분포 ③ 대륙 서안과 동안 — 같은 위도의 서안 · 동안 도시 쌍 + 편서풍 */
  const PAIRS = [["Lisbon", "Seoul", "유라시아"], ["London", "Khabarovsk", "유라시아"], ["San_Francisco", "New_York", "북아메리카"], ["Vancouver", "Quebec", "북아메리카"]];
  P2F.lsWestEast = function () {
    function over(u, i) {
      const a = C(PAIRS[i][0]), b = C(PAIRS[i][1]), lat = (a.lat + b.lat) / 2;
      let s = "";
      [[a.lon - 38, a.lon - 4], [a.lon + 6, a.lon + 40]].forEach(function (seg, j) {
        s += K.geoArrow([[seg[0], lat + 3], [(seg[0] + seg[1]) / 2, lat + 4], [seg[1], lat + 3]], u, "p2-msn we-ar" + (j ? " land" : ""), 1.6, true);
      });
      s += K.geoText(a.lon - 22, lat + 8, "편서풍", u, "we-t", "middle", 3.4);
      [[a, "서안"], [b, "동안"]].forEach(function (x) {
        s += '<circle class="we-pt ' + (x[1] === "서안" ? "w" : "e") + '" cx="' + x[0].lon + '" cy="' + (-x[0].lat) + '" r="' + (1.9 * u).toFixed(2) + '"/>' +
          K.geoText(x[0].lon, x[0].lat - 5, escHtml(x[0].kr) + " (" + x[1] + ")", u, "we-t2", "middle", 3.4);
      });
      return s;
    }
    function body(i) {
      const a = C(PAIRS[i][0]), b = C(PAIRS[i][1]);
      return '<div class="p2-row">' + K.big(escHtml(a.kr) + " <small>서안 · " + U.latTxt(a) + "</small>", U.n1(range(a)) + "℃", "연교차 · 1월 " + U.deg(a.t[0]), "c1") +
        K.big(escHtml(b.kr) + " <small>동안 · " + U.latTxt(b) + "</small>", U.n1(range(b)) + "℃", "연교차 · 1월 " + U.deg(b.t[0]), "c2") + '</div>';
    }
    return {
      html: K.seg("pair", PAIRS.map(function (p) { return escHtml(C(p[0]).kr) + " · " + escHtml(C(p[1]).kr); }), 0) + '<div class="we-read">' + body(0) + '</div>' +
        '<div class="tr-two rows"><div class="p2-mapbox muted" data-map="we"></div><div class="p2-figwrap we-c"></div></div>' +
        K.cap("중위도에서는 편서풍이 바다 → 대륙 서안으로 붊 → 서안은 겨울이 온화하고 연교차가 작음, 동안은 대륙을 지나온 바람의 영향으로 연교차가 큼"),
      init: function (fig) {
        let i = 0;
        const m = K.makeMap(fig.querySelector('[data-map="we"]'), { legend: false, info: false, view: [-180, 75, 180, 10], latLines: true }, function (u) { return over(u, i); });
        function show(k) {
          i = k;
          const a = C(PAIRS[k][0]), b = C(PAIRS[k][1]);
          const lat = (a.lat + b.lat) / 2;
          m.draw(function () { return ""; });
          m.zoomTo([a.lon - 48, lat + 20, b.lon + 22, lat - 16], REDUCED ? 0 : 650);
          setTimeout(function () { if (i === k) m.draw(function (u) { return over(u, i); }); }, REDUCED ? 0 : 720);
          fig.querySelector(".we-read").innerHTML = body(k);
          fig.querySelector(".we-c").innerHTML = K.chart({ cities: [a, b], show: "t", range: true, label: a.kr + "와 " + b.kr + " 월평균 기온" });
        }
        K.bindSeg(fig, "pair", show);
        show(0);
        return flowDots(fig, ".p2-ov .we-ar .ga-l", { gap: function (sw) { return sw * 4.5; }, speed: function (sw) { return sw * 4; } });
      }
    };
  };

  /* 위도 ③ 에너지 과잉·부족 — 위도 막대로 흡수 · 방출 에너지 읽기 */
  const budgetWrap = P2F.latBudget;
  P2F.latBudget = function () {
    const f = budgetWrap();
    const W = 600, H = 330, L = 50, R = 20, T = 40, B = 46;
    const x = function (lat) { return L + (lat + 90) / 180 * (W - L - R); };
    const y = function (v) { return T + (340 - v) / 320 * (H - T - B); };
    const inc = function (lat) { const c = Math.cos(lat * Math.PI / 180); return 40 + 280 * c * c; };
    const out = function (lat) { const c = Math.cos(lat * Math.PI / 180); return 130 + 110 * c; };
    return {
      html: '<div class="p2-slider"><label for="p2-bud">위도</label><input type="range" id="p2-bud" min="-90" max="90" step="1" value="0"><span class="p2-sl-v"></span></div>' +
        '<div class="p2-row bud-read"></div>' + f.html,
      init: function (fig) {
        const svg = fig.querySelector(".p2-svg"), inp = fig.querySelector("#p2-bud");
        const g = el("g", { class: "bud-mk" });
        g.innerHTML = '<line class="bud-line" y1="' + T + '" y2="' + (H - B) + '"/><circle class="bud-in" r="7"/><circle class="bud-out" r="7"/><line class="bud-gap"/>';
        svg.appendChild(g);
        function set(lat) {
          const a = inc(lat), b = out(lat), d = a - b, X = x(lat);
          g.querySelector(".bud-line").setAttribute("x1", X); g.querySelector(".bud-line").setAttribute("x2", X);
          g.querySelector(".bud-in").setAttribute("cx", X); g.querySelector(".bud-in").setAttribute("cy", y(a));
          g.querySelector(".bud-out").setAttribute("cx", X); g.querySelector(".bud-out").setAttribute("cy", y(b));
          const gp = g.querySelector(".bud-gap");
          gp.setAttribute("x1", X); gp.setAttribute("x2", X); gp.setAttribute("y1", y(a)); gp.setAttribute("y2", y(b));
          gp.setAttribute("class", "bud-gap " + (d >= 0 ? "sur" : "def"));
          fig.querySelector(".p2-sl-v").textContent = lat === 0 ? "적도" : Math.abs(lat) + "°" + (lat > 0 ? "N" : "S");
          fig.querySelector(".bud-read").innerHTML = K.big("흡수하는 태양 에너지", Math.round(a), "상대값") + K.big("내보내는 에너지", Math.round(b), "상대값") +
            K.big(d >= 0 ? "에너지 과잉" : "에너지 부족", (d >= 0 ? "+" : "−") + Math.abs(Math.round(d)), d >= 0 ? "남는 열 → 고위도로 이동" : "모자란 열 → 저위도에서 받아옴", d >= 0 ? "warm" : "cold");
        }
        inp.addEventListener("input", function () { set(+inp.value); });
        set(0);
        return f.init ? f.init(fig) : null;
      }
    };
  };

  /* ==========================================================
     4차 시뮬레이터 (2026-09-30) — 바다 위 공기 덩어리 · 계절풍 만들기
     ========================================================== */
  /* 해류 ④ 바다 위 공기 — 난류 위(불안정: 상승 · 구름 · 비) vs 한류 위(안정: 안개 · 비 없음) */
  P2F.curAir = function () {
    function panel(k, x0) {
      const warm = k === "w";
      return '<g class="ca2 ' + k + '" transform="translate(' + x0 + ' 0)"><rect class="ca2-sky" x="4" y="4" width="312" height="236" rx="14"/>' +
        '<rect class="ca2-sea ' + k + '" x="4" y="240" width="' + (warm ? 312 : 200) + '" height="60"/>' +
        (warm ? "" : '<rect class="ca2-desert" x="204" y="232" width="112" height="68"/><text class="p2-lbl sm" x="260" y="290" text-anchor="middle">해안 사막</text>') +
        '<g class="ca2-waves">' + [30, 110, 190].map(function (x) { return '<path d="M' + x + ' 262 q12 -7 24 0 t24 0"/>'; }).join("") + '</g>' +
        '<text class="ca2-t" x="' + (warm ? 160 : 104) + '" y="286" text-anchor="middle">' + (warm ? "난류 · 바다 약 24℃" : "한류 · 바다 약 14℃") + '</text>' +
        (warm ? '<g class="ca2-cloud">' + K.cloud(160, 70, 1.2, "p2-cloud dark") + '</g><g class="ca2-rain">' + K.rain(120, 92, 90, 130, 8) + '</g>'
              : '<rect class="ca2-fog" x="4" y="170" width="200" height="70"/><text class="p2-lbl sm ca2-fogt" x="104" y="190" text-anchor="middle">안개 · 낮은 구름</text>') +
        '<text class="p2-lbl ca2-h" x="160" y="30" text-anchor="middle">' + (warm ? "따뜻한 바다 위 — 공기가 올라감" : "차가운 바다 위 — 공기가 눌러앉음") + '</text>' +
        (warm ? K.ar(292, 220, 292, 60, "p2-arrow warm", 5) : K.ar(20, 150, 180, 150, "p2-arrow faint", 4)) + '<g class="ca2-parts"></g></g>';
    }
    const s = '<svg class="p2-svg ca2-svg" viewBox="0 0 640 310" role="img" aria-label="난류 위와 한류 위의 공기">' + panel("w", 0) + panel("c", 320) + '</svg>';
    return {
      html: '<div class="p2-ctl ca2-ctl"><button type="button" class="anim-btn ca2-play on">⏸ 멈춤</button></div>' +
        '<div class="p2-row">' + K.big("난류 위의 공기", "불안정", "아래가 따뜻함 → 상승 → 구름 · 비", "warm") + K.big("한류 위의 공기", "안정", "아래가 차가움 → 상승 못 함 → 비 적음", "cold") + '</div>' +
        '<div class="p2-figwrap">' + s + '</div>' +
        K.cap("공기 알갱이의 움직임 (예시 모형) — 난류 연안: 따뜻하고 습함 · 한류 연안: 서늘하고 건조, 안개 잦음 (아타카마 · 나미브 사막)"),
      init: function (fig) {
        const svg = fig.querySelector(".ca2-svg");
        let run = true;
        const P = { w: [], c: [] };
        ["w", "c"].forEach(function (k) {
          const g = svg.querySelector(".ca2." + k + " .ca2-parts");
          for (let i = 0; i < 14; i++) {
            const c = el("circle", { r: "6" }); g.appendChild(c);
            P[k].push({ e: c, x: 20 + Math.random() * 280, y: 150 + Math.random() * 80, v: 20 + Math.random() * 30, ph: Math.random() * 6 });
          }
        });
        fig.querySelector(".ca2-play").addEventListener("click", function () { run = !run; this.classList.toggle("on", run); this.textContent = run ? "⏸ 멈춤" : "▶ 재생"; });
        return loop(svg, function (t, dt) {
          if (!run) return;
          P.w.forEach(function (p) {                        // 난류: 데워져 위로 올라가다 구름 높이에서 흩어짐
            p.y -= p.v * dt * 1.6; p.x += Math.sin(t * 2 + p.ph) * .4;
            if (p.y < 70) { p.y = 232; p.x = 20 + Math.random() * 280; }
            p.e.setAttribute("cx", p.x.toFixed(1)); p.e.setAttribute("cy", p.y.toFixed(1));
            p.e.setAttribute("fill", tColor(24 - (232 - p.y) / 12));
          });
          P.c.forEach(function (p) {                        // 한류: 아래에 머물며 옆으로만 흐름
            p.x += p.v * dt * .8; p.y = 216 + Math.sin(t + p.ph) * 14;
            if (p.x > 300) p.x = 10;
            p.e.setAttribute("cx", p.x.toFixed(1)); p.e.setAttribute("cy", p.y.toFixed(1));
            p.e.setAttribute("fill", tColor(15 + Math.sin(p.ph) * 2));
          });
        });
      }
    };
  };

  /* 계절풍 ③ 계절풍 만들기 — 대륙 · 바다 기온을 바꾸면 기압과 바람이 바뀜 */
  P2F.monMake = function () {
    const s = K.svgOpen(640, 330, "대륙과 바다의 기온과 계절풍", "mm-svg") +
      '<rect class="p2-sky" x="0" y="0" width="640" height="250"/>' +
      '<rect class="mm-land" x="0" y="250" width="320" height="80"/><rect class="p2-seab" x="320" y="250" width="320" height="80"/>' +
      '<text class="p2-lbl" x="160" y="300" text-anchor="middle">대륙</text><text class="p2-lbl" x="480" y="300" text-anchor="middle">바다</text>' +
      '<g class="mm-col l"><rect x="60" y="112" width="200" height="118" rx="16"/><text class="p2-hl" x="160" y="178" text-anchor="middle"></text><text class="p2-lbl sm mm-tt" x="160" y="214" text-anchor="middle"></text></g>' +
      '<g class="mm-col s"><rect x="380" y="112" width="200" height="118" rx="16"/><text class="p2-hl" x="480" y="178" text-anchor="middle"></text><text class="p2-lbl sm mm-tt" x="480" y="214" text-anchor="middle"></text></g>' +
      '<g class="mm-ar"></g><g class="mm-parts"></g><g class="mm-rain">' + K.cloud(160, 50, .8, "p2-cloud dark") + K.rain(122, 70, 76, 34, 6) + '</g>' +
      '<text class="p2-lbl mm-wt" x="420" y="40" text-anchor="middle"></text>' +
    '</svg>';
    return {
      html: '<div class="wp-sliders">' +
          '<div class="p2-slider"><label for="mm-l">대륙 기온</label><input type="range" id="mm-l" data-k="l" min="-25" max="40" step="1" value="32"><span class="p2-sl-v mm-vl"></span></div>' +
          '<div class="p2-slider"><label for="mm-s">바다 기온</label><input type="range" id="mm-s" data-k="s" min="0" max="30" step="1" value="25"><span class="p2-sl-v mm-vs"></span></div></div>' +
        '<div class="p2-ctl">' + K.seg("mpre", ["☀️ 여름 예시", "❄️ 겨울 예시"], 0) + '</div>' +
        '<div class="p2-row mm-read"></div>' +
        '<div class="p2-figwrap">' + s + '</div>' +
        K.cap("더 따뜻한 쪽 = 공기가 올라가 저기압, 더 차가운 쪽 = 공기가 내려와 고기압 → 바람은 고기압에서 저기압으로 (예시 모형)"),
      init: function (fig) {
        const svg = fig.querySelector(".mm-svg");
        let L = 32, S = 25, parts = [];
        const box = svg.querySelector(".mm-parts");
        function set() {
          fig.querySelector("#mm-l").value = L; fig.querySelector("#mm-s").value = S;
          const sg = function (v) { return (v < 0 ? "−" + -v : v) + "℃"; };
          fig.querySelector(".mm-vl").textContent = sg(L); fig.querySelector(".mm-vs").textContent = sg(S);
          const d = L - S, dir = d > 0.5 ? -1 : d < -0.5 ? 1 : 0;            // -1: 바다 → 대륙, +1: 대륙 → 바다
          [["l", L, d > 0.5], ["s", S, d < -0.5]].forEach(function (x) {
            const g = svg.querySelector(".mm-col." + x[0]), hot = x[2], cold = !hot && Math.abs(d) > 0.5;
            g.classList.toggle("low", hot); g.classList.toggle("high", cold);
            g.querySelector(".p2-hl").textContent = hot ? "저" : cold ? "고" : "=";
            g.querySelector(".mm-tt").textContent = sg(x[1]) + " · " + (hot ? "공기 상승" : cold ? "공기 하강" : "");
            g.querySelector("rect").style.fill = tColor(x[1]);
          });
          svg.querySelector(".mm-land").style.fill = tColor(L);
          svg.querySelector(".mm-ar").innerHTML = dir ? K.ar(dir < 0 ? 470 : 170, 236, dir < 0 ? 170 : 470, 236, "p2-arrow wind", 4 + Math.min(16, Math.abs(d) * .6)) : "";
          const wet = dir < 0;
          svg.querySelector(".mm-rain").style.opacity = wet && Math.abs(d) > 3 ? 1 : 0;
          svg.querySelector(".mm-wt").textContent = dir ? (wet ? "바다 → 대륙: 습한 바람 → 대륙에 비" : "대륙 → 바다: 차고 건조한 바람") : "기온이 같음 → 바람 약함";
          fig.querySelector(".mm-read").innerHTML = K.big("기온 차 (대륙 − 바다)", (d > 0 ? "+" : d < 0 ? "−" : "") + Math.abs(d) + "℃", "", "key") +
            K.big("바람 방향", dir ? (wet ? "바다 → 대륙" : "대륙 → 바다") : "거의 없음", dir ? (wet ? "여름 계절풍과 같은 방향" : "겨울 계절풍과 같은 방향") : "", wet ? "rain" : "cold") +
            K.big("바람의 성질", dir ? (wet ? "습함 · 비" : "건조 · 한랭") : "—", "");
          const want = Math.min(22, Math.round(Math.abs(d) * .8));
          while (parts.length < want) { const c = el("circle", { r: "5" }); box.appendChild(c); parts.push({ e: c, x: 170 + Math.random() * 300, y: 222 + Math.random() * 26 }); }
          while (parts.length > want) parts.pop().e.remove();
          svg.dataset.dir = dir; svg.dataset.sp = Math.abs(d);
        }
        fig.querySelectorAll(".wp-sliders input").forEach(function (inp) {
          inp.addEventListener("input", function () { if (inp.dataset.k === "l") L = +inp.value; else S = +inp.value; fig.querySelectorAll('[data-seg="mpre"] .p2-sb').forEach(function (b) { b.classList.remove("on"); }); set(); });
        });
        K.bindSeg(fig, "mpre", function (i) { if (i) { L = -15; S = 8; } else { L = 32; S = 25; } set(); });
        set();
        return loop(svg, function (t, dt) {
          const dir = +svg.dataset.dir, sp = +svg.dataset.sp;
          parts.forEach(function (p) {
            p.x += dir * (50 + sp * 5) * dt;
            if (p.x > 470) p.x = 170; if (p.x < 170) p.x = 470;
            p.e.setAttribute("cx", p.x.toFixed(1)); p.e.setAttribute("cy", p.y.toFixed(1));
            p.e.setAttribute("fill", dir < 0 ? "#7fb2e8" : "#d9c6a4");
          });
        });
      }
    };
  };
})();
