/* ============================================================
   지오엑스-세계의 기후 — ui/cover-art.js
   CoverArt — 챕터 표지 오른쪽 큰 그림 + 파트 강조색 (2026-10-01)
   PART 1 기후대 띠 지구본 · PART 2 기후 요소와 요인 · PART 4 기후 그래프 · PART 5 주민 생활 삽화 · PART 6 평가
   ui/slides.js의 coverHtml()에서 씀 (그리는 때에 부르므로 slides.js 뒤에 불러도 됨)
   ============================================================ */
"use strict";

const CoverArt = (function () {
  const PART_COLOR = { "1": "#2b6fe3", "2": "#0f9d8a", "3": "#ea5a3d", "4": "#7a5cc8", "5": "#2b6fe3", "6": "#e8730c" };
  const LIFE_IMG = { A: "tropical", B: "dry", C: "temperate", D: "subarctic", E: "polar", H: "highland" };
  const f1 = function (v) { return Math.round(v * 10) / 10; };
  const svg = function (inner, label) { return '<svg class="cv-svg" viewBox="0 0 520 440" role="img" aria-label="' + label + '">' + inner + '</svg>'; };

  /* PART 1 — 기후대 띠를 두른 지구본 */
  function globe() {
    const cx = 260, cy = 220, r = 170;
    const bands = [[-90, -66, "#8e5cc8"], [-66, -45, "#2f6fdb"], [-45, -30, "#6cb52d"], [-30, -15, "#e6a700"], [-15, 15, "#e03131"],
      [15, 32, "#e6a700"], [32, 45, "#6cb52d"], [45, 66, "#2f6fdb"], [66, 90, "#8e5cc8"]];
    const Y = function (lat) { return cy - Math.sin(lat * Math.PI / 180) * r; };
    let s = '<defs><clipPath id="cv-g"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/></clipPath>' +
      '<radialGradient id="cv-shade" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#0b1d3a" stop-opacity=".28"/></radialGradient></defs>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="236" ry="70" fill="none" stroke="#9fb6d8" stroke-width="2" stroke-dasharray="6 8" transform="rotate(-18 ' + cx + ' ' + cy + ')"/>' +
      '<g clip-path="url(#cv-g)">' + bands.map(function (b) { return '<rect x="0" y="' + f1(Y(b[1])) + '" width="520" height="' + f1(Y(b[0]) - Y(b[1])) + '" fill="' + b[2] + '" opacity=".88"/>'; }).join("") +
      [-60, -30, 0, 30, 60].map(function (l) { return '<line x1="0" x2="520" y1="' + f1(Y(l)) + '" y2="' + f1(Y(l)) + '" stroke="#fff" stroke-width="' + (l ? 1.2 : 2.4) + '" opacity=".7"/>'; }).join("") +
      [40, 90, 140].map(function (rx) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + r + '" fill="none" stroke="#fff" stroke-width="1.2" opacity=".55"/>'; }).join("") +
      '<rect width="520" height="440" fill="url(#cv-shade)"/></g>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#fff" stroke-width="5"/>' +
      '<g transform="translate(450 70)"><circle r="30" fill="#ffd54a"/>' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { const a = i * Math.PI / 4; return '<line x1="' + f1(Math.cos(a) * 38) + '" y1="' + f1(Math.sin(a) * 38) + '" x2="' + f1(Math.cos(a) * 50) + '" y2="' + f1(Math.sin(a) * 50) + '" stroke="#f6a821" stroke-width="5" stroke-linecap="round"/>'; }).join("") + '</g>' +
      ["A", "B", "C", "D", "E"].map(function (z, i) { const col = ["#e03131", "#e6a700", "#6cb52d", "#2f6fdb", "#8e5cc8"][i]; return '<g transform="translate(' + (36 + i * 50) + ' 410)"><circle r="19" fill="' + col + '"/><text y="7" text-anchor="middle" class="cv-z">' + z + '</text></g>'; }).join("");
    return svg(s, "기후대 띠를 두른 지구본");
  }
  /* PART 2 — 해 · 구름 · 바람 · 산 · 바다 */
  function factors() {
    let s = '<defs><linearGradient id="cv-sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3f7"/><stop offset="1" stop-color="#eaf6fb"/></linearGradient></defs>' +
      '<rect x="10" y="10" width="500" height="420" rx="36" fill="url(#cv-sky2)"/>' +
      '<g transform="translate(120 110)"><circle r="44" fill="#ffd54a"/>' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { const a = i * Math.PI / 4; return '<line x1="' + f1(Math.cos(a) * 54) + '" y1="' + f1(Math.sin(a) * 54) + '" x2="' + f1(Math.cos(a) * 70) + '" y2="' + f1(Math.sin(a) * 70) + '" stroke="#f6a821" stroke-width="6" stroke-linecap="round"/>'; }).join("") + '</g>' +
      '<g fill="#fff" stroke="#c9d8ea" stroke-width="2"><ellipse cx="340" cy="120" rx="70" ry="36"/><ellipse cx="290" cy="134" rx="46" ry="28"/><ellipse cx="392" cy="136" rx="46" ry="26"/></g>' +
      '<g stroke="#3f83e8" stroke-width="5" stroke-linecap="round">' + [300, 330, 360, 390].map(function (x, i) { return '<line x1="' + x + '" y1="' + (168 + i % 2 * 6) + '" x2="' + (x - 8) + '" y2="' + (196 + i % 2 * 6) + '"/>'; }).join("") + '</g>' +
      '<g fill="none" stroke="#7048e8" stroke-width="6" stroke-linecap="round"><path d="M70 230 H230 a20 20 0 1 0 -20 -20"/><path d="M90 262 H270 a18 18 0 1 1 -18 18"/></g>' +
      '<polygon points="250,380 360,230 420,290 470,250 510,300 510,420 250,420" fill="#8a7d6a"/><polygon points="360,230 340,258 356,254 368,268 382,252" fill="#fff"/>' +
      '<path d="M10 360 Q130 340 260 372 V430 H46 Q10 430 10 400Z" fill="#3a86c8"/><g stroke="#cfe6f8" stroke-width="3" fill="none"><path d="M60 382 q14 -6 28 0"/><path d="M140 392 q14 -6 28 0"/></g>' +
      '<g transform="translate(470 120)"><rect x="-12" y="-70" width="24" height="120" rx="12" fill="#fff" stroke="#c9d8ea" stroke-width="3"/><rect x="-6" y="-20" width="12" height="62" rx="6" fill="#e0483a"/><circle cy="58" r="22" fill="#e0483a" stroke="#fff" stroke-width="4"/></g>';
    return svg(s, "기후 요소와 기후 요인");
  }
  /* PART 4 — 기후 그래프 카드 */
  function graph() {
    const P = [60, 55, 90, 120, 160, 210, 260, 230, 150, 90, 70, 55], Tm = [-4, -1, 5, 12, 18, 22, 25, 26, 21, 14, 6, -1];
    const X = function (i) { return 110 + i * 30; }, Yp = function (v) { return 360 - v * .8; }, Yt = function (t) { return 260 - t * 6; };
    let s = '<rect x="30" y="30" width="460" height="380" rx="30" fill="#fff" stroke="#dde6f2" stroke-width="2"/>' +
      '<g stroke="#e6ebf2">' + [0, 1, 2, 3].map(function (k) { return '<line x1="90" x2="460" y1="' + (120 + k * 80) + '" y2="' + (120 + k * 80) + '"/>'; }).join("") + '</g>' +
      P.map(function (v, i) { return '<rect x="' + (X(i) - 10) + '" y="' + Yp(v) + '" width="20" height="' + f1(v * .8) + '" rx="3" fill="#7fb2f0"/>'; }).join("") +
      '<polyline fill="none" stroke="#e0483a" stroke-width="5" stroke-linejoin="round" points="' + Tm.map(function (t, i) { return X(i) + "," + Yt(t); }).join(" ") + '"/>' +
      Tm.map(function (t, i) { return '<circle cx="' + X(i) + '" cy="' + Yt(t) + '" r="5" fill="#e0483a" stroke="#fff" stroke-width="2"/>'; }).join("") +
      '<text x="70" y="96" class="cv-ax" fill="#e0483a">℃</text><text x="470" y="96" class="cv-ax" fill="#2b6fe3" text-anchor="end">mm</text>' +
      '<g transform="translate(260 70)"><rect x="-56" y="-26" width="112" height="44" rx="22" fill="#7a5cc8"/><text y="5" text-anchor="middle" class="cv-code">Cfa</text></g>';
    return svg(s, "기후 그래프");
  }
  /* PART 6 — 정리와 평가 */
  function review() {
    let s = '<rect x="110" y="40" width="300" height="370" rx="26" fill="#fff" stroke="#dde6f2" stroke-width="3"/>' +
      '<rect x="200" y="22" width="120" height="40" rx="12" fill="#e8730c"/>' +
      [0, 1, 2, 3, 4].map(function (k) {
        const y = 110 + k * 60, col = ["#e03131", "#e6a700", "#6cb52d", "#2f6fdb", "#8e5cc8"][k];
        return '<rect x="150" y="' + (y - 18) + '" width="36" height="36" rx="9" fill="' + col + '"/><text x="168" y="' + (y + 8) + '" text-anchor="middle" class="cv-z">' + "ABCDE"[k] + '</text>' +
          '<rect x="204" y="' + (y - 8) + '" width="' + (110 + (k % 2) * 40) + '" height="16" rx="8" fill="#e6ebf2"/>' +
          '<path d="M' + 360 + ' ' + y + ' l10 10 l18 -20" stroke="#1f9d55" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
      }).join("") +
      '<g transform="translate(430 330)"><circle r="54" fill="#ffd54a" stroke="#f6a821" stroke-width="6"/><path d="M0 -26 l8 17 l18 2 l-14 12 l4 18 l-16 -9 l-16 9 l4 -18 l-14 -12 l18 -2Z" fill="#fff"/></g>';
    return svg(s, "정리와 평가");
  }
  function art(p) {
    const id = p.part.id;
    if (id === "5" && p.zone) return '<figure class="cv-photo" style="--zc:' + ZONES[p.zone].color + '"><img src="assets/lifestyle/' + LIFE_IMG[p.zone] + '.png" alt="' + ZONES[p.zone].name + ' 기후 지역의 주민 생활 삽화"><span class="cv-badge"><b>' + p.zone + '</b>' + ZONES[p.zone].name + ' 기후</span></figure>';
    return { "1": globe, "2": factors, "4": graph, "6": review }[id] ? '<div class="cv-art">' + ({ "1": globe, "2": factors, "4": graph, "6": review }[id])() + '</div>' : "";
  }
  function color(p) { return p.zone ? ZONES[p.zone].color : (PART_COLOR[p.part.id] || "#2b6fe3"); }
  return { art: art, color: color };
})();
