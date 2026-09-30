/* ============================================================
   지오엑스-세계의 기후 — ui/chart.js
   작은 기후 그래프(SVG) — 월 강수량 막대 + 월평균 기온 선
   ClimateChart.svg(도시, { show: "t" | "p" | "both", mark: [강조할 달 0~11], title })
   (PART 4에서 기준선·요소 설명을 붙인 자세한 기후 그래프로 확장)
   ============================================================ */
"use strict";

const ClimateChart = (function () {
  const MON = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  function svg(city, opts) {
    opts = opts || {};
    const show = opts.show || "both";
    const mark = opts.mark || [];
    const W = 520, H = 310, L = 46, R = show === "both" ? 50 : 16, T = 32, B = 34;
    const cw = (W - L - R) / 12;
    const tMin = Math.min(-10, Math.floor(Math.min.apply(null, city.t) / 10) * 10);
    const tMax = Math.max(30, Math.ceil(Math.max.apply(null, city.t) / 10) * 10);
    const pMax = Math.max(100, Math.ceil(Math.max.apply(null, city.p) / 100) * 100);
    const yT = function (v) { return T + (tMax - v) / (tMax - tMin) * (H - T - B); };
    const yP = function (v) { return H - B - v / pMax * (H - T - B); };
    let s = '<svg class="cc" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + escHtml(city.kr) + ' 기후 그래프">';

    /* 눈금 */
    if (show !== "p") {
      for (let v = tMin; v <= tMax; v += 10) {
        s += '<line class="cc-grid' + (v === 0 ? " zero" : "") + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + yT(v) + '" y2="' + yT(v) + '"/>' +
          '<text class="cc-ax t" x="' + (L - 8) + '" y="' + (yT(v) + 5) + '" text-anchor="end">' + v + '</text>';
      }
    } else {
      for (let v = 0; v <= pMax; v += pMax / 4) {
        s += '<line class="cc-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + yP(v) + '" y2="' + yP(v) + '"/>' +
          '<text class="cc-ax p" x="' + (L - 8) + '" y="' + (yP(v) + 5) + '" text-anchor="end">' + v + '</text>';
      }
    }
    if (show === "both") {
      for (let v = 0; v <= pMax; v += pMax / 4) {
        s += '<text class="cc-ax p" x="' + (W - R + 8) + '" y="' + (yP(v) + 5) + '">' + v + '</text>';
      }
    }
    s += '<text class="cc-unit t" x="' + (L - 8) + '" y="' + (T - 16) + '" text-anchor="end">' + (show === "p" ? "mm" : "℃") + '</text>';
    if (show === "both") s += '<text class="cc-unit p" x="' + (W - R + 8) + '" y="' + (T - 16) + '">mm</text>';

    /* 강조 달 배경 */
    mark.forEach(function (m) {
      s += '<rect class="cc-mark" x="' + (L + m * cw) + '" y="' + T + '" width="' + cw + '" height="' + (H - T - B) + '"/>';
    });

    /* 강수 막대 */
    if (show !== "t") {
      city.p.forEach(function (v, m) {
        s += '<rect class="cc-bar' + (mark.indexOf(m) >= 0 ? " on" : "") + '" x="' + (L + m * cw + cw * 0.18) + '" y="' + yP(v) + '" width="' + (cw * 0.64) + '" height="' + (H - B - yP(v)) + '" rx="2"/>';
      });
    }
    /* 기온 선 */
    if (show !== "p") {
      const pts = city.t.map(function (v, m) { return (L + m * cw + cw / 2) + "," + yT(v); }).join(" ");
      s += '<polyline class="cc-line" points="' + pts + '"/>';
      city.t.forEach(function (v, m) {
        s += '<circle class="cc-dot' + (mark.indexOf(m) >= 0 ? " on" : "") + '" cx="' + (L + m * cw + cw / 2) + '" cy="' + yT(v) + '" r="' + (mark.indexOf(m) >= 0 ? 6 : 4) + '"/>';
      });
    }
    /* 달 */
    MON.forEach(function (t, m) {
      s += '<text class="cc-mon' + (mark.indexOf(m) >= 0 ? " on" : "") + '" x="' + (L + m * cw + cw / 2) + '" y="' + (H - B + 22) + '" text-anchor="middle">' + t + '</text>';
    });
    s += '<line class="cc-base" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/>';
    return s + "</svg>";
  }

  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }

  return { svg: svg, sum: sum };
})();
