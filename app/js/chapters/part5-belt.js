/* ============================================================
   지오엑스-세계의 기후 — chapters/part5-belt.js
   PressureBelt — 기압대의 계절 이동 평면 시뮬레이터 (2026-10-01)
   5-1 열대 「우기와 건기가 생기는 까닭」 · 5-3 온대 「여름이 건조한 까닭」
   대기대순환 3D(PART 3)의 색 · 기호(H/L, 공기 올라감/내려감, 구름/해, 바람 색)를 평면 지도 + 위도 단면으로 옮김
   기압대 위치 · 폭은 설명용 모식(태양을 따라 약 ±10° 이동, 한 달쯤 늦게), 월 강수량은 data/cities.js 평년값
   chapters/part5.js보다 먼저 불러옴 (part5.js의 build()가 PressureBelt.block(zone)을 씀)
   ============================================================ */
"use strict";

const PressureBelt = (function () {
  const MON = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  const COL = { eq: "#ea5a3d", sub: "#dc9a2e", front: "#23967f", polar: "#4f83db", trade: "#0fb3a3", west: "#7048e8", east: "#d6336c", sun: "#f6a821" };
  /* 기압대: 중심 위도(기압대가 한가운데 있을 때), 반폭 */
  const BELTS = [
    { k: "polar", lat: -82, half: 8, hl: "H", n: "극 고압대" },
    { k: "front", lat: -58, half: 7, hl: "L", n: "한대 전선대" },
    { k: "sub", lat: -28, half: 7, hl: "H", n: "아열대 고압대" },
    { k: "eq", lat: 0, half: 6, hl: "L", n: "적도 저압대" },
    { k: "sub", lat: 28, half: 7, hl: "H", n: "아열대 고압대" },
    { k: "front", lat: 58, half: 7, hl: "L", n: "한대 전선대" },
    { k: "polar", lat: 82, half: 8, hl: "H", n: "극 고압대" }
  ];
  const ZONE = {
    A: { title: "우기와 건기가 생기는 까닭", cities: ["Darwin", "Bamako", "Brasilia"],
         say: ["<b>적도 저압대</b>(공기 올라감 → 구름 · 비)가 오는 달 = <b>우기</b>", "<b>아열대 고압대</b>(공기 내려감 → 맑음)가 오는 달 = <b>건기</b>", "기압대는 태양을 따라 여름 반구 쪽으로 이동 → 남 · 북반구의 우기가 반대"] },
    C: { title: "여름이 건조한 까닭 — 지중해성 기후", cities: ["Rome", "San_Francisco", "Perth"],
         say: ["여름: <b>아열대 고압대</b>가 올라와 도시를 덮음 → 맑고 <b>건조</b>", "겨울: 고압대가 내려가고 <b>편서풍 · 한대 전선대</b>가 옴 → <b>비</b>", "대륙 서안 위도 30°~40° 부근에 나타남 — 남반구는 계절이 반대"] }
  };
  const shiftAt = function (m) { return 10 * Math.cos(2 * Math.PI * (m - 6.5) / 12); };        // 기압대 이동(°), 7월 중순 최북단
  const declAt = function (m) { return 23.44 * Math.sin(2 * Math.PI * (m + .5 - 2.67) / 12); }; // 태양이 머리 위에 오는 위도
  function state(lat, s) {
    const d = lat - s, a = Math.abs(d);
    if (a <= 6) return { k: "eq", n: "적도 저압대", w: "비 많음", ico: "🌧️", wet: 2, air: "공기 올라감" };
    if (Math.abs(a - 28) <= 7) return { k: "sub", n: "아열대 고압대", w: "맑고 건조", ico: "☀️", wet: 0, air: "공기 내려감" };
    if (Math.abs(a - 58) <= 7) return { k: "front", n: "한대 전선대", w: "비 · 흐림(전선)", ico: "🌧️", wet: 2, air: "공기 올라감" };
    if (a < 28) return { k: "trade", n: "무역풍대", w: "대체로 맑음 · 비 적음", ico: "🌤️", wet: 0, air: "고압대에서 적도로 부는 바람" };
    if (a < 58) return { k: "west", n: "편서풍대", w: "저기압 · 전선이 지나며 비", ico: "🌦️", wet: 1, air: "서쪽에서 부는 바람" };
    return { k: "polar", n: "극 고압대", w: "춥고 건조", ico: "❄️", wet: 0, air: "공기 내려감" };
  }
  const f1 = function (v) { return Math.round(v * 10) / 10; };
  const latTxt = function (v) { const r = Math.round(Math.abs(v) * 10) / 10; return r === 0 ? "0°" : r + "°" + (v > 0 ? "N" : "S"); };

  /* ---------- 지도 겹침 (지도 단위: x = 경도, y = −위도, u = 화면 5px) ---------- */
  function mapOverlay(u, s, decl, c, st) {
    const K = P2F.kit, small = u > 3;                    // 좁은 화면: 기압대 이름 대신 H/L 배지만
    let o = "";
    BELTS.forEach(function (b) {
      const top = b.lat + s + b.half, bot = b.lat + s - b.half;
      o += '<rect class="pb-band ' + b.k + '" x="-180" y="' + f1(-top) + '" width="360" height="' + (b.half * 2) + '"/>' +
        '<line class="pb-edge ' + b.k + '" x1="-180" x2="180" y1="' + f1(-top) + '" y2="' + f1(-top) + '" stroke-width="' + f1(.35 * u) + '"/>' +
        '<line class="pb-edge ' + b.k + '" x1="-180" x2="180" y1="' + f1(-bot) + '" y2="' + f1(-bot) + '" stroke-width="' + f1(.35 * u) + '"/>';
    });
    /* 바람 — 세 대양 위 */
    [-150, -35, 70].forEach(function (lon) {
      [1, -1].forEach(function (h) {
        o += K.geoArrow([[lon + 7, s + h * 23], [lon - 6, s + h * 9]], u, "pb-w trade", .8, true) +
          K.geoArrow([[lon - 8, s + h * 38], [lon + 9, s + h * 49]], u, "pb-w west", .8, true);
      });
    });
    /* 기압대 이름표 (왼쪽 끝) */
    BELTS.forEach(function (b) {
      const y = b.lat + s;
      if (Math.abs(y) > 70) return;
      const x = -176, r = 2.4 * u;
      o += '<g class="pb-tag ' + b.k + '"><circle cx="' + f1(x + r) + '" cy="' + f1(-y) + '" r="' + f1(r) + '" stroke-width="' + f1(.45 * u) + '"/>' +
        '<text class="pb-hl" x="' + f1(x + r) + '" y="' + f1(-y + r * .45) + '" font-size="' + f1(2.6 * u) + '" text-anchor="middle">' + b.hl + '</text></g>' +
        (small ? "" : K.geoText(x + r * 2 + 1.2 * u, y - .9 * u, b.n, u, "pb-bt " + b.k, "start", 2.9));
    });
    /* 태양이 머리 위에 오는 위도 */
    o += '<line class="pb-sun" x1="-180" x2="180" y1="' + f1(-decl) + '" y2="' + f1(-decl) + '" stroke-width="' + f1(.5 * u) + '" stroke-dasharray="' + f1(1.6 * u) + ' ' + f1(1.2 * u) + '"/>' +
      '<g class="pb-sunico" transform="translate(166 ' + f1(-decl) + ')"><circle r="' + f1(2.6 * u) + '"/></g>';
    /* 도시 */
    o += '<g class="pb-city ' + st.k + '"><circle cx="' + f1(c.lon) + '" cy="' + f1(-c.lat) + '" r="' + f1(2.2 * u) + '" stroke-width="' + f1(.8 * u) + '"/></g>' +
      K.geoText(c.lon + 3.4 * u, c.lat - 1 * u, c.kr, u, "pb-ct", "start", small ? 2.6 : 3.4);
    return o;
  }

  /* ---------- 위도 단면 (왼쪽 = 남, 오른쪽 = 북, 대기대순환 3D 옆모습과 같은 방향) ---------- */
  const SW = 1000, SH = 230, X = function (lat) { return 500 + lat * 6.4; };
  function sectionSvg() {
    let s = '<svg class="p2-svg pb-sec-svg" viewBox="0 0 ' + SW + ' ' + SH + '" role="img" aria-label="위도에 따른 기압대 단면">' +
      '<defs><linearGradient id="pb-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f8fd"/><stop offset="1" stop-color="#e4eefb"/></linearGradient></defs>' +
      '<rect width="' + SW + '" height="' + SH + '" fill="url(#pb-sky)"/>' +
      '<g class="pb-move">';
    BELTS.forEach(function (b) {
      const x0 = X(b.lat - b.half), w = b.half * 2 * 6.4, cx = X(b.lat), up = b.hl === "L";
      s += '<rect class="pb-col ' + b.k + '" x="' + f1(x0) + '" y="40" width="' + f1(w) + '" height="140" rx="6"/>';
      for (let k = 0; k < 3; k++) {
        const y = up ? 150 - k * 34 : 86 + k * 34;
        s += '<path class="pb-chev ' + (up ? "up" : "down") + '" style="animation-delay:' + (k * .35) + 's" d="M' + (cx - 12) + ' ' + (up ? y + 7 : y - 7) + ' L' + cx + ' ' + (up ? y - 7 : y + 7) + ' L' + (cx + 12) + ' ' + (up ? y + 7 : y - 7) + '"/>';
      }
      s += up ? '<g class="pb-cloud" transform="translate(' + cx + ' 26)"><ellipse cx="0" cy="0" rx="18" ry="11"/><ellipse cx="-11" cy="4" rx="11" ry="8"/><ellipse cx="11" cy="4" rx="12" ry="8"/>' +
          '<path d="M-8 14 l-3 9 M0 14 l-3 9 M8 14 l-3 9"/></g>'
        : '<g class="pb-sunny" transform="translate(' + cx + ' 24)"><circle r="8"/>' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { const a = i * Math.PI / 4; return '<line x1="' + f1(Math.cos(a) * 11) + '" y1="' + f1(Math.sin(a) * 11) + '" x2="' + f1(Math.cos(a) * 15) + '" y2="' + f1(Math.sin(a) * 15) + '"/>'; }).join("") + '</g>';
      s += '<g class="pb-badge ' + b.k + '" transform="translate(' + cx + ' 198)"><circle r="16"/><text y="6" text-anchor="middle">' + b.hl + '</text></g>';
    });
    s += '</g>' +
      '<rect class="pb-ground" x="0" y="182" width="' + SW + '" height="10" rx="5"/>' +
      [-60, -30, 0, 30, 60].map(function (l) { return '<text class="pb-ax" x="' + X(l) + '" y="226" text-anchor="middle">' + (l === 0 ? "적도" : latTxt(l)) + '</text>'; }).join("") +
      '<text class="pb-ax sm" x="14" y="226">남</text><text class="pb-ax sm" x="' + (SW - 14) + '" y="226" text-anchor="end">북</text>' +
      '<g class="pb-secsun"><line y1="0" y2="40" stroke-dasharray="4 4"/><circle cy="10" r="9"/></g>' +
      '<g class="pb-seccity"><path d="M0 182 l-9 -16 h18Z"/><text y="160" text-anchor="middle"></text></g>' +
    '</svg>';
    return s;
  }

  function bars(c, m) {
    const mx = Math.max.apply(null, c.p);
    return '<div class="pb-bars">' + c.p.map(function (v, i) {
      return '<div class="pb-bb' + (i === m ? " on" : "") + '"><b>' + (i === m ? Math.round(v) : "") + '</b><i style="height:' + Math.max(2, v / mx * 100).toFixed(1) + '%"></i><span>' + (i + 1) + '</span></div>';
    }).join("") + '</div>';
  }

  function block(zone) {
    const Z = ZONE[zone];
    const legend = [["eq", "적도 저압대 (L)"], ["sub", "아열대 고압대 (H)"], ["front", "한대 전선대 (L)"], ["trade", "무역풍"], ["west", "편서풍"], ["sun", "태양이 머리 위"]];
    return {
      title: Z.title,
      html: '<div class="pb">' +
        '<div class="pb-top"><div class="pb-play"></div>' +
          '<div class="p4-seg" role="group" data-seg="pbc">' + Z.cities.map(function (id, i) { const c = CITY_BY_ID[id]; return '<button type="button" class="p4-sb' + (i ? "" : " on") + '" data-i="' + i + '">' + escHtml(c.kr) + ' <small>' + latTxt(c.lat) + '</small></button>'; }).join("") + '</div></div>' +
        '<div class="pb-main"><div class="pb-left">' +
            '<div class="p2-mapbox pb-map" data-map="pb-' + zone + '"></div>' +
            '<div class="pb-legend">' + legend.map(function (l) { return '<span class="pb-lg ' + l[0] + '"><i></i>' + l[1] + '</span>'; }).join("") + '</div>' +
            '<div class="p2-figwrap pb-sec">' + sectionSvg() + '</div></div>' +
          '<div class="pb-side"><div class="pb-now"></div><div class="pb-rain"></div>' +
            '<ul class="pts sm">' + Z.say.map(function (t) { return '<li>' + t + '</li>'; }).join("") + '</ul>' +
            '<div class="pb-go">' + chapterChip("3-8", "3D로 보기 — 계절에 따른 기압대 이동") + '</div></div></div>' +
        '<p class="p2-cap">기압대의 위치 · 폭은 설명을 위한 모식(태양을 따라 약 ±10° 이동) · 막대 = 월 강수량(평년값) · 단면: 왼쪽 남쪽, 오른쪽 북쪽</p></div>',
      init: function (el) {
        const K = P2F.kit, svg = el.querySelector(".pb-sec-svg");
        let ci = 0, m = 0, s = shiftAt(0), stopT = function () {};
        const map = K.makeMap(el.querySelector(".pb-map"), { legend: false, info: false, view: [-180, 72, 180, -62], latLines: true }, draw);
        el.querySelector(".pb-map").classList.add("muted");
        function city() { return CITY_BY_ID[Z.cities[ci]]; }
        function draw(u) { const c = city(); return mapOverlay(u, s, declAt(m), c, state(c.lat, s)); }
        function paint(anim) {
          const c = city(), s1 = shiftAt(m), st = state(c.lat, s1), d = declAt(m);
          stopT();
          if (anim) { const s0 = s; stopT = K.tween(s0, s1, 700, function (v) { s = v; map.draw(draw); }); } else { s = s1; map.draw(draw); }
          svg.querySelector(".pb-move").style.transform = "translateX(" + f1(s1 * 6.4) + "px)";
          svg.querySelector(".pb-secsun").setAttribute("transform", "translate(" + f1(X(d)) + " 0)");
          const sc = svg.querySelector(".pb-seccity");
          sc.setAttribute("transform", "translate(" + f1(X(c.lat)) + " 0)"); sc.setAttribute("class", "pb-seccity " + st.k);
          sc.querySelector("text").textContent = c.kr;
          el.querySelector(".pb-now").innerHTML = '<div class="pb-nt"><span class="pb-mon">' + MON[m] + '</span><span class="pb-cn">' + escHtml(c.kr) + ' <small>' + latTxt(c.lat) + '</small></span></div>' +
            '<div class="pb-state ' + st.k + '"><span class="pb-ico" aria-hidden="true">' + st.ico + '</span><div><b>' + st.n + '</b><span>' + st.air + ' → ' + st.w + '</span></div></div>' +
            '<div class="pb-verdict ' + (st.wet ? "wet" : "dry") + '">' + (st.wet === 2 ? (zone === "A" ? "우기" : "비가 많은 때") : st.wet ? "비가 오는 때" : (zone === "A" ? "건기" : "건조한 때")) + '<small>이달 강수량 ' + Math.round(c.p[m]) + 'mm</small></div>';
          el.querySelector(".pb-rain").innerHTML = '<div class="pb-rt">' + escHtml(c.kr) + ' 월 강수량 (연 ' + Math.round(c.p.reduce(function (a, b) { return a + b; }, 0)).toLocaleString() + 'mm)</div>' + bars(c, m);
          el.setAttribute("data-state", st.k);
        }
        el.querySelector('[data-seg="pbc"]').addEventListener("click", function (e) {
          const b = e.target.closest(".p4-sb"); if (!b) return;
          this.querySelectorAll(".p4-sb").forEach(function (x) { x.classList.toggle("on", x === b); });
          ci = +b.dataset.i; paint(false);
        });
        const pl = Anim.player(el.querySelector(".pb-play"), { steps: MON, interval: 1500, loop: true, start: 0, onStep: function (k) { const first = m === k && s === shiftAt(0); m = k; paint(!first); } });
        return function () { pl.pause(); stopT(); };
      }
    };
  }
  return { block: block, state: state, shiftAt: shiftAt, declAt: declAt, ZONE: ZONE };
})();
