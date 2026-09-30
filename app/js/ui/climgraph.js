/* ============================================================
   지오엑스-세계의 기후 — ui/climgraph.js
   큰 기후 그래프 (PART 4·5·6 공용) — 월 강수량 막대(오른쪽 눈금) + 월평균 기온 선(왼쪽 눈금)
   - 표시 켜기·끄기: 최난월 tmax · 최한월 tmin · 연교차 range · 연평균 기온 tmean
                     연강수량 pann · 최다우월 pmax · 최소우월 pmin
                     기준선 g18 · g10 · g0 · gm3(−3℃) · g22
                     요소 강조 hl-line · hl-bars · hl-x
   ClimGraph.svg(도시, { on: ["tmax", …], title, hideName, start }) → 문자열
     start: 가로축을 시작할 달(0~11) — 남반구 그래프를 7월부터 그려 북반구와 모양 비교 (start: 6)
     그리기 애니메이션용: 막대·점에 --m(순서), 선에 pathLength="1" (CSS .cg-build[data-st])
   ClimGraph.set(그래프를 담은 요소, "tmax", true/false) · ClimGraph.clear(요소)
   ============================================================ */
"use strict";

const ClimGraph = (function () {
  const KEYS = ["tmax", "tmin", "range", "tmean", "pann", "pmax", "pmin", "g18", "g10", "g0", "gm3", "g22", "hl-line", "hl-bars", "hl-x"];
  const sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
  const r1 = function (v) { return Math.round(v * 10) / 10; };
  const deg = function (v) { return (v < 0 ? "−" + r1(-v) : r1(v)) + "℃"; };
  const mm = function (v) { return Math.round(v).toLocaleString("ko-KR") + "mm"; };

  function svg(city, opts) {
    opts = opts || {};
    const st0 = opts.start || 0;
    const rot = function (a) { return a.slice(st0).concat(a.slice(0, st0)); };
    const t = rot(city.t), p = rot(city.p);
    const W = 760, H = 460, L = 70, R = 76, T = 52, B = 52;
    const cw = (W - L - R) / 12;
    const tmaxV = Math.max.apply(null, t), tminV = Math.min.apply(null, t);
    /* 눈금 범위 — opts.lo · hi · pTop을 주면 그 값(두 도시 비교 때 같은 눈금) */
    const lo = opts.lo != null ? opts.lo : Math.min(-10, Math.floor(tminV / 10) * 10);
    const hi = opts.hi != null ? opts.hi : Math.max(30, Math.ceil(tmaxV / 10) * 10);
    const pTop = opts.pTop != null ? opts.pTop : Math.max(300, Math.ceil(Math.max.apply(null, p) / 100) * 100);
    const yT = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
    const yP = function (v) { return H - B - v / pTop * (H - T - B); };
    const xM = function (m) { return L + m * cw + cw / 2; };
    const iMax = t.indexOf(tmaxV), iMin = t.indexOf(tminV);
    const pAnn = sum(p), pMaxV = Math.max.apply(null, p), pMinV = Math.min.apply(null, p);
    const iPmax = p.indexOf(pMaxV), iPmin = p.indexOf(pMinV);
    const tMean = sum(t) / 12;

    let s = '<svg class="cg-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + escHtml(opts.hideName ? "기후 그래프" : city.kr + " 기후 그래프") + '">';
    /* 눈금 */
    s += '<g class="cg-axis-t">';
    for (let v = lo; v <= hi; v += 10) {
      s += '<line class="cg-grid' + (v === 0 ? " zero" : "") + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + yT(v) + '" y2="' + yT(v) + '"/>' +
        '<text class="cg-tick t" x="' + (L - 10) + '" y="' + (yT(v) + 5) + '" text-anchor="end">' + (v < 0 ? "−" + -v : v) + '</text>';
    }
    s += '<text class="cg-unit t" x="' + (L - 10) + '" y="' + (T - 20) + '" text-anchor="end">기온(℃)</text></g>';
    s += '<g class="cg-axis-p">';
    for (let k = 0; k <= 4; k++) {
      const v = pTop / 4 * k;
      s += '<text class="cg-tick p" x="' + (W - R + 10) + '" y="' + (yP(v) + 5) + '">' + v + '</text>';
    }
    s += '<text class="cg-unit p" x="' + (W - 4) + '" y="' + (T - 20) + '" text-anchor="end">강수량(mm)</text></g>';

    /* 막대 */
    s += '<g class="cg-bars">';
    p.forEach(function (v, m) {
      s += '<rect class="cg-bar' + (m === iPmax ? " is-pmax" : "") + (m === iPmin ? " is-pmin" : "") + '" x="' + (L + m * cw + cw * 0.17) + '" y="' + yP(v) + '" width="' + (cw * 0.66) + '" height="' + Math.max(0, H - B - yP(v)) + '" rx="3" style="--m:' + m + '"/>';
    });
    s += '</g>';

    /* 기준선 */
    [["g22", 22], ["g18", 18], ["g10", 10], ["g0", 0], ["gm3", -3]].forEach(function (g) {
      if (g[1] < lo || g[1] > hi) return;
      s += '<g class="cg-guide ' + g[0] + '"><line x1="' + L + '" x2="' + (W - R) + '" y1="' + yT(g[1]) + '" y2="' + yT(g[1]) + '"/>' +
        '<text x="' + (L + 6) + '" y="' + (yT(g[1]) - 6) + '">' + (g[1] < 0 ? "−" + -g[1] : g[1]) + '℃</text></g>';
    });

    /* 연평균 기온 */
    s += '<g class="cg-a tmean"><line x1="' + L + '" x2="' + (W - R) + '" y1="' + yT(tMean) + '" y2="' + yT(tMean) + '"/>' +
      '<text x="' + (W - R - 6) + '" y="' + (yT(tMean) - 8) + '" text-anchor="end">연평균 ' + deg(tMean) + '</text></g>';

    /* 기온 선 */
    s += '<g class="cg-line"><polyline pathLength="1" points="' + t.map(function (v, m) { return xM(m) + "," + yT(v); }).join(" ") + '"/>';
    t.forEach(function (v, m) { s += '<circle cx="' + xM(m) + '" cy="' + yT(v) + '" r="4.5" style="--m:' + m + '"/>'; });
    s += '</g>';

    /* 가로축 */
    s += '<g class="cg-axis-x"><line class="cg-base" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/>';
    for (let m = 0; m < 12; m++) s += '<text x="' + xM(m) + '" y="' + (H - B + 26) + '" text-anchor="middle"' + (st0 && (m + st0) % 12 === 0 ? ' class="cg-m1"' : "") + '>' + ((m + st0) % 12 + 1) + '</text>';
    s += '<text class="cg-unit x" x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end">(월)</text></g>';

    /* 표시 — 최난월 · 최한월 · 연교차 */
    function tag(x, y, text, cls, anchor) {
      const w = text.length * 13 + 22, h = 30;
      let bx = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
      bx = Math.max(4, Math.min(W - w - 4, bx));
      const by = Math.max(4, Math.min(H - h - 4, y - h / 2));
      return '<rect class="cg-tag ' + cls + '" x="' + bx + '" y="' + by + '" width="' + w + '" height="' + h + '" rx="8"/>' +
        '<text class="cg-tag-t" x="' + (bx + w / 2) + '" y="' + (by + 20.5) + '" text-anchor="middle">' + text + '</text>';
    }
    s += '<g class="cg-a tmax"><circle class="ring t" cx="' + xM(iMax) + '" cy="' + yT(tmaxV) + '" r="11"/>' +
      tag(xM(iMax), yT(tmaxV) - 30, "최난월 " + ((iMax + st0) % 12 + 1) + "월 " + deg(tmaxV), "t", "middle") + '</g>';
    s += '<g class="cg-a tmin"><circle class="ring t" cx="' + xM(iMin) + '" cy="' + yT(tminV) + '" r="11"/>' +
      tag(xM(iMin), yT(tminV) + 32, "최한월 " + ((iMin + st0) % 12 + 1) + "월 " + deg(tminV), "t", "middle") + '</g>';
    const rx = W - R - 26;
    s += '<g class="cg-a range"><line class="rg" x1="' + xM(iMax) + '" x2="' + rx + '" y1="' + yT(tmaxV) + '" y2="' + yT(tmaxV) + '"/>' +
      '<line class="rg" x1="' + xM(iMin) + '" x2="' + rx + '" y1="' + yT(tminV) + '" y2="' + yT(tminV) + '"/>' +
      '<line class="rg-bar" x1="' + rx + '" x2="' + rx + '" y1="' + yT(tmaxV) + '" y2="' + yT(tminV) + '"/>' +
      tag(rx - 8, (yT(tmaxV) + yT(tminV)) / 2, "연교차 " + deg(tmaxV - tminV), "r", "end") + '</g>';

    /* 표시 — 강수 */
    s += '<g class="cg-a pann">' + tag(L + 8, T + 18, "연강수량 " + mm(pAnn), "p", "start") + '</g>';
    s += '<g class="cg-a pmax">' + tag(xM(iPmax), yP(pMaxV) - 22, "최다우월 " + ((iPmax + st0) % 12 + 1) + "월 " + mm(pMaxV), "p", "middle") + '</g>';
    s += '<g class="cg-a pmin">' + tag(xM(iPmin), Math.min(yP(pMinV) - 22, H - B - 22), "최소우월 " + ((iPmin + st0) % 12 + 1) + "월 " + mm(pMinV), "p2", "middle") + '</g>';

    s += '</svg>';
    const on = (opts.on || []).map(function (k) { return "cg-on-" + k; }).join(" ");
    return '<div class="cg ' + on + '">' + (opts.title ? '<div class="cg-title">' + opts.title + '</div>' : "") + s + '</div>';
  }

  function set(el, key, on) {
    const g = el.classList && el.classList.contains("cg") ? el : el.querySelector(".cg");
    if (g) g.classList.toggle("cg-on-" + key, on);
  }
  function clear(el) { KEYS.forEach(function (k) { set(el, k, false); }); }

  /* 여러 도시를 같은 눈금으로 그릴 때의 범위 */
  function scaleFor(cities) {
    let tn = Infinity, tx = -Infinity, px = 0;
    cities.forEach(function (c) {
      tn = Math.min(tn, Math.min.apply(null, c.t)); tx = Math.max(tx, Math.max.apply(null, c.t)); px = Math.max(px, Math.max.apply(null, c.p));
    });
    return { lo: Math.min(-10, Math.floor(tn / 10) * 10), hi: Math.max(30, Math.ceil(tx / 10) * 10), pTop: Math.max(300, Math.ceil(px / 100) * 100) };
  }

  return { svg: svg, set: set, clear: clear, deg: deg, mm: mm, scaleFor: scaleFor };
})();
