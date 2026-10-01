/* ============================================================
   지오엑스-세계의 기후 — chapters/part1-sims.js
   PART 1 시뮬레이터 (2026-09-30) — chapters/part1.js의 블록 사이에 끼워 넣음 (P2F.kit 부품 사용 → part2-sims.js 다음에 불러옴)
   ① 1-1 30년 평균 만들기 (평균 기간을 바꾸면 값이 얼마나 흔들리는가)
   ② 1-2 경선 따라 걷기 (한 경도를 따라 북극 → 남극, 지나는 기후대 기록)
   ============================================================ */
"use strict";

(function () {
  const K = P2F.kit;
  const clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  const r1 = function (v) { return Math.round(v * 10) / 10; };
  const deg = function (v) { return (v < 0 ? "−" : "") + Math.abs(r1(v)).toFixed(1) + "℃"; };
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
  function insertAfter(ch, title, block) {
    const bl = CHAPTER_CONTENT[ch].blocks, i = bl.findIndex(function (b) { return b.title === title; });
    bl.splice(i < 0 ? 1 : i + 1, 0, block);
  }

  /* ==========================================================
     ① 1-1 30년 평균 만들기
     ========================================================== */
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  const YEARS = (function () {                     // 60해의 1월 평균 기온 (예시 값) — 앞 30해 평균 = 서울 1월 평년값
    const R = rng(1991), T0 = CITY_BY_ID.Seoul.t[0], a = [];
    for (let k = 0; k < 60; k++) { let g = 0; for (let j = 0; j < 4; j++) g += R(); a.push(T0 + (g - 2) * 3.2); }
    const m = a.slice(0, 30).reduce(function (x, y) { return x + y; }, 0) / 30;
    return a.map(function (v) { return v - m + T0; });
  })();
  const WINS = [1, 5, 10, 30];
  function avgBlock() {
    const W = 900, H = 440, L = 50, R = 16, T = 18, B = 34, lo = -9, hi = 5;
    const cw = (W - L - R) / 60, x = function (i) { return L + i * cw; }, y = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
    let s = '<svg class="p2-svg av-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="해마다의 1월 평균 기온">';
    for (let v = -8; v <= 4; v += 4) s += '<line class="p2-grid' + (v === 0 ? " zero" : "") + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="p2-ax" x="' + (L - 6) + '" y="' + (y(v) + 5) + '" text-anchor="end">' + (v < 0 ? "−" + -v : v) + '</text>';
    s += '<text class="p2-unit" x="' + (L - 6) + '" y="' + (T - 4) + '" text-anchor="end">℃</text>';
    YEARS.forEach(function (v, i) { s += '<rect class="av-bar" data-i="' + i + '" x="' + (x(i) + cw * .15).toFixed(1) + '" y="' + Math.min(y(0), y(v)).toFixed(1) + '" width="' + (cw * .7).toFixed(1) + '" height="' + Math.abs(y(v) - y(0)).toFixed(1) + '"/>'; });
    [1, 10, 20, 30, 40, 50, 60].forEach(function (k) { s += '<text class="p2-ax" x="' + (x(k - 1) + cw / 2) + '" y="' + (H - 10) + '" text-anchor="middle">' + k + (k === 60 ? "해째" : "") + '</text>'; });
    s += '<g class="av-wins"></g><polyline class="av-cum" points=""/><line class="av-now" y1="' + T + '" y2="' + (H - B) + '"/></svg>';
    return {
      title: "시뮬레이터 — 30년 평균 만들기",
      html: '<div class="av-ctl"><div class="av-play"></div><div class="ed-grp"><span>평균 기간</span>' + seg("win", ["1년", "5년", "10년", "30년"], 3) + '</div></div>' +
        '<div class="p2-row av-read"></div>' +
        '<div class="av-main"><div class="p2-figwrap av-fig">' + s + '</div>' +
          '<div class="av-side"><div class="av-st">평균 기간별 구간 평균 — 점이 모일수록 안정된 값</div><div class="av-dots"></div><div class="av-cap"></div></div></div>' +
        K.cap("막대 = 해마다의 1월 평균 기온(예시 값) · 빨간 선 = 지금까지의 누적 평균 · 파란 칸 = 평균 기간으로 나눈 구간 — 기간이 길수록 구간 평균이 거의 같아짐"),
      init: function (el) {
        const svg = el.querySelector(".av-svg");
        let n = 60, w = 30;
        function mean(a) { return a.reduce(function (p, q) { return p + q; }, 0) / a.length; }
        function paint() {
          svg.querySelectorAll(".av-bar").forEach(function (b, i) { b.classList.toggle("off", i >= n); b.classList.toggle("cold", YEARS[i] < 0); });
          let pts = "", acc = 0;
          for (let i = 0; i < n; i++) { acc += YEARS[i]; pts += (x(i) + cw / 2).toFixed(1) + "," + y(acc / (i + 1)).toFixed(1) + " "; }
          svg.querySelector(".av-cum").setAttribute("points", pts);
          const X = x(n - 1) + cw / 2; svg.querySelector(".av-now").setAttribute("x1", X); svg.querySelector(".av-now").setAttribute("x2", X);
          const groups = [];
          for (let i = 0; i + w <= n; i += w) groups.push([i, mean(YEARS.slice(i, i + w))]);
          svg.querySelector(".av-wins").innerHTML = groups.map(function (g, k) {
            return '<rect class="av-win' + (k % 2 ? " b" : "") + '" x="' + x(g[0]).toFixed(1) + '" y="' + T + '" width="' + (w * cw).toFixed(1) + '" height="' + (H - T - B) + '"/>' +
              '<line class="av-wm" x1="' + x(g[0]).toFixed(1) + '" x2="' + x(g[0] + w).toFixed(1) + '" y1="' + y(g[1]).toFixed(1) + '" y2="' + y(g[1]).toFixed(1) + '"/>';
          }).join("");
          const vals = groups.map(function (g) { return g[1]; }), spread = vals.length > 1 ? Math.max.apply(null, vals) - Math.min.apply(null, vals) : 0;
          const DW = 320, DH = 300, dx = function (v) { return 64 + (v - lo) / (hi - lo) * (DW - 80); }, T0 = mean(YEARS.slice(0, 30));
          let d = '<svg class="p2-svg" viewBox="0 0 ' + DW + ' ' + DH + '" role="img" aria-label="평균 기간별 구간 평균의 퍼짐">' +
            [-8, -4, 0, 4].map(function (v) { return '<line class="p2-grid" x1="' + dx(v) + '" x2="' + dx(v) + '" y1="14" y2="' + (DH - 30) + '"/><text class="p2-ax" x="' + dx(v) + '" y="' + (DH - 10) + '" text-anchor="middle">' + (v < 0 ? "−" + -v : v) + '℃</text>'; }).join("") +
            '<line class="av-t0" x1="' + dx(T0) + '" x2="' + dx(T0) + '" y1="10" y2="' + (DH - 26) + '"/>';
          WINS.forEach(function (ww, r) {
            const cy = 44 + r * 64, gv = [];
            for (let i = 0; i + ww <= n; i += ww) gv.push(mean(YEARS.slice(i, i + ww)));
            const mn = gv.length ? Math.min.apply(null, gv) : 0, mx = gv.length ? Math.max.apply(null, gv) : 0;
            d += '<g class="av-row' + (ww === w ? " on" : "") + '"><rect x="4" y="' + (cy - 26) + '" width="' + (DW - 8) + '" height="52" rx="10"/>' +
              '<text class="av-rl" x="14" y="' + (cy + 5) + '">' + ww + '년</text>' +
              (gv.length > 1 ? '<line class="av-rng" x1="' + dx(mn) + '" x2="' + dx(mx) + '" y1="' + cy + '" y2="' + cy + '"/>' : "") +
              gv.map(function (v, k) { return '<circle class="av-dot" cx="' + dx(v).toFixed(1) + '" cy="' + (cy + ((k % 3) - 1) * 7) + '" r="' + (ww === 1 ? 4 : 6) + '"/>'; }).join("") + '</g>';
          });
          el.querySelector(".av-dots").innerHTML = d + '</svg>';
          el.querySelector(".av-cap").innerHTML = vals.length ? "구간 " + vals.length + "개 · 가장 높은 값과 낮은 값의 차 <b>" + r1(spread).toFixed(1) + "℃</b>" : "아직 구간이 없음 — 해를 더 모으기";
          el.querySelector(".av-read").innerHTML = big("모은 해", n + "해", "") + big("누적 평균", deg(mean(YEARS.slice(0, n))), "", "key") +
            big(w + "년 평균의 흔들림", vals.length > 1 ? r1(spread).toFixed(1) + "℃" : "—", w >= 30 ? "거의 변하지 않음 = 기후" : w === 1 ? "해마다 크게 다름 = 날씨에 가까움" : "", "rain");
        }
        bindSeg(el, "win", function (i) { w = WINS[i]; paint(); });
        const pl = Anim.player(el.querySelector(".av-play"), { steps: ["1해", "5해", "10해", "20해", "30해", "60해"], interval: 1500, start: 5,
          onStep: function (k) { n = [1, 5, 10, 20, 30, 60][k]; paint(); } });
        return function () { pl.pause(); };
      }
    };
  }

  /* ==========================================================
     ② 1-2 경선 따라 걷기
     ========================================================== */
  const MERID = [["아프리카 · 유럽 20°E", 20], ["동아시아 · 오스트레일리아 125°E", 125], ["아메리카 70°W", -70], ["북아메리카 서부 115°W", -115]];
  function meridianBlock() {
    return {
      title: "시뮬레이터 — 경선 따라 걷기",
      html: '<div class="ed-ctl">' + seg("mer", MERID.map(function (m) { return m[0]; }), 0) + '</div>' +
        '<div class="av-ctl"><div class="p2-slider mw-sl"><label for="mw-lat">위도</label><input type="range" id="mw-lat" min="-60" max="80" step="0.5" value="80"><span class="p2-sl-v"></span></div>' +
          '<button type="button" class="anim-btn mw-play">▶ 북 → 남으로 걷기</button></div>' +
        '<div class="p2-row mw-read"></div>' +
        '<div class="mw-main"><div class="p2-mapbox mw-map" data-map="mw"></div><div class="mw-strip"><div class="mw-st">지나는 기후대 (위 = 북)</div><div class="mw-bar"></div></div><div class="mw-log"><div class="mw-st">지나온 순서</div><div class="mw-seq"></div></div></div>' +
        K.cap("한 경도를 따라 북쪽에서 남쪽으로 — 기후대가 위도를 따라 바뀜(띠 모양) · 같은 순서라도 대륙 모양에 따라 폭이 다름 · 회색 = 바다"),
      init: function (el) {
        const inp = el.querySelector("#mw-lat");
        let lon = 20, lat = 80, run = false;
        const m = K.makeMap(el.querySelector('[data-map="mw"]'), { legend: true, info: false, view: [-180, 82, 180, -62], latLines: true }, draw);
        function zoneAt(lo, la) { const c = WorldMap.codeAt(lo, la); return c ? c.charAt(0) : ""; }
        function draw(u) {
          return '<line class="mw-line" x1="' + lon + '" x2="' + lon + '" y1="-82" y2="62" stroke-width="' + (0.5 * u).toFixed(2) + '"/>' +
            '<line class="mw-done" x1="' + lon + '" x2="' + lon + '" y1="-80" y2="' + (-lat) + '" stroke-width="' + (0.9 * u).toFixed(2) + '"/>' +
            '<circle class="mw-pin" cx="' + lon + '" cy="' + (-lat) + '" r="' + (1.8 * u).toFixed(2) + '" stroke-width="' + (0.6 * u).toFixed(2) + '"/>';
        }
        function strip() {
          let h = "";
          for (let la = 80; la >= -60; la -= 1) { const z = zoneAt(lon, la); h += '<i style="background:' + (z ? ZONES[z].color : "#d9e4f0") + '" title="' + la + '°"></i>'; }
          el.querySelector(".mw-bar").innerHTML = h + '<b class="mw-mk"></b>';
        }
        function seq() {
          const out = []; let prev = null;
          const runs = [];
          for (let la = 80; la >= lat; la -= 0.5) { const z = zoneAt(lon, la) || "~"; const r = runs[runs.length - 1]; if (r && r[0] === z) r[2] = la; else runs.push([z, la, la]); }
          runs.forEach(function (r, k) {                 // 2°보다 짧게 스치는 구간(섬 · 해안선 조각)은 건너뜀 — 지금 있는 곳은 항상 표시
            if (r[1] - r[2] < 2 && k < runs.length - 1) return;
            if (prev === r[0]) return;
            out.push([r[0], r[1]]); prev = r[0];
          });
          el.querySelector(".mw-seq").innerHTML = out.map(function (o) {
            return o[0] === "~" ? '<span class="mw-sea">바다</span>' : '<span class="mw-z" style="--zc:' + ZONES[o[0]].color + '"><b>' + o[0] + '</b>' + ZONES[o[0]].name + '<small>' + Math.round(o[1]) + '°</small></span>';
          }).join('<i>→</i>');
        }
        function set(v) {
          lat = clamp(v, -60, 80); inp.value = lat;
          el.querySelector(".p2-sl-v").textContent = Math.abs(lat).toFixed(1) + "°" + (lat >= 0 ? "N" : "S");
          m.draw(draw);
          el.querySelector(".mw-mk").style.top = ((80 - lat) / 140 * 100).toFixed(2) + "%";
          const c = WorldMap.codeAt(lon, lat), z = c ? c.charAt(0) : "";
          el.querySelector(".mw-read").innerHTML = big("위치", Math.abs(lat).toFixed(1) + "°" + (lat >= 0 ? "N" : "S") + " · " + Math.abs(lon) + "°" + (lon >= 0 ? "E" : "W"), "") +
            big("지금 지나는 곳", z ? z + " " + ZONES[z].name : "바다", c ? c + " " + (Koppen.NAMES[c] || "") : "", z ? "key" : "") +
            big("위도대", Math.abs(lat) < 23.5 ? "저위도" : Math.abs(lat) < 66.5 ? "중위도" : "고위도", "");
          seq();
        }
        bindSeg(el, "mer", function (i) { lon = MERID[i][1]; strip(); set(80); });
        inp.addEventListener("input", function () { run = false; syncBtn(); set(+inp.value); });
        const btn = el.querySelector(".mw-play");
        function syncBtn() { btn.classList.toggle("on", run); btn.textContent = run ? "⏸ 멈춤" : "▶ 북 → 남으로 걷기"; }
        btn.addEventListener("click", function () { run = !run; if (run && lat <= -59.5) set(80); syncBtn(); });
        strip(); set(80);
        if (REDUCED) return function () {};
        let last = performance.now(), on = true;
        (function tick(now) {
          if (!on || !inp.isConnected) return;
          const dt = Math.min(0.1, (now - last) / 1000); last = now;
          if (run) { set(lat - dt * 9); if (lat <= -60) { run = false; syncBtn(); } }
          requestAnimationFrame(tick);
        })(last);
        return function () { on = false; };
      }
    };
  }

  insertAfter("1-1", "날씨가 모여 기후가 됨", avgBlock());
  insertAfter("1-2", "세계 기후 지도", meridianBlock());
})();
