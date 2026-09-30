/* ============================================================
   지오엑스-세계의 기후 — chapters/part2-figs.js
   PART 2 시각 자료 — 노드 화면 오른쪽에 들어가는 그림·그래프·지도
   - 모두 코드로 그리는 SVG (더블클릭 실행 그대로), 수치는 앱 기후 자료(data/cities.js)에서 계산
   - 그림 하나 = function () → { html, init(그림 요소) → 정리 함수(선택) }
   ============================================================ */
"use strict";

const P2F = (function () {
  const C = function (id) { return CITY_BY_ID[id]; };
  const sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
  const mean = function (a) { return sum(a) / a.length; };
  const maxOf = function (a) { return Math.max.apply(null, a); };
  const minOf = function (a) { return Math.min.apply(null, a); };
  function n1(v) { const r = Math.round(v * 10) / 10; return (r < 0 ? "−" : "") + Math.abs(r).toFixed(1); }
  function deg(v) { return n1(v) + "℃"; }
  function n0(v) { return Math.round(v).toLocaleString("ko-KR"); }
  function pct(a, b) { return Math.round(a / b * 100); }
  function latTxt(c) { return n1(Math.abs(c.lat)) + "°" + (c.lat >= 0 ? "N" : "S"); }
  const MON = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

  /* ---------- 작은 부품 ---------- */
  function seg(name, items, on) {
    return '<div class="p2-seg" role="group" data-seg="' + name + '">' + items.map(function (it, i) {
      return '<button type="button" class="p2-sb' + (i === (on || 0) ? " on" : "") + '" data-i="' + i + '">' + it + '</button>';
    }).join("") + '</div>';
  }
  function bindSeg(el, name, fn) {
    const g = el.querySelector('[data-seg="' + name + '"]');
    if (!g) return;
    g.addEventListener("click", function (e) {
      const b = e.target.closest(".p2-sb");
      if (!b) return;
      g.querySelectorAll(".p2-sb").forEach(function (x) { x.classList.toggle("on", x === b); });
      fn(+b.getAttribute("data-i"));
    });
  }
  function big(label, value, sub, tone) {
    return '<div class="p2-big' + (tone ? " " + tone : "") + '"><span class="p2-big-l">' + label + '</span>' +
      '<span class="p2-big-v">' + value + '</span>' + (sub ? '<span class="p2-big-s">' + sub + '</span>' : "") + '</div>';
  }
  function cap(t) { return '<p class="p2-cap">' + fmtKo(t) + '</p>'; }
  function svgOpen(w, h, label, cls) {
    return '<svg class="p2-svg' + (cls ? " " + cls : "") + '" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + escHtml(label) + '">';
  }
  /* 화살표 = 선 + 머리 삼각형 (색은 CSS color → currentColor) */
  function ar(x1, y1, x2, y2, cls, w) {
    w = w || 4;
    const ang = Math.atan2(y2 - y1, x2 - x1), hl = Math.max(12, w * 2.6), hw = Math.max(8, w * 1.8);
    const bx = x2 - Math.cos(ang) * hl, by = y2 - Math.sin(ang) * hl;
    const px = -Math.sin(ang) * hw, py = Math.cos(ang) * hw;
    const f = function (v) { return v.toFixed(1); };
    return '<g class="' + (cls || "p2-arrow") + '"><line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(bx + Math.cos(ang) * 1) + '" y2="' + f(by + Math.sin(ang) * 1) + '" stroke-width="' + w + '"/>' +
      '<polygon points="' + f(x2) + "," + f(y2) + " " + f(bx + px) + "," + f(by + py) + " " + f(bx - px) + "," + f(by - py) + '"/></g>';
  }
  function cloud(x, y, s, cls) {
    s = s || 1;
    return '<g class="' + (cls || "p2-cloud") + '" transform="translate(' + x + " " + y + ") scale(" + s + ')">' +
      '<ellipse cx="0" cy="0" rx="46" ry="22"/><circle cx="-22" cy="-12" r="20"/><circle cx="10" cy="-20" r="25"/><circle cx="34" cy="-6" r="17"/></g>';
  }
  function rain(x, y, w, h, n) {
    let s = '<g class="p2-rain">';
    for (let i = 0; i < n; i++) {
      const xx = x + (i + 0.5) * w / n;
      s += '<line x1="' + xx + '" y1="' + y + '" x2="' + (xx - 6) + '" y2="' + (y + h) + '" style="animation-delay:' + (i % 4) * 0.18 + 's"/>';
    }
    return s + "</g>";
  }
  /* 사진 칸 (ui/photo.js) — 사진이 없으면 빈 문자열 / pos: tl·tr·bl·br (그림 모서리) */
  function photo(key, pos) { return Photo.html(key, { cls: "p2-ph " + (pos || "tr") }); }
  /* 단계 재생기 (ui/anim.js) — 그림 위 조절 줄에 붙임 */
  function player(el, sel, steps, onStep, o) {
    o = o || {};
    return Anim.player(el.querySelector(sel), { steps: steps, onStep: onStep, interval: o.interval || 2600, loop: !!o.loop, start: o.start || 0 });
  }
  /* 숫자 부드럽게 바꾸기 (from → to, ms) */
  function tween(from, to, ms, fn) {
    if (REDUCED || !ms) { fn(to); return function () {}; }
    const t0 = performance.now();
    let id = 0;
    (function step(now) {
      const k = Math.min(1, (now - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      fn(from + (to - from) * e);
      if (k < 1) id = requestAnimationFrame(step);
    })(t0);
    return function () { cancelAnimationFrame(id); };
  }
  function sun(x, y, r) {
    let s = '<g class="p2-sun"><circle cx="' + x + '" cy="' + y + '" r="' + r + '"/>';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      s += '<line x1="' + (x + Math.cos(a) * (r + 6)) + '" y1="' + (y + Math.sin(a) * (r + 6)) + '" x2="' + (x + Math.cos(a) * (r + 16)) + '" y2="' + (y + Math.sin(a) * (r + 16)) + '"/>';
    }
    return s + "</g>";
  }

  /* ---------- 기후 그래프 (PART 2용: 연평균선·연교차·두 도시 겹쳐 보기·달 누르기) ---------- */
  const TC = ["#e0483a", "#7a5cc8"];
  function chart(o) {
    const cs = o.cities, show = o.show || "t";
    const W = 600, H = o.H || 330, L = 54, R = (o.range && cs.length > 1) ? 70 : 24, T = 26, B = 40;
    const cw = (W - L - R) / 12, ih = H - T - B;
    const xm = function (m) { return L + m * cw + cw / 2; };
    let s = svgOpen(W, H, o.label || "기후 그래프", "p2-chart");
    if (show === "t") {
      let all = [];
      cs.forEach(function (c) { all = all.concat(c.t); });
      const lo = Math.min(-10, Math.floor(minOf(all) / 10) * 10), hi = Math.max(30, Math.ceil(maxOf(all) / 10) * 10);
      const y = function (v) { return T + (hi - v) / (hi - lo) * ih; };
      for (let v = lo; v <= hi; v += 10) {
        s += '<line class="p2-grid' + (v === 0 ? " zero" : "") + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>' +
          '<text class="p2-ax" x="' + (L - 8) + '" y="' + (y(v) + 5) + '" text-anchor="end">' + v + '</text>';
      }
      s += '<text class="p2-unit" x="' + (L - 8) + '" y="' + (T - 8) + '" text-anchor="end">℃</text>';
      cs.forEach(function (c, k) {
        const col = TC[k] || TC[0];
        if (o.mean) {
          const mv = mean(c.t);
          s += '<line class="p2-mean" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(mv) + '" y2="' + y(mv) + '" style="stroke:' + col + '"/>' +
            '<text class="p2-mean-t" x="' + (W - R - 6) + '" y="' + (y(mv) - 8) + '" text-anchor="end" style="fill:' + col + '">연평균 ' + deg(mv) + '</text>';
        }
        s += '<polyline class="p2-line" style="stroke:' + col + '" points="' + c.t.map(function (v, m) { return xm(m) + "," + y(v); }).join(" ") + '"/>';
        const mx = c.t.indexOf(maxOf(c.t)), mn = c.t.indexOf(minOf(c.t));
        c.t.forEach(function (v, m) {
          const key = o.range && (m === mx || m === mn);
          s += '<circle class="p2-dot' + (key ? " key" : "") + '" cx="' + xm(m) + '" cy="' + y(v) + '" r="' + (key ? 7 : 4.5) + '" style="fill:' + col + '" data-m="' + m + '"/>';
          if (o.pick) s += '<circle class="p2-hit" cx="' + xm(m) + '" cy="' + y(v) + '" r="16" data-m="' + m + '" data-k="' + k + '"/>';
        });
        if (o.range && cs.length === 1) {
          s += '<text class="p2-key-t" x="' + xm(mx) + '" y="' + (y(c.t[mx]) - 16) + '" text-anchor="middle">최난월 ' + deg(c.t[mx]) + '</text>' +
            '<text class="p2-key-t" x="' + xm(mn) + '" y="' + (y(c.t[mn]) + 28) + '" text-anchor="middle">최한월 ' + deg(c.t[mn]) + '</text>';
        }
        if (o.range && cs.length > 1) {
          const bx = W - R + 18 + k * 24;
          s += '<g class="p2-bracket" style="stroke:' + col + '"><line x1="' + bx + '" x2="' + bx + '" y1="' + y(c.t[mx]) + '" y2="' + y(c.t[mn]) + '"/>' +
            '<line x1="' + (bx - 6) + '" x2="' + (bx + 6) + '" y1="' + y(c.t[mx]) + '" y2="' + y(c.t[mx]) + '"/>' +
            '<line x1="' + (bx - 6) + '" x2="' + (bx + 6) + '" y1="' + y(c.t[mn]) + '" y2="' + y(c.t[mn]) + '"/></g>';
        }
      });
      if (cs.length > 1) {
        s += '<g class="p2-legend">' + cs.map(function (c, k) {
          return '<line x1="' + (L + 12 + k * 150) + '" x2="' + (L + 40 + k * 150) + '" y1="' + (T + 10) + '" y2="' + (T + 10) + '" style="stroke:' + TC[k] + '"/>' +
            '<text x="' + (L + 46 + k * 150) + '" y="' + (T + 16) + '">' + escHtml(c.kr) + '</text>';
        }).join("") + '</g>';
      }
    } else {
      const c = cs[0];
      const hi = Math.max(100, Math.ceil(maxOf(c.p) / 100) * 100);
      const step = hi <= 200 ? 50 : (hi <= 400 ? 100 : 200);
      const y = function (v) { return H - B - v / hi * ih; };
      for (let v = 0; v <= hi; v += step) {
        s += '<line class="p2-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>' +
          '<text class="p2-ax" x="' + (L - 8) + '" y="' + (y(v) + 5) + '" text-anchor="end">' + v + '</text>';
      }
      s += '<text class="p2-unit" x="' + (L - 8) + '" y="' + (T - 8) + '" text-anchor="end">mm</text>';
      const mark = o.mark || [];
      c.p.forEach(function (v, m) {
        const on = mark.indexOf(m) >= 0;
        s += '<rect class="p2-bar' + (on ? " on" : "") + '" x="' + (L + m * cw + cw * 0.16) + '" y="' + y(v) + '" width="' + (cw * 0.68) + '" height="' + Math.max(0, H - B - y(v)) + '" rx="3"/>';
        if (on || o.pLabels) s += '<text class="p2-bar-t' + (on ? " on" : "") + '" x="' + xm(m) + '" y="' + (y(v) - 7) + '" text-anchor="middle">' + n0(v) + '</text>';
      });
    }
    MON.forEach(function (t, m) {
      s += '<text class="p2-mon" x="' + xm(m) + '" y="' + (H - B + 24) + '" text-anchor="middle">' + (m + 1) + '</text>';
    });
    s += '<text class="p2-mon u" x="' + (W - R + 4) + '" y="' + (H - B + 24) + '">월</text>';
    s += '<line class="p2-base" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/>';
    return s + "</svg>";
  }

  /* ---------- 가로 막대 비교 (rows: [{ name, sub, v, cls, label }]) ---------- */
  function hbars(rows, o) {
    o = o || {};
    const W = 600, rowH = o.rowH || 64, T = 14, H = T * 2 + rows.length * rowH, L = 170, R = 110;
    const vs = rows.map(function (r) { return r.v; });
    const mn = Math.min(0, minOf(vs)), mx = Math.max(0, maxOf(vs));
    const lo = mn < 0 ? mn - (mx - mn) * 0.28 : 0;
    const x = function (v) { return L + (v - lo) / (mx - lo) * (W - L - R); };
    let s = svgOpen(W, H, o.label || "막대 비교", "p2-hbars");
    rows.forEach(function (r, i) {
      const cy = T + i * rowH + rowH / 2, bh = rowH * 0.52;
      const x0 = x(0), x1 = x(r.v);
      s += '<text class="p2-hb-n" x="10" y="' + (cy - (r.sub ? 2 : -6)) + '">' + escHtml(r.name) + '</text>' +
        (r.sub ? '<text class="p2-hb-s" x="10" y="' + (cy + 18) + '">' + escHtml(r.sub) + '</text>' : "") +
        '<rect class="p2-hb ' + (r.cls || "") + '" x="' + Math.min(x0, x1) + '" y="' + (cy - bh / 2) + '" width="' + Math.max(2, Math.abs(x1 - x0)) + '" height="' + bh + '" rx="5"/>' +
        '<text class="p2-hb-v ' + (r.cls || "") + '" x="' + (r.v >= 0 ? Math.max(x0, x1) + 10 : x1 - 10) + '" y="' + (cy + 7) + '" text-anchor="' + (r.v >= 0 ? "start" : "end") + '">' + r.label + '</text>';
    });
    s += '<line class="p2-base" x1="' + x(0) + '" x2="' + x(0) + '" y1="' + (T - 4) + '" y2="' + (H - T + 4) + '"/>';
    return s + "</svg>";
  }

  /* ---------- 세계 지도 위에 겹쳐 그리기 (ui/worldmap.js 지도 + 화살표·글자) ---------- */
  function lineD(P) {
    if (P.length < 3) return "M" + P.map(function (p) { return p[0].toFixed(2) + " " + p[1].toFixed(2); }).join("L");
    let d = "M" + P[0][0].toFixed(2) + " " + P[0][1].toFixed(2);
    for (let i = 1; i < P.length - 1; i++) {
      const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2;
      d += "Q" + P[i][0].toFixed(2) + " " + P[i][1].toFixed(2) + " " + mx.toFixed(2) + " " + my.toFixed(2);
    }
    const e = P[P.length - 1];
    return d + "L" + e[0].toFixed(2) + " " + e[1].toFixed(2);
  }
  /* pts: [[경도, 위도]…] → 굵은 화살표 (지도 단위 u에 맞춰 굵기·머리 크기) */
  function geoArrow(pts, u, cls, w, flow) {
    w = w || 1;
    const P = pts.map(function (p) { return [p[0], -p[1]]; });
    const a = P[P.length - 2], b = P[P.length - 1];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const hl = 3.2 * u * w, hw = 2.1 * u * w;
    const bx = b[0] - Math.cos(ang) * hl * 0.8, by = b[1] - Math.sin(ang) * hl * 0.8;
    const L2 = P.slice(0, -1).concat([[bx, by]]);
    const hx = b[0] - Math.cos(ang) * hl, hy = b[1] - Math.sin(ang) * hl;
    const px = -Math.sin(ang) * hw, py = Math.cos(ang) * hw;
    /* flow: 점선이 화살표 방향으로 흐름 (해류·계절풍) — 점선 길이도 지도 단위 u 기준 */
    const fl = flow ? ' stroke-dasharray="' + (2.4 * u * w).toFixed(3) + " " + (1.2 * u * w).toFixed(3) + '" style="--dl:' + (-3.6 * u * w).toFixed(3) + 'px"' : "";
    return '<g class="' + cls + '"><path class="ga-l' + (flow ? " flow" : "") + '" d="' + lineD(L2) + '" stroke-width="' + (1.1 * u * w).toFixed(3) + '"' + fl + '/>' +
      '<polygon class="ga-h" points="' + b[0].toFixed(2) + "," + b[1].toFixed(2) + " " + (hx + px).toFixed(2) + "," + (hy + py).toFixed(2) + " " + (hx - px).toFixed(2) + "," + (hy - py).toFixed(2) + '"/></g>';
  }
  function geoText(lon, lat, t, u, cls, anchor, size) {
    const fs = (size || 4.2) * u;
    return '<text class="' + (cls || "ga-t") + '" x="' + lon + '" y="' + (-lat) + '" font-size="' + fs.toFixed(2) + '" stroke-width="' + (fs * 0.2).toFixed(3) + '" text-anchor="' + (anchor || "middle") + '">' + t + '</text>';
  }
  /* 지도 겹침: draw(fn) — fn(u)가 겹침 SVG를 돌려줌, u = 화면 5px에 해당하는 지도 단위
     (ui/worldmap.js처럼 글자·화살표를 화면 픽셀 기준 크기로, 크기가 바뀌면 다시 그림) */
  function makeMap(host, opts, overlay) {
    const m = WorldMap.create(host, opts);
    const svg = m.root.querySelector(".wm-svg");
    const vb = svg.viewBox.baseVal;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "p2-ov");
    svg.appendChild(g);
    let fn = overlay || null;
    function unit() {
      const W = svg.clientWidth, H = svg.clientHeight;
      if (!W || !H) return vb.width / 150;
      return 5 / Math.min(W / vb.width, H / vb.height);
    }
    function paint() { g.innerHTML = fn ? fn(unit()) : ""; }
    m.draw = function (f) { fn = f; paint(); };
    m.setFn = function (f) { fn = f; };                 // 다시 그리지 않고 그리는 함수만 바꿈 (움직임 유지)
    m.ov = g;
    if ("ResizeObserver" in window) new ResizeObserver(paint).observe(svg);
    paint();
    return m;
  }

  /* ==========================================================
     2-1 기후 요소
     ========================================================== */

  /* 기온 ① 뜻과 측정 — 백엽상·자동 기상 관측 장비, 지면 1.5m */
  function tMeasure() {
    const g = 320;
    let s = svgOpen(600, 360, "기온 측정 — 백엽상과 자동 기상 관측 장비") +
      '<rect class="p2-sky" x="0" y="0" width="600" height="' + g + '"/>' +
      sun(70, 62, 26) +
      '<rect class="p2-grass" x="0" y="' + g + '" width="600" height="40"/>' +
      /* 백엽상 */
      '<g class="p2-shelter">' +
        '<line x1="236" y1="236" x2="236" y2="' + g + '"/><line x1="324" y1="236" x2="324" y2="' + g + '"/>' +
        '<polygon class="roof" points="214,150 280,120 346,150"/>' +
        '<rect x="222" y="150" width="116" height="86" rx="4"/>' +
        [0, 1, 2, 3, 4, 5, 6].map(function (i) { return '<line class="louver" x1="230" x2="330" y1="' + (160 + i * 11) + '" y2="' + (160 + i * 11) + '"/>'; }).join("") +
      '</g>' +
      /* 온도계 */
      '<g class="p2-thermo" transform="translate(280 168)"><rect x="-5" y="0" width="10" height="44" rx="5"/><circle cx="0" cy="48" r="8"/><rect class="lv" x="-2.5" y="14" width="5" height="34"/></g>' +
      /* 높이 표시 */
      '<g class="p2-dim"><line x1="380" y1="' + g + '" x2="380" y2="200"/><line x1="370" x2="390" y1="200" y2="200"/><line x1="370" x2="390" y1="' + g + '" y2="' + g + '"/>' +
        '<text x="396" y="266">약 1.5m</text></g>' +
      '<line class="p2-lead" x1="290" y1="200" x2="372" y2="200"/>' +
      /* 자동 기상 관측 장비 */
      '<g class="p2-aws"><line x1="520" y1="' + g + '" x2="520" y2="120"/><line x1="500" y1="130" x2="540" y2="130"/>' +
        '<circle cx="500" cy="124" r="6"/><circle cx="540" cy="124" r="6"/>' +
        '<g transform="translate(520 200)"><rect x="-14" y="-6" width="28" height="6" rx="2"/><rect x="-14" y="4" width="28" height="6" rx="2"/><rect x="-14" y="14" width="28" height="6" rx="2"/></g></g>' +
      '<text class="p2-lbl" x="280" y="108" text-anchor="middle">백엽상</text>' +
      '<text class="p2-lbl" x="520" y="104" text-anchor="middle">자동 기상 관측 장비</text>' +
      '<text class="p2-lbl sm" x="280" y="' + (g + 28) + '" text-anchor="middle">잔디 위에 설치</text>' +
    '</svg>';
    return { html: '<div class="p2-figwrap">' + s + photo("stevenson-screen", "tl") + '</div>' +
      cap("흰색 · 겹창 구조 → 햇빛은 막고 바람은 통하게 함 / 요즘은 자동 기상 관측 장비로 1분마다 측정") };
  }

  /* 기온 ② 평균 기온 — 서울 월평균 기온 + 연평균선, 달 누르기 */
  function tMean() {
    const c = C("Seoul");
    const html = '<div class="p2-flow"><span>하루 평균</span><i>→</i><span>월평균</span><i>→</i><span>연평균</span></div>' +
      '<div class="p2-figwrap">' + chart({ cities: [c], show: "t", mean: true, pick: true, label: "서울 월평균 기온" }) + '</div>' +
      '<div class="p2-readout" aria-live="polite">그래프의 점 누르기 → 그 달의 평균 기온</div>';
    return {
      html: html,
      init: function (el) {
        const ro = el.querySelector(".p2-readout");
        el.querySelector(".p2-chart").addEventListener("click", function (e) {
          const h = e.target.closest(".p2-hit");
          if (!h) return;
          const m = +h.getAttribute("data-m");
          el.querySelectorAll(".p2-dot").forEach(function (d) { d.classList.toggle("sel", +d.getAttribute("data-m") === m); });
          ro.innerHTML = "서울 <b>" + MON[m] + "</b> 평균 기온 <b>" + deg(c.t[m]) + "</b> · 연평균 기온 " + deg(mean(c.t));
        });
      }
    };
  }

  /* 기온 ③ 연교차 — 도시 바꾸기 */
  function tRange() {
    const list = [C("Singapore"), C("Seoul"), C("Ulaanbaatar")];
    function body(i) {
      const c = list[i], mx = maxOf(c.t), mn = minOf(c.t);
      return '<div class="p2-row">' +
          big("최난월", deg(mx), MON[c.t.indexOf(mx)], "warm") +
          big("최한월", deg(mn), MON[c.t.indexOf(mn)], "cold") +
          big("기온의 연교차", n1(mx - mn) + "℃", "최난월 − 최한월", "key") +
        '</div>' +
        '<div class="p2-figwrap">' + chart({ cities: [c], show: "t", range: true, label: c.kr + " 월평균 기온" }) + '</div>';
    }
    return {
      html: seg("city", list.map(function (c) { return escHtml(c.kr) + " <small>" + latTxt(c) + "</small>"; }), 1) + '<div class="p2-body">' + body(1) + '</div>',
      init: function (el) { bindSeg(el, "city", function (i) { el.querySelector(".p2-body").innerHTML = body(i); }); }
    };
  }

  /* 강수 ① 뜻과 측정 — 우량계 */
  function pMeasure() {
    const top = 120, bot = 320, mmMax = 50, pxPerMm = (bot - top) / mmMax;
    let ticks = "";
    for (let v = 0; v <= mmMax; v += 10) {
      ticks += '<line class="tick" x1="352" x2="366" y1="' + (bot - v * pxPerMm) + '" y2="' + (bot - v * pxPerMm) + '"/>' +
        '<text class="p2-ax" x="372" y="' + (bot - v * pxPerMm + 5) + '">' + v + '</text>';
    }
    const s = svgOpen(600, 360, "우량계로 강수량 재기") +
      '<g class="p2-drops">' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) {
        return '<line x1="' + (262 + i * 11) + '" y1="20" x2="' + (258 + i * 11) + '" y2="38" style="animation-delay:' + (i % 4) * 0.2 + 's"/>';
      }).join("") + '</g>' +
      '<g class="p2-gauge">' +
        '<polygon class="funnel" points="236,70 364,70 316,112 284,112"/>' +
        '<rect class="tube" x="250" y="' + top + '" width="100" height="' + (bot - top) + '" rx="6"/>' +
        '<rect class="water" x="252" y="' + bot + '" width="96" height="0" rx="4"/>' +
        ticks +
        '<text class="p2-unit" x="372" y="' + (top - 10) + '">mm</text>' +
      '</g>' +
      '<g class="p2-forms">' +
        '<text x="80" y="150" class="p2-emo">🌧️</text><text x="80" y="176" class="p2-lbl sm" text-anchor="middle">비</text>' +
        '<text x="80" y="230" class="p2-emo">❄️</text><text x="80" y="256" class="p2-lbl sm" text-anchor="middle">눈 → 녹여서 잼</text>' +
        '<text x="500" y="150" class="p2-emo">🧊</text><text x="500" y="176" class="p2-lbl sm" text-anchor="middle">우박</text>' +
      '</g>' +
      '<text class="p2-lbl water-t" x="300" y="345" text-anchor="middle">강수량 0mm</text>' +
    '</svg>';
    return {
      html: seg("rain", ["🌧️ 비 내리기", "비우기"], -1) + '<div class="p2-figwrap">' + s + photo("rain-gauge", "tr") + '</div>' +
        cap("강수량 = 떨어진 물이 흘러가지 않고 고였을 때의 깊이(mm)"),
      init: function (el) {
        const w = el.querySelector(".water"), t = el.querySelector(".water-t"), svg = el.querySelector(".p2-svg");
        let timer = null;
        function set(mm) {
          w.setAttribute("y", bot - mm * pxPerMm);
          w.setAttribute("height", mm * pxPerMm);
          t.textContent = "강수량 " + Math.round(mm) + "mm";
        }
        bindSeg(el, "rain", function (i) {
          clearInterval(timer);
          if (i === 1) { svg.classList.remove("raining"); set(0); return; }
          svg.classList.add("raining");
          let mm = parseFloat(w.getAttribute("height")) / pxPerMm || 0;
          timer = setInterval(function () {
            mm = Math.min(30, mm + (REDUCED ? 30 : 0.6));
            set(mm);
            if (mm >= 30) { clearInterval(timer); svg.classList.remove("raining"); }
          }, 50);
        });
        return function () { clearInterval(timer); };
      }
    };
  }

  /* 강수 ② 비가 내리는 원리 — 상승 원인 4가지 */
  const LIFT = [
    { name: "대류성", t: "지면이 강하게 가열 → 공기 상승 → 소나기·열대의 스콜" },
    { name: "지형성", t: "바람이 산을 타고 오름 → 바람받이 사면에 비 (→ 2-2 지형)" },
    { name: "전선성", t: "따뜻한 공기가 찬 공기 위로 오름 → 전선을 따라 비 (→ 2-2 기단과 전선)" },
    { name: "저기압성", t: "저기압 중심으로 공기가 모임 → 모인 공기 상승 → 비" }
  ];
  /* 단계 애니메이션용 묶음: 구름(응결 → 구름) · 비 */
  function lcloud(x, y, sc) { return '<g class="lf-cloud">' + cloud(x, y, sc, "p2-cloud dark") + '</g>'; }
  function lrain(x, y, w, h, n) { return '<g class="lf-rain">' + rain(x, y, w, h, n) + '</g>'; }
  function liftScene(k) {
    const g = 320, cl = 150;
    let s = svgOpen(600, 360, "비가 내리는 원리 — " + LIFT[k].name + " 강수") +
      '<rect class="p2-sky" x="0" y="0" width="600" height="' + g + '"/>' +
      '<line class="p2-cond" x1="0" x2="600" y1="' + cl + '" y2="' + cl + '"/>' +
      '<text class="p2-lbl sm lf-cool" x="14" y="' + (cl + 30) + '">↑ 올라갈수록 기온 낮아짐 → 수증기 응결</text>' +
      '<text class="p2-lbl sm muted" x="590" y="' + (cl - 8) + '" text-anchor="end">응결 고도 — 이 높이에서 구름 생성</text>';
    if (k === 0) {
      s += '<rect class="p2-ground hot" x="0" y="' + g + '" width="600" height="40"/>' + sun(70, 60, 24) +
        '<g class="p2-heat">' + [220, 250, 280].map(function (x) { return '<path d="M' + x + " " + (g - 4) + "q8 -10 0 -20t0 -20" + '"/>'; }).join("") + '</g>' +
        ar(260, 290, 260, 170, "p2-arrow up warm", 6) +
        lcloud(290, 120, 1.25) + lrain(262, 150, 90, 150, 7) +
        '<text class="p2-lbl" x="170" y="236" text-anchor="end">데워진 공기 상승</text>';
    } else if (k === 1) {
      s += '<rect class="p2-ground" x="0" y="' + g + '" width="600" height="40"/>' +
        '<polygon class="p2-mtn" points="140,' + g + ' 360,110 560,' + g + '"/>' +
        ar(40, 290, 150, 290, "p2-arrow", 5) + ar(160, 280, 300, 150, "p2-arrow up", 5) +
        lcloud(270, 128, 1.05) + lrain(210, 150, 90, 110, 6) +
        '<text class="p2-lbl" x="40" y="276">바람</text><text class="p2-lbl" x="150" y="210" text-anchor="end">산을 타고 상승</text>';
    } else if (k === 2) {
      s += '<rect class="p2-ground" x="0" y="' + g + '" width="600" height="40"/>' +
        '<polygon class="p2-cold" points="170,' + g + ' 600,120 600,' + g + '"/>' +
        '<text class="p2-lbl cold-t" x="520" y="280" text-anchor="middle">찬 공기</text>' +
        '<text class="p2-lbl warm-t" x="90" y="200" text-anchor="middle">따뜻한 공기</text>' +
        ar(110, 300, 380, 180, "p2-arrow warm up", 6) +
        lcloud(400, 130, 1.1) + lrain(360, 152, 90, 60, 6) +
        '<text class="p2-lbl sm" x="250" y="' + (g - 8) + '">전선</text>';
    } else {
      s += '<rect class="p2-ground" x="0" y="' + g + '" width="600" height="40"/>' +
        '<text class="p2-hl" x="300" y="' + (g - 12) + '" text-anchor="middle">저</text>' +
        ar(60, 300, 240, 300, "p2-arrow", 5) + ar(540, 300, 360, 300, "p2-arrow", 5) +
        ar(300, 270, 300, 170, "p2-arrow up", 6) +
        lcloud(300, 122, 1.3) + lrain(330, 150, 80, 150, 5) +
        '<text class="p2-lbl" x="150" y="286" text-anchor="middle">공기가 모임</text><text class="p2-lbl" x="200" y="220" text-anchor="middle">모인 공기 상승</text>';
    }
    return s + "</svg>";
  }
  function pLift() {
    return {
      html: seg("lift", LIFT.map(function (l) { return l.name; }), 0) + '<div class="p2-ctl lift-ctl"></div>' +
        '<div class="p2-figwrap p2-scene lift" data-st="4">' + liftScene(0) + '</div>' + '<p class="p2-cap lift-t">' + fmtKo(LIFT[0].t) + '</p>',
      init: function (el) {
        /* 공기 상승 → 냉각 → 응결 → 구름 → 강수 — 단계마다 장면의 data-st를 바꿔 구름·비가 차례로 나타남 */
        const sc = el.querySelector(".p2-scene");
        const pl = player(el, ".lift-ctl", ["공기 상승", "냉각", "수증기 응결", "구름", "강수"],
          function (k) { sc.setAttribute("data-st", k); }, { interval: 1700, start: 4 });
        bindSeg(el, "lift", function (i) {
          sc.innerHTML = liftScene(i);
          el.querySelector(".lift-t").innerHTML = fmtKo(LIFT[i].t);
          pl.reset();
          pl.play();
        });
        return function () { pl.pause(); };
      }
    };
  }

  /* 강수 ③ 연강수량과 강수 계절 — 도시 바꾸기 */
  function pSeason() {
    const list = [C("Singapore"), C("Seoul"), C("Rome")];
    function body(i) {
      const c = list[i], tot = sum(c.p);
      const su = c.p[5] + c.p[6] + c.p[7], wi = c.p[11] + c.p[0] + c.p[1];
      const mark = su >= wi * 1.5 ? [5, 6, 7] : (wi >= su * 1.5 ? [11, 0, 1] : []);
      return '<div class="p2-row">' +
          big("연강수량", n0(tot) + "mm", "열두 달 강수량의 합", "key") +
          big("여름(6~8월)", pct(su, tot) + "%", n0(su) + "mm", mark[0] === 5 ? "rain" : "") +
          big("겨울(12~2월)", pct(wi, tot) + "%", n0(wi) + "mm", mark[0] === 11 ? "rain" : "") +
        '</div>' +
        '<div class="p2-figwrap">' + chart({ cities: [c], show: "p", mark: mark, pLabels: false, label: c.kr + " 월 강수량" }) + '</div>';
    }
    return {
      html: seg("city", ["싱가포르 <small>연중 고름</small>", "서울 <small>여름 집중</small>", "로마 <small>겨울 비</small>"], 1) + '<div class="p2-body">' + body(1) + '</div>',
      init: function (el) { bindSeg(el, "city", function (i) { el.querySelector(".p2-body").innerHTML = body(i); }); }
    };
  }

  /* 바람 ① 기압과 바람 — 기압 차 슬라이더 */
  const PDIFF = [{ d: 4, n: "작음", w: 5, sp: 2.4 }, { d: 12, n: "보통", w: 11, sp: 1.2 }, { d: 24, n: "큼", w: 19, sp: 0.55 }];
  function wPressure() {
    function dots(x0, n) {
      let s = "";
      for (let i = 0; i < n; i++) s += '<circle cx="' + (x0 + 16 + (i * 37) % 118) + '" cy="' + (70 + (i * 53) % 220) + '" r="5"/>';
      return s;
    }
    const s = svgOpen(600, 360, "기압 차와 바람") +
      '<rect class="p2-ground" x="0" y="320" width="600" height="40"/>' +
      '<g class="p2-col high"><rect x="40" y="50" width="150" height="270" rx="10"/>' + dots(40, 34) + '</g>' +
      '<g class="p2-col low"><rect x="410" y="50" width="150" height="270" rx="10"/>' + dots(410, 12) + '</g>' +
      ar(115, 70, 115, 150, "p2-arrow", 4) + ar(485, 150, 485, 70, "p2-arrow", 4) +
      '<text class="p2-hl h" x="115" y="200" text-anchor="middle">고</text><text class="p2-lbl" x="115" y="236" text-anchor="middle">고기압</text>' +
      '<text class="p2-hl l" x="485" y="200" text-anchor="middle">저</text><text class="p2-lbl" x="485" y="236" text-anchor="middle">저기압</text>' +
      '<text class="p2-lbl sm hp-h" x="115" y="262" text-anchor="middle"></text><text class="p2-lbl sm hp-l" x="485" y="262" text-anchor="middle"></text>' +
      '<g class="p2-windbox"></g>' +
      '<text class="p2-lbl wind-t" x="300" y="276" text-anchor="middle">바람</text>' +
    '</svg>';
    return {
      html: '<div class="p2-slider"><label for="p2-pd">기압 차</label><input type="range" id="p2-pd" min="0" max="2" step="1" value="1"><span class="p2-sl-v"></span></div>' +
        '<div class="p2-figwrap">' + s + '</div>' + cap("공기가 많이 쌓인 곳 = 고기압 → 공기가 적은 저기압 쪽으로 이동 = 바람"),
      init: function (el) {
        const inp = el.querySelector("input"), wind = el.querySelector(".p2-windbox");
        function set(i) {
          const p = PDIFF[i];
          /* 공기 알갱이: 고기압 → 저기압으로 이동 (기압 차가 클수록 빠르게·많이) */
          let parts = '<g class="p2-parts">';
          for (let j = 0; j < 3 + i * 2; j++) parts += '<circle cx="204" cy="' + (292 + (j % 3 - 1) * 9) + '" r="5" style="animation-delay:calc(var(--sp) * ' + (-j * 2.2 / (3 + i * 2)).toFixed(2) + ')"/>';
          wind.innerHTML = ar(200, 292, 396, 292, "p2-arrow wind", p.w) + parts + '</g>';
          wind.style.setProperty("--sp", p.sp + "s");
          el.querySelector(".hp-h").textContent = (1010 + p.d / 2) + "hPa";
          el.querySelector(".hp-l").textContent = (1010 - p.d / 2) + "hPa";
          el.querySelector(".p2-sl-v").innerHTML = "<b>" + p.d + "hPa · " + p.n + "</b> → 바람 " + ["약함", "보통", "강함"][i];
          el.querySelector(".wind-t").textContent = "바람 " + ["약함", "보통", "강함"][i];
        }
        inp.addEventListener("input", function () { set(+inp.value); });
        set(1);
      }
    };
  }

  /* 바람 ② 풍향과 풍속 — 나침반 */
  const DIRS = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
  function wDirection() {
    const cx = 300, cy = 180, R = 130;
    let ticks = "";
    const N16 = ["북", "북북동", "북동", "동북동", "동", "동남동", "남동", "남남동", "남", "남남서", "남서", "서남서", "서", "서북서", "북서", "북북서"];
    N16.forEach(function (n, i) {
      const a = i * Math.PI / 8 - Math.PI / 2, main = i % 2 === 0;
      ticks += '<line class="tick' + (main ? " main" : "") + '" x1="' + (cx + Math.cos(a) * (R - (main ? 16 : 9))) + '" y1="' + (cy + Math.sin(a) * (R - (main ? 16 : 9))) + '" x2="' + (cx + Math.cos(a) * R) + '" y2="' + (cy + Math.sin(a) * R) + '"/>';
      if (main) ticks += '<text class="p2-lbl' + (i % 4 ? " sm" : "") + '" x="' + (cx + Math.cos(a) * (R + 22)) + '" y="' + (cy + Math.sin(a) * (R + 22) + 6) + '" text-anchor="middle">' + n + '</text>';
    });
    const s = svgOpen(600, 360, "풍향 나침반") +
      '<circle class="p2-compass" cx="' + cx + '" cy="' + cy + '" r="' + R + '"/>' + ticks +
      '<g class="p2-dir">' + ar(cx, cy - R + 20, cx, cy + R - 24, "p2-arrow wind dir", 12) + '</g>' +
      '<circle class="p2-cdot" cx="' + cx + '" cy="' + cy + '" r="6"/>' +
    '</svg>';
    function label(i) { return '<b class="p2-dirname">' + DIRS[i] + '풍</b> — ' + DIRS[i] + "쪽에서 " + DIRS[(i + 4) % 8] + "쪽으로 부는 바람"; }
    return {
      html: seg("dir", DIRS.map(function (d) { return d + "풍"; }), 7) + '<div class="p2-figwrap">' + s + photo("wind-vane", "tr") + '</div>' +
        '<div class="p2-readout dir-t">' + label(7) + '</div>' + cap("풍속: 바람의 빠르기 — m/s(초속)로 나타냄"),
      init: function (el) {
        const g = el.querySelector(".p2-dir");
        function set(i) {
          g.setAttribute("transform", "rotate(" + (i * 45) + " " + cx + " " + cy + ")");
          el.querySelector(".dir-t").innerHTML = label(i);
        }
        bindSeg(el, "dir", set);
        set(7);
      }
    };
  }

  /* 바람 ③ 여러 규모의 바람 — 해륙풍 낮·밤 */
  function seaBreeze(night) {
    const g = 250;
    let s = svgOpen(600, 300, night ? "해륙풍 — 밤: 육풍" : "해륙풍 — 낮: 해풍") +
      '<rect class="p2-sky' + (night ? " night" : "") + '" x="0" y="0" width="600" height="' + g + '"/>' +
      '<rect class="p2-landb' + (night ? "" : " hot") + '" x="0" y="' + g + '" width="300" height="50"/>' +
      '<rect class="p2-seab" x="300" y="' + g + '" width="300" height="50"/>' +
      (night ? '<circle class="p2-moon" cx="520" cy="50" r="20"/>' : sun(80, 50, 22));
    if (!night) {
      s += ar(460, 225, 140, 225, "p2-arrow", 7) + ar(140, 95, 460, 95, "p2-arrow faint", 4) +
        ar(110, 205, 110, 115, "p2-arrow faint", 4) + ar(490, 115, 490, 205, "p2-arrow faint", 4) +
        '<text class="p2-lbl" x="300" y="215" text-anchor="middle">해풍 (바다 → 육지)</text>' +
        '<text class="p2-lbl sm" x="150" y="' + (g + 32) + '" text-anchor="middle">육지: 빨리 데워짐 → 저기압</text>' +
        '<text class="p2-lbl sm" x="450" y="' + (g + 32) + '" text-anchor="middle">바다 → 고기압</text>';
    } else {
      s += ar(140, 225, 460, 225, "p2-arrow", 7) + ar(460, 95, 140, 95, "p2-arrow faint", 4) +
        ar(490, 205, 490, 115, "p2-arrow faint", 4) + ar(110, 115, 110, 205, "p2-arrow faint", 4) +
        '<text class="p2-lbl" x="300" y="215" text-anchor="middle">육풍 (육지 → 바다)</text>' +
        '<text class="p2-lbl sm" x="150" y="' + (g + 32) + '" text-anchor="middle">육지: 빨리 식음 → 고기압</text>' +
        '<text class="p2-lbl sm" x="450" y="' + (g + 32) + '" text-anchor="middle">바다 → 저기압</text>';
    }
    return s + "</svg>";
  }
  function wScale() {
    return {
      html: '<div class="p2-scales">' +
          '<div class="p2-sc"><b>지구 규모</b><span>무역풍 · 편서풍 · 극동풍</span><a class="go-chip" href="#3-6" data-go="3-6"><span class="cid">3-6</span>바람 →</a></div>' +
          '<div class="p2-sc"><b>계절 규모</b><span>계절풍 — 여름·겨울 풍향 반대</span><a class="go-chip" href="#2-2" data-go="2-2"><span class="cid">2-2</span>기후 요인 →</a></div>' +
          '<div class="p2-sc on"><b>지역 규모</b><span>해륙풍 · 산곡풍</span><em>아래 그림</em></div>' +
        '</div>' +
        '<div class="p2-ctl day-ctl"></div><div class="p2-figwrap p2-scene fade">' + seaBreeze(false) + '</div>',
      init: function (el) {
        /* 낮 ↔ 밤 자동 전환 (▶) — 단계 버튼으로 직접 고르기도 함 */
        const pl = player(el, ".day-ctl", ["☀️ 낮 — 해풍", "🌙 밤 — 육풍"],
          function (i) { el.querySelector(".p2-scene").innerHTML = seaBreeze(i === 1); }, { interval: 3200, loop: true });
        return function () { pl.pause(); };
      }
    };
  }

  /* ==========================================================
     2-2 기후 요인
     ========================================================== */

  /* 위도 ① 태양 고도와 에너지 — 위도 슬라이더 */
  const LAT_PRESET = [["적도", 0], ["서울", 37.6], ["모스크바", 55.6], ["배로", 71.3]];
  function sunLat(phi) {
    const f = phi * Math.PI / 180, cf = Math.cos(f), sf = Math.sin(f);
    const P = [380, 180], h = 60, Ls = 200;
    const hitX = function (dy) { return P[0] - (dy / cf) * sf; };
    const y1 = P[1] - h / 2, y2 = P[1] + h / 2;
    const e1 = [P[0] + Ls * sf, P[1] - Ls * cf], e2 = [P[0] - Ls * sf, P[1] + Ls * cf];
    let rays = "";
    for (let i = 0; i < 5; i++) {
      const yy = y1 + i * h / 4;
      rays += '<line class="p2-ray" x1="30" y1="' + yy + '" x2="' + (hitX(yy - P[1]) - 4) + '" y2="' + yy + '"/>';
    }
    const k = 2000;
    return svgOpen(600, 360, "위도에 따른 태양 에너지") +
      '<polygon class="p2-earth" points="' + e1[0] + "," + e1[1] + " " + e2[0] + "," + e2[1] + " " + (e2[0] + k * cf) + "," + (e2[1] + k * sf) + " " + (e1[0] + k * cf) + "," + (e1[1] + k * sf) + '"/>' +
      '<polygon class="p2-beam" points="30,' + y1 + " " + hitX(-h / 2) + "," + y1 + " " + hitX(h / 2) + "," + y2 + " 30," + y2 + '"/>' + rays +
      '<line class="p2-surf" x1="' + e1[0] + '" y1="' + e1[1] + '" x2="' + e2[0] + '" y2="' + e2[1] + '"/>' +
      '<line class="p2-foot" x1="' + hitX(-h / 2) + '" y1="' + y1 + '" x2="' + hitX(h / 2) + '" y2="' + y2 + '"/>' +
      '<text class="p2-lbl" x="130" y="' + (y1 - 14) + '">같은 양의 햇빛</text>' +
      '<g class="p2-mini" transform="translate(64 64)"><circle r="42"/><line x1="-42" x2="42" y1="0" y2="0"/>' +
        '<circle class="pos" cx="' + (-42 * Math.cos(f)) + '" cy="' + (-42 * Math.sin(f)) + '" r="6"/></g>' +
    "</svg>";
  }
  function latSun() {
    function read(phi) {
      const e = Math.cos(phi * Math.PI / 180);
      return big("비추는 면적", "× " + (1 / e).toFixed(1), "적도 = × 1.0") + big("단위 면적당 에너지", Math.round(e * 100) + "%", "적도 = 100%", "key");
    }
    return {
      html: '<div class="p2-slider"><label for="p2-lat">위도</label><input type="range" id="p2-lat" min="0" max="80" step="1" value="0"><span class="p2-sl-v">0°</span></div>' +
        '<div class="p2-ctl lat-ctl"></div>' +
        '<div class="p2-row lat-read">' + read(0) + '</div>' +
        '<div class="p2-figwrap p2-scene">' + sunLat(0) + '</div>' + cap("춘분·추분 정오 기준 모식도 — 고위도일수록 햇빛이 비스듬히 비춤"),
      init: function (el) {
        const inp = el.querySelector("input");
        let cur = 0, stop = function () {};
        function set(v) {
          cur = v;
          inp.value = v;
          el.querySelector(".p2-sl-v").textContent = Math.round(v) + "°";
          el.querySelector(".lat-read").innerHTML = read(Math.round(v));
          el.querySelector(".p2-scene").innerHTML = sunLat(v);
        }
        inp.addEventListener("input", function () { stop(); pl.pause(); set(+inp.value); });
        /* 적도 → 서울 → 모스크바 → 배로: ▶ 누르면 위도가 차례로 올라가며 햇빛이 비스듬해짐 */
        const pl = player(el, ".lat-ctl", LAT_PRESET.map(function (p) { return p[0] + " " + p[1] + "°"; }), function (k) {
          stop();
          stop = tween(cur, Math.round(LAT_PRESET[k][1]), 900, set);
        }, { interval: 2200 });
        return function () { stop(); pl.pause(); };
      }
    };
  }

  /* 위도 ② 위도별 기온 — 지도 + 연평균 기온 막대 */
  function latTemp() {
    const ids = ["Singapore", "Seoul", "Moscow", "Barrow"];
    const bars = hbars(ids.map(C).map(function (c) {
      const v = mean(c.t);
      return { name: c.kr, sub: latTxt(c), v: v, cls: v < 0 ? "cold" : "warm", label: deg(v) };
    }), { label: "위도별 연평균 기온", rowH: 58 });
    return {
      html: '<div class="p2-stack"><div class="p2-mapbox tall" data-map="lat"></div><div class="p2-figwrap hb">' + bars + '</div></div>' +
        cap("위도가 높을수록 연평균 기온 낮음 — 받는 태양 에너지가 적기 때문"),
      init: function (el) {
        makeMap(el.querySelector('[data-map="lat"]'), { legend: false, latLines: true, view: [-180, 80, 180, -30],
          cities: ids.map(function (id) { return { id: id, emph: true }; }) });
      }
    };
  }

  /* 위도 ③ 에너지 과잉·부족 — 위도별 에너지 수지 모식도 */
  function latBudget() {
    const W = 600, H = 330, L = 50, R = 20, T = 40, B = 46;
    const x = function (lat) { return L + (lat + 90) / 180 * (W - L - R); };
    const y = function (v) { return T + (340 - v) / 320 * (H - T - B); };
    const inc = function (lat) { const c = Math.cos(lat * Math.PI / 180); return 40 + 280 * c * c; };
    const out = function (lat) { const c = Math.cos(lat * Math.PI / 180); return 130 + 110 * c; };
    let pin = "", pout = "", sur = "", defN = "", defS = "";
    const crossLat = 38;
    for (let lat = -90; lat <= 90; lat += 2) {
      pin += (lat === -90 ? "M" : "L") + x(lat).toFixed(1) + " " + y(inc(lat)).toFixed(1);
      pout += (lat === -90 ? "M" : "L") + x(lat).toFixed(1) + " " + y(out(lat)).toFixed(1);
    }
    function band(a, b) {
      let top = "", bot = "";
      for (let lat = a; lat <= b; lat += 1) {
        top += (lat === a ? "M" : "L") + x(lat).toFixed(1) + " " + y(inc(lat)).toFixed(1);
        bot = "L" + x(lat).toFixed(1) + " " + y(out(lat)).toFixed(1) + bot;
      }
      return top + bot + "Z";
    }
    sur = band(-crossLat, crossLat); defN = band(crossLat, 90); defS = band(-90, -crossLat);
    let s = svgOpen(W, H, "위도별 에너지 수지") +
      '<path class="p2-sur" d="' + sur + '"/><path class="p2-def" d="' + defN + '"/><path class="p2-def" d="' + defS + '"/>' +
      '<path class="p2-in" d="' + pin + '"/><path class="p2-out" d="' + pout + '"/>';
    [-90, -60, -30, 0, 30, 60, 90].forEach(function (lat) {
      s += '<line class="p2-grid" x1="' + x(lat) + '" x2="' + x(lat) + '" y1="' + T + '" y2="' + (H - B) + '"/>' +
        '<text class="p2-mon" x="' + x(lat) + '" y="' + (H - B + 24) + '" text-anchor="middle">' + (lat === 0 ? "적도" : Math.abs(lat) + "°" + (lat > 0 ? "N" : "S")) + '</text>';
    });
    s += '<text class="p2-lbl sur-t" x="' + x(0) + '" y="' + (y(280) + 6) + '" text-anchor="middle">에너지 과잉</text>' +
      '<text class="p2-lbl def-t" x="' + x(66) + '" y="' + (y(150) + 4) + '" text-anchor="middle">부족</text>' +
      '<text class="p2-lbl def-t" x="' + x(-66) + '" y="' + (y(150) + 4) + '" text-anchor="middle">부족</text>' +
      ar(x(8), T - 16, x(62), T - 16, "p2-arrow warm", 4) + ar(x(-8), T - 16, x(-62), T - 16, "p2-arrow warm", 4) +
      '<text class="p2-lbl sm" x="' + x(0) + '" y="' + (T - 10) + '" text-anchor="middle">열 이동</text>' +
      '<g class="p2-legend"><line class="p2-in" x1="' + (L + 10) + '" x2="' + (L + 36) + '" y1="' + (H - 8) + '" y2="' + (H - 8) + '"/><text x="' + (L + 42) + '" y="' + (H - 3) + '">흡수하는 태양 에너지</text>' +
        '<line class="p2-out" x1="' + (L + 250) + '" x2="' + (L + 276) + '" y1="' + (H - 8) + '" y2="' + (H - 8) + '"/><text x="' + (L + 282) + '" y="' + (H - 3) + '">내보내는 에너지</text></g>';
    return { html: '<div class="p2-figwrap">' + s + "</svg></div>" + cap("저위도의 남는 열 → 대기·바다를 통해 고위도로 이동 = 대기 대순환의 출발점 (모식도)") };
  }

  /* 수륙 분포 ① 육지와 바다 — 여름·겨울 */
  function degI(v) { const r = Math.round(v); return (r < 0 ? "−" : "") + Math.abs(r) + "℃"; }
  /* 여름 ↔ 겨울: 온도계 눈금이 육지는 빨리, 바다는 천천히 바뀜 (예시 값) */
  const LS = { land: [30, -5], sea: [22, 8], ms: [900, 2600] };
  function lsFrac(t) { return Math.max(0.1, Math.min(1, (t + 20) / 52)); }
  function lsHeat() {
    const g = 230;
    function thermo(x, cls) {
      return '<g class="p2-thermo big ' + cls + '" transform="translate(' + x + ' 118)"><rect x="-9" y="0" width="18" height="80" rx="9"/><circle cx="0" cy="88" r="14"/>' +
        '<rect class="lv ls-lv" x="-4.5" y="10" width="9" height="80"/></g>';
    }
    const s = svgOpen(600, 330, "육지와 바다의 가열·냉각") +
      '<rect class="p2-sky ls-sky" x="0" y="0" width="600" height="' + g + '"/>' +
      '<g class="ls-sum">' + sun(300, 60, 26) + '</g><circle class="p2-sun weak ls-win" cx="300" cy="70" r="18"/>' +
      '<rect class="p2-landb ls-land hot" x="0" y="' + g + '" width="300" height="100"/>' +
      '<rect class="p2-seab" x="300" y="' + g + '" width="300" height="100"/>' +
      thermo(150, "ls-tl hot") + thermo(450, "ls-ts") +
      '<text class="p2-num ls-nl" x="190" y="170"></text><text class="p2-num ls-ns" x="490" y="170"></text>' +
      '<text class="p2-lbl" x="150" y="' + (g + 40) + '" text-anchor="middle">육지</text><text class="p2-lbl" x="450" y="' + (g + 40) + '" text-anchor="middle">바다</text>' +
      '<text class="p2-lbl sm ls-dl" x="150" y="' + (g + 70) + '" text-anchor="middle"></text>' +
      '<text class="p2-lbl sm ls-ds" x="450" y="' + (g + 70) + '" text-anchor="middle"></text>' +
    "</svg>";
    return {
      html: '<div class="p2-ctl ls-ctl"></div><div class="p2-figwrap p2-scene ls">' + s + '</div>' +
        cap("같은 햇빛을 받아도 바다는 온도 변화가 작고 느림(비열이 큼) — 기온은 예시 값"),
      init: function (el) {
        const svg = el.querySelector(".p2-scene svg");
        const lvL = svg.querySelector(".ls-tl .ls-lv"), lvS = svg.querySelector(".ls-ts .ls-lv");
        let tl = LS.land[0], ts = LS.sea[0], stops = [];
        function paint() {
          lvL.style.transform = "scaleY(" + lsFrac(tl).toFixed(3) + ")";
          lvS.style.transform = "scaleY(" + lsFrac(ts).toFixed(3) + ")";
          svg.querySelector(".ls-nl").textContent = degI(tl);
          svg.querySelector(".ls-ns").textContent = degI(ts);
        }
        function set(w) {
          stops.forEach(function (f) { f(); });
          svg.classList.toggle("winter", w === 1);
          svg.querySelector(".ls-land").classList.toggle("hot", w === 0);
          svg.querySelector(".ls-land").classList.toggle("cold", w === 1);
          svg.querySelector(".ls-tl").classList.toggle("cold", w === 1);
          svg.querySelector(".ls-dl").textContent = w ? "빨리 식음" : "빨리 데워짐";
          svg.querySelector(".ls-ds").textContent = w ? "천천히 식음" : "천천히 데워짐";
          stops = [
            tween(tl, LS.land[w], LS.ms[0], function (v) { tl = v; paint(); }),
            tween(ts, LS.sea[w], LS.ms[1], function (v) { ts = v; paint(); })
          ];
        }
        paint();
        const pl = player(el, ".ls-ctl", ["☀️ 여름", "❄️ 겨울"], set, { interval: 3600, loop: true });
        return function () { stops.forEach(function (f) { f(); }); pl.pause(); };
      }
    };
  }

  /* 두 도시 비교 (연교차) */
  function compareRange(idA, idB, noteA, noteB, capText) {
    const a = C(idA), b = C(idB);
    const ra = maxOf(a.t) - minOf(a.t), rb = maxOf(b.t) - minOf(b.t);
    return {
      html: '<div class="p2-row">' +
          big(escHtml(a.kr) + " <small>" + latTxt(a) + "</small>", n1(ra) + "℃", "연교차 · " + noteA, "c1") +
          big(escHtml(b.kr) + " <small>" + latTxt(b) + "</small>", n1(rb) + "℃", "연교차 · " + noteB, "c2") +
        '</div>' +
        '<div class="p2-figwrap">' + chart({ cities: [a, b], show: "t", range: true, label: a.kr + "와 " + b.kr + " 월평균 기온" }) + '</div>' +
        (capText ? cap(capText) : "")
    };
  }
  function lsContinental() {
    return compareRange("Vancouver", "Ulaanbaatar", "해안(해양성)", "내륙(대륙성)", "비슷한 위도 — 바다의 영향을 받는 해안은 연교차 작음, 내륙은 큼");
  }

  /* 수륙 분포 ③ 대륙 서안·동안 */
  function lsWestEast() {
    const cmp = compareRange("Lisbon", "Seoul", "대륙 서안", "대륙 동안");
    const sch = svgOpen(600, 170, "대륙 서안과 동안 모식도", "p2-sch") +
      '<rect class="p2-seab" x="0" y="0" width="600" height="170"/>' +
      '<rect class="p2-landb" x="130" y="20" width="340" height="130" rx="18"/>' +
      ar(20, 60, 150, 60, "p2-arrow", 5) + ar(20, 100, 150, 100, "p2-arrow", 5) +
      '<text class="p2-lbl sm" x="20" y="44">편서풍 (바다 → 육지)</text>' +
      '<circle class="p2-cdot" cx="150" cy="80" r="7"/><text class="p2-lbl sm" x="164" y="86">서안 — 리스본</text>' +
      '<circle class="p2-cdot" cx="450" cy="80" r="7"/><text class="p2-lbl sm" x="436" y="86" text-anchor="end">동안 — 서울</text>' +
      '<text class="p2-lbl sm muted" x="300" y="136" text-anchor="middle">대륙</text>' +
    "</svg>";
    return { html: '<div class="p2-figwrap sch">' + sch + '</div>' + cmp.html };
  }

  /* 해류 ① 난류와 한류 — 세계 지도 + 해류 화살표 */
  /* 해류 경로 [경도, 위도] — 교과서 모식도 수준으로 단순화 / at: 이름 위치, main: 세계 지도에서 이름 표시 */
  const CURRENTS = [
    { w: 1, n: "멕시코 만류", main: 1, p: [[-80, 25], [-77, 32], [-68, 38], [-52, 41]], at: [-60, 31] },
    { w: 1, n: "북대서양 해류", main: 1, p: [[-46, 44], [-33, 49], [-18, 53], [-6, 58], [5, 63], [14, 69]], at: [-25, 45] },
    { w: 1, n: "쿠로시오 해류", main: 1, p: [[123, 21], [127, 28], [133, 32], [141, 36], [150, 39]], at: [150, 31] },
    { w: 1, n: "북태평양 해류", p: [[155, 41], [178, 44]] },
    { w: 1, n: "북태평양 해류", p: [[-178, 45], [-155, 46], [-135, 47]] },
    { w: 1, n: "브라질 해류", p: [[-34, -8], [-38, -16], [-43, -24], [-50, -33]], at: [-28, -26] },
    { w: 1, n: "아굴라스 해류", p: [[41, -14], [37, -24], [31, -31], [24, -36]], at: [48, -30] },
    { w: 1, n: "동오스트레일리아 해류", p: [[154, -18], [156, -27], [152, -36]], at: [166, -28] },
    { w: 0, n: "래브라도 해류", main: 1, p: [[-64, 66], [-58, 58], [-52, 50], [-54, 44]], at: [-42, 58] },
    { w: 0, n: "카나리아 해류", main: 1, p: [[-12, 42], [-15, 33], [-18, 25], [-21, 17]], at: [-33, 27] },
    { w: 0, n: "캘리포니아 해류", main: 1, p: [[-128, 46], [-124, 38], [-118, 30], [-113, 23]], at: [-137, 32] },
    { w: 0, n: "쿠릴 해류", p: [[163, 57], [155, 50], [148, 45], [144, 40]], at: [168, 52] },
    { w: 0, n: "페루 해류", main: 1, p: [[-76, -42], [-74, -32], [-75, -22], [-79, -12], [-82, -4]], at: [-94, -22] },
    { w: 0, n: "벵겔라 해류", main: 1, p: [[16, -34], [13, -26], [11, -18], [9, -10]], at: [-3, -24] },
    { w: 0, n: "서오스트레일리아 해류", p: [[113, -34], [112, -27], [112, -20]], at: [100, -28] }
  ];
  function currentsSvg(u, filter, only, size) {
    let s = "";
    CURRENTS.forEach(function (c) {
      if (filter === "w" && !c.w) return;
      if (filter === "c" && c.w) return;
      if (only && only.indexOf(c.n) < 0) return;
      s += geoArrow(c.p, u, "p2-cur " + (c.w ? "warm" : "cold"), 1, true);
    });
    CURRENTS.forEach(function (c) {
      if (!c.at || (filter === "w" && !c.w) || (filter === "c" && c.w)) return;
      if (only ? only.indexOf(c.n) < 0 : !c.main) return;
      s += geoText(c.at[0], c.at[1], c.n, u, "p2-cur-t " + (c.w ? "warm" : "cold"), "middle", size || 2.8);
    });
    return s;
  }
  function curMap() {
    return {
      html: '<div class="p2-ctl cur-ctl">' + seg("cur", ["전체", "🔴 난류", "🔵 한류"], 0) + '</div><div class="p2-mapbox big muted" data-map="cur"></div>' +
        '<div class="p2-row sm">' + big("난류", "저위도 → 고위도", "주변을 따뜻하고 습하게", "warm") + big("한류", "고위도 → 저위도", "주변을 서늘하고 건조하게", "cold") + '</div>',
      init: function (el) {
        const m = makeMap(el.querySelector('[data-map="cur"]'), { legend: false, info: false, view: [-180, 75, 180, -50] },
          function (u) { return currentsSvg(u, ""); });
        bindSeg(el, "cur", function (i) { m.draw(function (u) { return currentsSvg(u, ["", "w", "c"][i]); }); });
        Anim.flowToggle(el.querySelector(".cur-ctl"), m.ov);
      }
    };
  }

  /* 해류 ② 난류의 영향 — 북대서양 */
  function curWarm() {
    const L = C("London"), Q = C("Quebec"), O = C("Oslo"), I = C("Iqaluit");
    return {
      html: '<div class="p2-duo wide"><div class="p2-mapbox muted" data-map="natl"></div>' +
          '<div class="p2-stack">' +
            '<div class="p2-pair"><span class="p2-pair-t">1월 평균 기온</span>' +
              big(escHtml(L.kr) + " <small>" + latTxt(L) + "</small>", deg(L.t[0]), "", "warm") +
              big(escHtml(Q.kr) + " <small>" + latTxt(Q) + "</small>", deg(Q.t[0]), "", "cold") + '</div>' +
            '<div class="p2-pair"><span class="p2-pair-t">1월 평균 기온</span>' +
              big(escHtml(O.kr) + " <small>" + latTxt(O) + "</small>", deg(O.t[0]), "", "warm") +
              big(escHtml(I.kr) + " <small>" + latTxt(I) + "</small>", deg(I.t[0]), "", "cold") + '</div>' +
          '</div></div>' +
        cap("북대서양 해류(난류) + 편서풍 → 서유럽은 고위도인데도 겨울이 온화 / 캐나다 동부는 래브라도 해류(한류) 영향"),
      init: function (el) {
        makeMap(el.querySelector('[data-map="natl"]'), { legend: false, info: false, view: [-100, 74, 36, 30], latLines: true,
          cities: ["London", "Quebec", "Oslo", "Iqaluit"].map(function (id) { return { id: id, emph: true }; }) },
          function (u) { return currentsSvg(u, "", ["북대서양 해류", "멕시코 만류", "래브라도 해류"], 3.2); });
      }
    };
  }

  /* 해류 ③ 한류의 영향 — 리마 */
  function curCold() {
    const c = C("Lima"), s = C("Seoul");
    const W = 300, H = 420, base = 350, top = 70, pc = sum(c.p), ps = sum(s.p);
    const hOf = function (v) { return Math.max(3, v / ps * (base - top)); };
    let bars = svgOpen(W, H, "리마와 서울의 연강수량", "p2-vbars") +
      '<line class="p2-base" x1="20" x2="280" y1="' + base + '" y2="' + base + '"/>';
    [[c, pc, "cold", "한류 연안"], [s, ps, "rain", "비교"]].forEach(function (d, i) {
      const x = 50 + i * 120, h = hOf(d[1]);
      bars += '<rect class="p2-hb ' + d[2] + '" x="' + x + '" y="' + (base - h) + '" width="80" height="' + h + '" rx="6"/>' +
        '<text class="p2-hb-v ' + d[2] + '" x="' + (x + 40) + '" y="' + (base - h - 12) + '" text-anchor="middle">' + n0(d[1]) + 'mm</text>' +
        '<text class="p2-hb-n" x="' + (x + 40) + '" y="' + (base + 30) + '" text-anchor="middle">' + escHtml(d[0].kr) + '</text>' +
        '<text class="p2-hb-s" x="' + (x + 40) + '" y="' + (base + 52) + '" text-anchor="middle">' + d[3] + '</text>';
    });
    bars += "</svg>";
    return {
      html: '<div class="p2-duo"><div class="p2-mapwrap"><div class="p2-mapbox muted" data-map="peru"></div>' + photo("atacama", "bl") + '</div>' +
          '<div class="p2-stack">' + big(escHtml(c.kr) + " 연강수량", n0(sum(c.p)) + "mm", "해안 도시인데도 비가 거의 없음", "cold") +
            '<div class="p2-figwrap hb">' + bars + '</div></div></div>' +
        cap("한류 위의 공기: 아래가 차가워 상승하지 않음 → 구름·비 적음, 안개 잦음 → 해안 사막(아타카마·나미브)"),
      init: function (el) {
        makeMap(el.querySelector('[data-map="peru"]'), { legend: false, info: false, view: [-100, 8, -50, -46],
          cities: [{ id: "Lima", emph: true }] },
          function (u) { return currentsSvg(u, "c", ["페루 해류"], 3.4); });
      }
    };
  }

  /* 지형 ① 해발 고도 — 고도 슬라이더 */
  function terAlt() {
    const base = C("Iquitos"), baseAlt = 100, lapse = 0.5;
    const CITY_ALT = [["Iquitos", 100], ["Bogota", 2640], ["Quito", 2850], ["La_Paz", 3640]];
    const g = 320, top = 60, maxH = 4000;
    const yOf = function (h) { return g - h / maxH * (g - top); };
    const xL = function (h) { return 90 + h / maxH * 190; };
    const xR = function (h) { return 470 - h / maxH * 190; };
    let axis = "";
    for (let h = 0; h <= maxH; h += 1000) {
      axis += '<line class="p2-grid" x1="40" x2="600" y1="' + yOf(h) + '" y2="' + yOf(h) + '"/><text class="p2-ax" x="36" y="' + (yOf(h) + 5) + '" text-anchor="end">' + h.toLocaleString("ko-KR") + '</text>';
    }
    let cities = "";
    CITY_ALT.forEach(function (ca, i) {
      const c = C(ca[0]), h = ca[1];
      cities += '<g class="p2-alt-city"><circle cx="' + xR(h) + '" cy="' + yOf(h) + '" r="7"/>' +
        '<text class="p2-lbl sm" x="' + (xR(h) + 12) + '" y="' + (yOf(h) + (i === 1 ? 16 : i === 2 ? -6 : 5)) + '">' + escHtml(c.kr) + ' ' + deg(mean(c.t)) + '</text></g>';
    });
    const s = svgOpen(600, 360, "해발 고도와 기온") +
      axis + '<text class="p2-unit" x="36" y="' + (top - 16) + '" text-anchor="end">m</text>' +
      '<polygon class="p2-mtn" points="90,' + g + ' 280,' + top + ' 470,' + g + '"/>' +
      '<rect class="p2-ground" x="40" y="' + g + '" width="560" height="40"/>' + cities +
      '<g class="p2-hiker"><circle r="9"/></g>' +
    "</svg>";
    return {
      html: '<div class="p2-slider"><label for="p2-alt">해발 고도</label><input type="range" id="p2-alt" min="0" max="4000" step="100" value="100"><span class="p2-sl-v"></span></div>' +
        '<div class="p2-row alt-read"></div>' +
        '<div class="p2-figwrap">' + s + '</div>' +
        cap("예상 기온 = 이키토스(해발 약 100m, 연평균 " + deg(mean(base.t)) + ")에서 100m 오를 때마다 약 " + lapse + "℃ 낮아진다고 가정 · 오른쪽 점 = 실제 도시 연평균 기온"),
      init: function (el) {
        const inp = el.querySelector("input"), hk = el.querySelector(".p2-hiker");
        function set(h) {
          const t = mean(base.t) - (h - baseAlt) / 100 * lapse;
          hk.setAttribute("transform", "translate(" + xL(h) + " " + yOf(h) + ")");
          el.querySelector(".p2-sl-v").textContent = h.toLocaleString("ko-KR") + "m";
          el.querySelector(".alt-read").innerHTML = big("해발 고도", h.toLocaleString("ko-KR") + "m", "") + big("예상 연평균 기온", deg(t), "100m마다 약 " + lapse + "℃ 하강", t < 15 ? "cold" : "warm");
        }
        inp.addEventListener("input", function () { set(+inp.value); });
        set(100);
      }
    };
  }

  /* 지형 ② 바람받이 사면과 비 그늘 */
  function windward(fromEast) {
    const g = 320;
    const f = fromEast ? -1 : 1, cx = 300;
    const X = function (dx) { return cx + f * dx; };
    return svgOpen(600, 360, "바람받이 사면과 비 그늘") +
      '<rect class="p2-sky" x="0" y="0" width="600" height="' + g + '"/>' +
      '<rect class="p2-ground" x="0" y="' + g + '" width="600" height="40"/>' +
      '<polygon class="p2-mtn" points="80,' + g + ' 300,100 520,' + g + '"/>' +
      '<rect class="p2-wet" x="' + Math.min(X(-300), X(-60)) + '" y="' + (g - 2) + '" width="240" height="8"/>' +
      '<rect class="p2-dry" x="' + Math.min(X(60), X(300)) + '" y="' + (g - 2) + '" width="240" height="8"/>' +
      ar(X(-290), 296, X(-210), 296, "p2-arrow", 6) +
      ar(X(-200), 280, X(-40), 130, "p2-arrow up", 6) +
      ar(X(40), 130, X(200), 280, "p2-arrow warm", 6) +
      cloud(X(-80), 118, 1.05, "p2-cloud dark") + rain(X(-80) - 50, 140, 90, 110, 6) +
      '<text class="p2-lbl" x="' + X(-190) + '" y="200" text-anchor="middle">바람받이 사면</text>' +
      '<text class="p2-lbl sm" x="' + X(-190) + '" y="226" text-anchor="middle">상승 → 구름·비</text>' +
      '<text class="p2-lbl" x="' + X(190) + '" y="200" text-anchor="middle">비 그늘</text>' +
      '<text class="p2-lbl sm" x="' + X(190) + '" y="226" text-anchor="middle">하강 → 건조·기온 상승</text>' +
      '<text class="p2-lbl sm" x="' + X(-250) + '" y="284" text-anchor="middle">바람</text>' +
      parcel(X) +
    "</svg>";
  }
  /* 공기 덩어리가 산을 넘는 모습 (SVG animateMotion) — 습함(파랑) → 산꼭대기 구름(회색) → 고온 건조(주황) */
  function parcel(X) {
    if (REDUCED) return "";
    const P = [[-290, 298], [-205, 286], [-18, 96], [0, 86], [18, 96], [205, 286], [290, 298]];
    const d = "M" + P.map(function (p) { return X(p[0]) + " " + p[1]; }).join("L");
    return '<g class="p2-parcel"><circle r="21"><animate attributeName="fill" dur="7s" repeatCount="indefinite" keyTimes="0;0.3;0.48;0.62;1" values="#5b9cf0;#5b9cf0;#8e97aa;#f0883a;#f0883a"/></circle>' +
      '<text y="6" text-anchor="middle">공기</text>' +
      '<animateMotion dur="7s" repeatCount="indefinite" path="' + d + '"/></g>';
  }
  function terShadow() {
    return {
      html: seg("wind", ["바람 → (서쪽에서)", "← 바람 (동쪽에서)"], 0) + '<div class="p2-figwrap p2-scene">' + windward(false) + '</div>' +
        cap("산을 넘어 내려온 바람은 고온 건조 — 푄 현상 (예: 우리나라 늦봄~초여름 영서 지방의 높새바람)"),
      init: function (el) { bindSeg(el, "wind", function (i) { el.querySelector(".p2-scene").innerHTML = windward(i === 1); }); }
    };
  }

  /* 계절풍 ① 원리 — 아시아 지도 여름·겨울 */
  function monsoonSvg(u, winter) {
    function hl(lon, lat, t, cls, name) {
      return '<g class="p2-press ' + cls + '"><circle cx="' + lon + '" cy="' + (-lat) + '" r="' + (5.5 * u) + '"/>' +
        geoText(lon, lat - 1.8 * u, t, u, "p2-press-t", "middle", 5) + (name ? geoText(lon, lat - 9.5 * u, name, u, "p2-press-n", "middle", 3.2) : "") + '</g>';
    }
    if (!winter) {
      return hl(88, 38, "저", "low", "대륙: 뜨거워짐") + hl(160, 32, "고", "high", "북태평양") + hl(78, -3, "고", "high", "인도양") +
        geoArrow([[150, 25], [136, 28], [124, 34], [116, 40]], u, "p2-msn wet", 1.4, true) +
        geoArrow([[66, 4], [72, 12], [78, 20], [84, 26]], u, "p2-msn wet", 1.4, true) +
        geoText(128, 16, "남동·남서 계절풍 — 바다 → 육지, 습함", u, "p2-msn-t", "middle", 3.4);
    }
    return hl(100, 50, "고", "high", "대륙: 차가워짐") + hl(156, 48, "저", "low", "북태평양") +
      geoArrow([[112, 48], [122, 42], [132, 36], [142, 30]], u, "p2-msn dry", 1.4, true) +
      geoArrow([[92, 30], [84, 22], [76, 15], [68, 9]], u, "p2-msn dry", 1.4, true) +
      geoText(122, 16, "북서·북동 계절풍 — 육지 → 바다, 건조·한랭", u, "p2-msn-t", "middle", 3.4);
  }
  function monPrinciple() {
    return {
      html: '<div class="p2-ctl mon-ctl"></div><div class="p2-mapbox big muted fade" data-map="mon"></div>' +
        cap("여름: 대륙이 더 뜨거움 → 대륙 저기압 · 겨울: 대륙이 더 차가움 → 대륙 고기압 → 바람 방향이 계절마다 뒤바뀜"),
      init: function (el) {
        const m = makeMap(el.querySelector('[data-map="mon"]'), { legend: false, info: false, view: [55, 60, 170, -8] },
          function (u) { return monsoonSvg(u, false); });
        /* 여름 ↔ 겨울 자동 전환 — 기압 중심과 바람 방향이 뒤바뀜 */
        const pl = player(el, ".mon-ctl", ["☀️ 여름 계절풍", "❄️ 겨울 계절풍"],
          function (i) { m.draw(function (u) { return monsoonSvg(u, i === 1); }); }, { interval: 3400, loop: true });
        return function () { pl.pause(); };
      }
    };
  }

  /* 계절풍 ② 영향 — 서울·뭄바이 */
  function monEffect() {
    const list = [{ c: C("Seoul"), m: [5, 6, 7], t: "6~8월" }, { c: C("Mumbai"), m: [5, 6, 7, 8], t: "6~9월" }];
    function body(i) {
      const d = list[i], tot = sum(d.c.p), wet = d.m.reduce(function (s, m) { return s + d.c.p[m]; }, 0);
      return '<div class="p2-row">' + big("연강수량", n0(tot) + "mm", "", "key") + big(d.t + " 강수 비율", pct(wet, tot) + "%", n0(wet) + "mm", "rain") +
        big("기온의 연교차", n1(maxOf(d.c.t) - minOf(d.c.t)) + "℃", "") + '</div>' +
        '<div class="p2-figwrap">' + chart({ cities: [d.c], show: "p", mark: d.m, label: d.c.kr + " 월 강수량" }) + '</div>';
    }
    return {
      html: seg("city", ["서울", "뭄바이"], 0) + '<div class="p2-body">' + body(0) + '</div>',
      init: function (el) { bindSeg(el, "city", function (i) { el.querySelector(".p2-body").innerHTML = body(i); }); }
    };
  }

  /* 기단과 전선 ① 기단 — 성질표 + 우리나라 주변 기단 */
  const MASSES = [
    { id: "sib", n: "시베리아 기단", at: [104, 51], cell: 0, t: "한랭 건조 — 겨울: 북서 계절풍·한파" },
    { id: "okh", n: "오호츠크해 기단", at: [150, 53], cell: 2, t: "한랭 다습 — 초여름: 장마 전선 형성·높새바람" },
    { id: "npa", n: "북태평양 기단", at: [158, 30], cell: 3, t: "고온 다습 — 여름: 무더위·장마 전선 형성" },
    { id: "equ", n: "적도 기단", at: [140, 9], cell: 3, t: "고온 다습 — 여름~가을: 태풍과 함께 영향" }
  ];
  function amTable(sel) {
    const cells = [["대륙", "한랭", "한랭 건조"], ["대륙", "온난", "고온 건조"], ["해양", "한랭", "한랭 다습"], ["해양", "온난", "고온 다습"]];
    return '<div class="p2-amtab">' +
      '<span class="h0"></span><span class="h">한랭 (고위도)</span><span class="h">온난 (저위도)</span>' +
      '<span class="h">대륙</span>' + [0, 1].map(function (i) { return '<span class="cell' + (sel === i ? " on" : "") + '" data-cell="' + i + '">' + cells[i][2] + '</span>'; }).join("") +
      '<span class="h">해양</span>' + [2, 3].map(function (i) { return '<span class="cell' + (sel === i ? " on" : "") + '" data-cell="' + i + '">' + cells[i][2] + '</span>'; }).join("") +
    '</div>';
  }
  function massSvg(u, sel) {
    return MASSES.map(function (m, i) {
      return '<g class="p2-mass' + (sel === i ? " on" : "") + " c" + m.cell + '" data-mass="' + i + '">' +
        '<ellipse cx="' + m.at[0] + '" cy="' + (-m.at[1]) + '" rx="11" ry="6.5"/>' +
        geoText(m.at[0], m.at[1] - 1.1 * u, m.n, u, "p2-mass-t", "middle", 3.2) + '</g>';
    }).join("");
  }
  function amMass() {
    return {
      html: '<div class="p2-duo wide"><div class="p2-mapbox muted" data-map="am"></div><div class="p2-stack">' +
          '<div class="p2-amwrap">' + amTable(-1) + '</div>' +
          '<div class="p2-readout am-t">지도의 기단 누르기 → 성질과 영향</div></div></div>' +
        cap("기단의 성질 = 발원지의 성질: 대륙 → 건조, 해양 → 습함 / 고위도 → 한랭, 저위도 → 온난"),
      init: function (el) {
        const m = makeMap(el.querySelector('[data-map="am"]'), { legend: false, info: false, view: [90, 64, 176, 0] },
          function (u) { return massSvg(u, -1); });
        function pick(i) {
          m.draw(function (u) { return massSvg(u, i); });
          el.querySelector(".p2-amwrap").innerHTML = amTable(MASSES[i].cell);
          el.querySelector(".am-t").innerHTML = "<b>" + MASSES[i].n + "</b> — " + MASSES[i].t;
        }
        m.root.addEventListener("click", function (e) {
          const g = e.target.closest(".p2-mass");
          if (g) { e.stopPropagation(); pick(+g.getAttribute("data-mass")); }
        }, true);
      }
    };
  }

  /* 기단과 전선 ② 전선 — 만나기 전·후 */
  function frontSvg(met) {
    const g = 320;
    let s = svgOpen(600, 360, met ? "두 기단이 만나 전선 형성" : "성질이 다른 두 기단") +
      '<rect class="p2-sky" x="0" y="0" width="600" height="' + g + '"/>' +
      '<rect class="p2-ground" x="0" y="' + g + '" width="600" height="40"/>';
    if (!met) {
      s += '<rect class="p2-warm" x="30" y="120" width="220" height="200" rx="16"/><rect class="p2-cold" x="350" y="120" width="220" height="200" rx="16"/>' +
        '<text class="p2-lbl warm-t" x="140" y="224" text-anchor="middle">따뜻한 공기</text><text class="p2-lbl sm" x="140" y="252" text-anchor="middle">가벼움</text>' +
        '<text class="p2-lbl cold-t" x="460" y="224" text-anchor="middle">찬 공기</text><text class="p2-lbl sm" x="460" y="252" text-anchor="middle">무거움</text>' +
        ar(260, 220, 330, 220, "p2-arrow", 5) + ar(340, 250, 270, 250, "p2-arrow", 5);
    } else {
      s += '<polygon class="p2-warm" points="0,' + g + ' 0,90 600,90 600,130 180,' + g + '"/>' +
        '<polygon class="p2-cold" points="180,' + g + ' 600,130 600,' + g + '"/>' +
        '<line class="p2-frontl" x1="180" y1="' + g + '" x2="600" y2="130"/>' +
        ar(70, 290, 380, 190, "p2-arrow warm up", 6) +
        cloud(400, 150, 1.15, "p2-cloud dark") + rain(360, 170, 90, 90, 6) +
        '<text class="p2-lbl warm-t" x="90" y="150">따뜻한 공기</text><text class="p2-lbl cold-t" x="500" y="290" text-anchor="middle">찬 공기</text>' +
        '<text class="p2-lbl sm" x="470" y="186" text-anchor="middle">전선면</text>' +
        '<text class="p2-lbl" x="180" y="' + (g + 30) + '" text-anchor="middle">전선</text>';
    }
    return s + "</svg>";
  }
  function amFront() {
    return {
      html: seg("front", ["만나기 전", "만난 뒤"], 0) + '<div class="p2-figwrap p2-scene">' + frontSvg(false) + '</div>' +
        cap("찬 공기는 무거워 아래로, 따뜻한 공기는 전선면을 따라 위로 → 구름·비 (전선성 강수)"),
      init: function (el) { bindSeg(el, "front", function (i) { el.querySelector(".p2-scene").innerHTML = frontSvg(i === 1); }); }
    };
  }

  /* 기단과 전선 ③ 장마 전선 — 달에 따라 북상 */
  const BAIU = [
    { n: "6월 하순", lat: 31, m: [5], t: "제주·남부 지방부터 장마 시작" },
    { n: "7월", lat: 36.5, m: [6], t: "중부 지방까지 북상 — 서울 강수 최다" },
    { n: "8월", lat: 42, m: [7], t: "북쪽으로 물러남 → 북태평양 기단: 무더위" }
  ];
  function baiuSvg(u, i) {
    /* 전선은 6월 위치에 그리고 CSS 이동(translateY)으로 북상 — 달이 바뀔 때 부드럽게 움직임 */
    const b = BAIU[0], dy = BAIU[i].lat - b.lat;
    let pts = [];
    for (let lon = 108; lon <= 150; lon += 3) pts.push([lon, b.lat + Math.sin((lon - 108) / 9) * 1.2 + (lon - 108) * 0.06]);
    /* 비구름 띠: 전선을 따라 폭 약 4° — 전선과 함께 이동 */
    const band = pts.map(function (p) { return [p[0], -(p[1] + 1.6)]; }).concat(pts.slice().reverse().map(function (p) { return [p[0], -(p[1] - 2.4)]; }));
    let s = '<g class="p2-baiu-g" style="transform:translateY(' + (-dy) + 'px)"><path class="p2-baiu-band" d="M' + band.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L') + 'Z"/><path class="p2-baiu" d="' + lineD(pts.map(function (p) { return [p[0], -p[1]]; })) + '" stroke-width="' + (0.9 * u) + '"/>';
    pts.forEach(function (p, k) {
      if (k % 2) s += '<circle class="p2-baiu-w" cx="' + p[0] + '" cy="' + (-p[1]) + '" r="' + (1.3 * u) + '"/>';
      else s += '<polygon class="p2-baiu-c" points="' + (p[0] - 1.3 * u) + "," + (-p[1]) + " " + (p[0] + 1.3 * u) + "," + (-p[1]) + " " + p[0] + "," + (-p[1] + 2 * u) + '"/>';
    });
    return s + geoText(110, b.lat + 2.4 * u, "장마 전선", u, "p2-baiu-t", "start", 3.4) + '</g>' +
      geoText(146, 49, "오호츠크해 기단", u, "p2-mass-t", "middle", 3.2) + geoText(140, 25, "북태평양 기단", u, "p2-mass-t", "middle", 3.2);
  }
  function amBaiu() {
    const seoul = C("Seoul");
    return {
      html: '<div class="p2-ctl baiu-ctl"></div><div class="p2-readout baiu-t"></div>' +
        '<div class="p2-duo rows"><div class="p2-mapbox muted" data-map="baiu"></div><div class="p2-figwrap baiu-c"></div></div>',
      init: function (el) {
        const m = makeMap(el.querySelector('[data-map="baiu"]'), { legend: false, info: false, view: [105, 52, 155, 22],
          cities: [{ id: "Seoul", emph: true }] });
        function set(i) {
          const f = function (u) { return baiuSvg(u, i); };
          const fg = m.ov.querySelector(".p2-baiu-g");
          if (fg) { m.setFn(f); fg.style.transform = "translateY(" + (-(BAIU[i].lat - BAIU[0].lat)) + "px)"; }
          else m.draw(f);
          el.querySelector(".baiu-t").innerHTML = "<b>" + BAIU[i].n + "</b> — " + BAIU[i].t;
          el.querySelector(".baiu-c").innerHTML = chart({ cities: [seoul], show: "p", mark: BAIU[i].m, H: 230, label: "서울 월 강수량" }) + photo("changma-sat", "tr");
        }
        /* 6월 → 7월 → 8월: ▶ 누르면 장마 전선이 북쪽으로 이동 */
        const pl = player(el, ".baiu-ctl", BAIU.map(function (b) { return b.n; }), set, { interval: 2600, start: 1 });
        return function () { pl.pause(); };
      }
    };
  }

  return {
    tMeasure: tMeasure, tMean: tMean, tRange: tRange,
    pMeasure: pMeasure, pLift: pLift, pSeason: pSeason,
    wPressure: wPressure, wDirection: wDirection, wScale: wScale,
    latSun: latSun, latTemp: latTemp, latBudget: latBudget,
    lsHeat: lsHeat, lsContinental: lsContinental, lsWestEast: lsWestEast,
    curMap: curMap, curWarm: curWarm, curCold: curCold,
    terAlt: terAlt, terShadow: terShadow,
    monPrinciple: monPrinciple, monEffect: monEffect,
    amMass: amMass, amFront: amFront, amBaiu: amBaiu,
    util: { deg: deg, n0: n0, n1: n1, pct: pct, mean: mean, sum: sum, maxOf: maxOf, minOf: minOf, latTxt: latTxt },
    /* 부품 — chapters/part2-sims.js(시뮬레이터형 그림)가 씀 */
    kit: { C: C, MON: MON, seg: seg, bindSeg: bindSeg, big: big, cap: cap, svgOpen: svgOpen, ar: ar, cloud: cloud, rain: rain, sun: sun, chart: chart,
      lineD: lineD, geoArrow: geoArrow, geoText: geoText, makeMap: makeMap, photo: photo, player: player, tween: tween,
      LIFT: LIFT, liftScene: liftScene, seaBreeze: seaBreeze, LAT_PRESET: LAT_PRESET, CURRENTS: CURRENTS, currentsSvg: currentsSvg,
      monsoonSvg: monsoonSvg, MASSES: MASSES, amTable: amTable, windward: windward, latBudget: latBudget }
  };
})();
