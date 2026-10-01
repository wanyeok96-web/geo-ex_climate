/* ============================================================
   지오엑스-세계의 기후 — chapters/part5-art.js
   P5Art — PART 5 「식생 · 경관」 카드의 작은 삽화(SVG, 400×180) (2026-10-01)
   사진이 없는 카드(토양 · 기후 특징 · 상록 활엽수림 · 영구 동토층 · 고산 도시)에 씀
   chapters/part5.js보다 먼저 불러옴 · 수치가 들어간 그림은 data/cities.js 평년값
   ============================================================ */
"use strict";

const P5Art = (function () {
  const f1 = function (v) { return Math.round(v * 10) / 10; };
  const open = function (label, top, bot) {             // 400×180 그림 + 위아래 30씩 여백(카드 비율 약 5:3에 맞춤)
    return '<svg viewBox="0 -30 400 240" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + label + '">' +
      '<rect y="-30" width="400" height="31" fill="' + (top || "#eef4fb") + '"/><rect y="179" width="400" height="31" fill="' + (bot || top || "#eef4fb") + '"/>';
  };
  const T = function (x, y, t, cls, a) { return '<text class="pa-t' + (cls ? " " + cls : "") + '" x="' + x + '" y="' + y + '"' + (a ? ' text-anchor="' + a + '"' : "") + '>' + t + '</text>'; };
  function cone(x, y, h, c) {
    return '<rect x="' + (x - 2) + '" y="' + (y - 8) + '" width="4" height="8" fill="#5b3f2a"/>' +
      [0, 1, 2].map(function (k) { const t = y - h + k * h * .27, b = y - 6 - (2 - k) * h * .18, w = h * (.16 + k * .07); return '<polygon points="' + x + ',' + f1(t) + ' ' + f1(x - w) + ',' + f1(b) + ' ' + f1(x + w) + ',' + f1(b) + '" fill="' + c + '"/>'; }).join("");
  }
  function crown(x, y, r, c, c2) {
    return '<rect x="' + (x - 3) + '" y="' + y + '" width="6" height="' + (r * 1.4) + '" fill="#5d4330"/>' +
      '<g fill="' + c + '"><circle cx="' + x + '" cy="' + (y - r * .2) + '" r="' + r + '"/><circle cx="' + (x - r * .7) + '" cy="' + (y + r * .2) + '" r="' + (r * .7) + '"/><circle cx="' + (x + r * .7) + '" cy="' + (y + r * .2) + '" r="' + (r * .7) + '"/></g>' +
      (c2 ? '<g fill="' + c2 + '"><ellipse cx="' + (x - r * .3) + '" cy="' + (y - r * .55) + '" rx="' + (r * .35) + '" ry="' + (r * .18) + '"/><ellipse cx="' + (x + r * .45) + '" cy="' + (y - r * .1) + '" rx="' + (r * .25) + '" ry="' + (r * .13) + '"/></g>' : "");
  }
  const ART = {
    /* 열대 — 라테라이트 */
    laterite: function () {
      let s = open("열대의 붉은 흙 단면", "#d8eef6", "#8f3a1c") + '<rect width="400" height="70" fill="#d8eef6"/>' +
        '<g stroke="#3f83e8" stroke-width="2.5" stroke-linecap="round">' + [40, 90, 140, 190, 240, 290, 340].map(function (x, i) { return '<line x1="' + x + '" y1="' + (8 + i % 2 * 8) + '" x2="' + (x - 6) + '" y2="' + (26 + i % 2 * 8) + '"/>'; }).join("") + '</g>' +
        crown(70, 52, 22, "#2f7d3e", "#4aa152") + crown(200, 48, 26, "#276b36", "#3a8f47") + crown(330, 54, 20, "#2f7d3e", "#4aa152") +
        '<rect y="70" width="400" height="10" fill="#4a3322"/><rect y="80" width="400" height="100" fill="#b8532d"/><rect y="140" width="400" height="40" fill="#8f3a1c"/>';
      for (let i = 0; i < 26; i++) s += '<circle cx="' + ((i * 61) % 400) + '" cy="' + (88 + (i * 37) % 86) + '" r="' + (2 + i % 3) + '" fill="#7a2f17" opacity=".55"/>';
      s += '<g fill="#7fb2e8">' + [120, 250].map(function (x) { return '<path d="M' + x + ' 84 v40 h-8 l12 16 l12 -16 h-8 v-40Z"/>'; }).join("") + '</g>' +
        T(140, 110, "양분이 빗물에 씻겨 내려감", "w") + T(390, 172, "라테라이트(붉은 흙)", "w", "end") + '</svg>';
      return s;
    },
    /* 건조 — 낮과 밤 */
    dryday: function () {
      return open("사막의 낮과 밤") + '<rect y="-30" width="200" height="240" fill="#ffd98a"/><rect x="200" y="-30" width="200" height="240" fill="#26325a"/>' +
        '<circle cx="70" cy="50" r="24" fill="#ffb800"/><g stroke="#ffb800" stroke-width="4" stroke-linecap="round">' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { const a = i * Math.PI / 4; return '<line x1="' + f1(70 + Math.cos(a) * 31) + '" y1="' + f1(50 + Math.sin(a) * 31) + '" x2="' + f1(70 + Math.cos(a) * 40) + '" y2="' + f1(50 + Math.sin(a) * 40) + '"/>'; }).join("") + '</g>' +
        '<path d="M290 30 a20 20 0 1 0 22 26 a16 16 0 1 1 -22 -26Z" fill="#f3f0d8"/>' + [[240, 30], [360, 50], [340, 20], [260, 70], [380, 90]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2" fill="#fff"/>'; }).join("") +
        '<path d="M0 140 Q60 112 120 132 Q160 120 200 136 V210 H0Z" fill="#e3b56c"/><path d="M200 136 Q260 118 320 132 Q360 124 400 138 V210 H200Z" fill="#6b5a7a"/>' +
        T(150, 60, "낮 40℃", "big", "middle") + T(330, 110, "밤 10℃", "big w", "middle") +
        '<rect x="140" y="146" width="120" height="28" rx="14" fill="#e0483a"/>' + T(200, 166, "일교차 큼", "w b", "middle") + '</svg>';
    },
    /* 온대 — 상록 활엽수림 */
    evergreen: function () {
      let s = open("상록 활엽수림", "#e8f3fb", "#9fc27a") + '<rect width="400" height="180" fill="#e8f3fb"/><rect y="140" width="400" height="40" fill="#9fc27a"/>' +
        crown(90, 108, 46, "#1f6b3a", "#5aa86a") + crown(220, 100, 54, "#24774a", "#64b878") + crown(340, 112, 40, "#1f6b3a", "#5aa86a");
      [[70, 80], [110, 96], [200, 66], [240, 92], [214, 108], [330, 90], [350, 104]].forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="#e0483a"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.8" fill="#ffd54a"/>'; });
      return s + '<rect x="14" y="12" width="168" height="28" rx="14" fill="#fff" opacity=".9"/>' + T(98, 32, "겨울에도 푸른 잎", "b", "middle") +
        T(390, 172, "두껍고 반질반질한 잎", "w", "end") + '</svg>';
    },
    /* 냉대 — 포드졸 */
    podzol: function () {
      let s = open("냉대의 회백색 흙 단면", "#dfe9f2", "#a8683a") + '<rect width="400" height="62" fill="#dfe9f2"/>';
      for (let x = 18; x < 400; x += 34) s += cone(x, 62, 50 + (x % 3) * 8, x % 2 ? "#2f5a45" : "#27503c");
      s += '<rect y="62" width="400" height="14" fill="#3f2d1f"/><rect y="76" width="400" height="48" fill="#d9d5c9"/><rect y="124" width="400" height="56" fill="#a8683a"/>';
      for (let i = 0; i < 30; i++) s += '<path d="M' + ((i * 53) % 400) + ' ' + (64 + i % 3 * 3) + ' l8 3" stroke="#8a6a3a" stroke-width="1.5"/>';
      return s + T(10, 106, "회백색 층 — 양분 · 철분이 빠져나감", "") + T(10, 160, "아래로 쌓인 철 · 알루미늄 (적갈색)", "w") + T(390, 74, "침엽수 낙엽(산성)", "w sm", "end") + '</svg>';
    },
    /* 냉대 — 하얼빈 연교차 */
    harbin: function () {
      const c = CITY_BY_ID.Harbin, X = function (i) { return 60 + i * 28; }, Y = function (t) { return 96 - t * 2.4; };
      const mx = Math.max.apply(null, c.t), mn = Math.min.apply(null, c.t), im = c.t.indexOf(mx), in_ = c.t.indexOf(mn);
      let s = open("하얼빈 월평균 기온", "#f4f8fd") + '<rect width="400" height="180" fill="#f4f8fd"/>' +
        '<line x1="50" x2="380" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="#8a93a6" stroke-width="1.5"/>' + T(46, Y(0) + 5, "0℃", "sm", "end") +
        '<polyline fill="none" stroke="#e0483a" stroke-width="4" stroke-linejoin="round" points="' + c.t.map(function (t, i) { return X(i) + "," + f1(Y(t)); }).join(" ") + '"/>' +
        c.t.map(function (t, i) { return '<circle cx="' + X(i) + '" cy="' + f1(Y(t)) + '" r="4" fill="' + (t < 0 ? "#2b6fe3" : "#e0483a") + '"/>'; }).join("") +
        T(X(im), Y(mx) - 10, (mx > 0 ? "" : "−") + Math.abs(mx).toFixed(1) + "℃", "b", "middle") + T(X(in_) + 6, Y(mn) + 22, "−" + Math.abs(mn).toFixed(1) + "℃", "b c", "start") +
        '<path d="M372 ' + f1(Y(mx)) + ' V' + f1(Y(mn)) + '" stroke="#7a5cc8" stroke-width="3"/><path d="M366 ' + f1(Y(mx) + 8) + ' l6 -8 l6 8 M366 ' + f1(Y(mn) - 8) + ' l6 8 l6 -8" stroke="#7a5cc8" stroke-width="3" fill="none"/>' +
        T(390, f1(Y(mx) - 16), "연교차 " + Math.round(mx - mn) + "℃", "b p", "end") + T(10, 20, "하얼빈 월평균 기온 (평년값)", "sm") + '</svg>';
      return s;
    },
    /* 한대 — 영구 동토층 */
    permafrost: function () {
      let s = open("툰드라의 영구 동토층 단면", "#d6e9f7", "#8fb0cf") + '<rect width="400" height="50" fill="#d6e9f7"/><rect y="44" width="400" height="10" fill="#8c8a58"/>';
      for (let i = 0; i < 24; i++) s += '<ellipse cx="' + ((i * 41) % 400) + '" cy="' + (46 + i % 2 * 3) + '" rx="12" ry="4" fill="' + ["#7fa05a", "#c8c79a", "#a2573a"][i % 3] + '"/>';
      s += '<ellipse cx="250" cy="52" rx="44" ry="6" fill="#5d9ccf"/><rect y="54" width="400" height="38" fill="#7a5a3a"/><rect y="92" width="400" height="88" fill="#8fb0cf"/>';
      [[60, 120], [150, 150], [230, 118], [320, 146], [380, 112], [100, 165]].forEach(function (p) { s += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="22" ry="6" fill="#e6f2fb" stroke="#fff"/>'; });
      return s + '<path d="M250 58 v26" stroke="#3a86c8" stroke-width="3" stroke-dasharray="4 4"/><path d="M243 80 l7 9 l7 -9" fill="#3a86c8"/>' +
        T(10, 78, "여름에 녹는 층 — 물이 빠지지 못해 습지", "w") + T(10, 172, "영구 동토층 — 일 년 내내 얼어 있음", "") + '</svg>';
    },
    /* 고산 — 고산 도시 */
    highcity: function () {
      const mean = function (id) { const t = CITY_BY_ID[id].t; return t.reduce(function (a, b) { return a + b; }, 0) / 12; };
      const q = mean("Quito"), lo = mean("Iquitos");
      let s = open("저지대와 고산 도시의 기온 비교", "#cfe6f8", "#4f9a3e") + '<rect width="400" height="180" fill="#cfe6f8"/>' +
        '<polygon points="0,170 120,60 170,80 230,30 300,90 400,70 400,180 0,180" fill="#8a7d6a"/><polygon points="230,30 216,50 228,46 236,56 246,44" fill="#fff"/>' +
        '<polygon points="150,96 290,96 300,112 140,112" fill="#a4a45c"/>';
      for (let i = 0; i < 14; i++) s += '<rect x="' + (156 + (i % 7) * 18) + '" y="' + (80 + Math.floor(i / 7) * 10) + '" width="13" height="' + (12 - Math.floor(i / 7) * 2) + '" fill="' + ["#f3ecd9", "#e8c9a0", "#d98f6a"][i % 3] + '" stroke="#b5a58a"/>';
      return s + '<rect y="160" width="400" height="20" fill="#4f9a3e"/>' +
        T(220, 74, "키토 2,850m · 연평균 " + q.toFixed(1) + "℃", "b", "middle") + T(390, 154, "아마존 저지대(이키토스) · " + lo.toFixed(1) + "℃", "w b", "end") +
        '<rect x="12" y="10" width="180" height="26" rx="13" fill="#fff" opacity=".92"/>' + T(102, 28, "1년 내내 봄 같은 날씨", "b", "middle") + '</svg>';
    }
  };
  return { has: function (k) { return !!ART[k]; }, html: function (k) { return '<div class="veg-art">' + ART[k]() + '</div>'; } };
})();
