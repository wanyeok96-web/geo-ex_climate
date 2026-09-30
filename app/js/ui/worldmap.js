/* ============================================================
   지오엑스-세계의 기후 — ui/worldmap.js
   쾨펜 세계 지도 (공용 부품) — 1-2·1-3, 이후 PART 5 분포 지도·PART 6 도시 지도
   - 기후 분류 격자(data/koppen-map.js)를 캔버스로 칠한 그림 + 육지 윤곽으로 잘라 냄 + 국경·위도선·도시 점(SVG)
   - 범례 누르기 → 그 기후대만 진하게 / 다시 누르면 전체
   - 지도 누르기 → 「온대 기후 (C)」 말풍선, 또는 onPick(기후대)로 넘김(함께 풀기 지도 문제)
   - 고산(H)은 격자 분류에 없음 → 고산 도시 점으로 표시, 범례 H를 누르면 그 점들 강조
   사용: WorldMap.create(요소, { view, latLines, latToggle, legend, allKey(범례 「전체」), cities, info, onPick })
   ============================================================ */
"use strict";

const WorldMap = (function () {
  const M = KOPPEN_MAP;
  const ZONE_ORDER = ["A", "B", "C", "D", "E", "H"];
  const LAT_LINES = [
    { lat: 60, name: "60°N", cls: "l60" }, { lat: 30, name: "30°N", cls: "l30" },
    { lat: 23.44, name: "북회귀선 23.5°N", cls: "ltrop" }, { lat: 0, name: "적도 0°", cls: "leq" },
    { lat: -23.44, name: "남회귀선 23.5°S", cls: "ltrop" }, { lat: -30, name: "30°S", cls: "l30" },
    { lat: -60, name: "60°S", cls: "l60" }
  ];
  /* 지역 확대 버튼 (opts.regions) — [서쪽 경도, 북쪽 위도, 동쪽 경도, 남쪽 위도] */
  const REGIONS = [
    ["세계", [-180, 85, 180, -60]], ["아시아", [25, 62, 150, -12]], ["유럽", [-25, 72, 45, 33]],
    ["아프리카", [-22, 38, 55, -36]], ["북아메리카", [-170, 75, -50, 5]], ["남아메리카", [-90, 15, -30, -56]],
    ["오세아니아", [108, 2, 180, -48]], ["한반도", [120.5, 44, 133.5, 32.5]]
  ];
  const HIGHLAND = ["Quito", "Bogota", "La_Paz", "Cusco", "Addis_Ababa", "Mexico_City"];
  let seq = 0;

  /* ---------- 격자 풀기 (한 번만) ---------- */
  let grid = null;
  function decode() {
    if (grid) return grid;
    grid = new Uint8Array(M.w * M.h);
    M.grid.split(";").forEach(function (row, i) {
      let j = 0;
      row.split(",").forEach(function (run) {
        const v = run.charCodeAt(0) - 65, n = parseInt(run.slice(1), 36);
        grid.fill(v, i * M.w + j, i * M.w + j + n);
        j += n;
      });
    });
    return grid;
  }
  function codeAt(lon, lat) {
    const i = Math.floor((M.north - lat) / M.res), j = Math.floor((lon - M.west) / M.res);
    if (i < 0 || i >= M.h || j < 0 || j >= M.w) return "";
    return M.codes[decode()[i * M.w + j]];
  }

  /* ---------- 칠한 그림 (강조 상태별로 한 번만 만들어 둠) ---------- */
  const imgCache = {};
  function hexRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  /* 세부 유형 색 (PART 5 분포 지도 — 한 기후대 안의 유형 구분) */
  const SUB_COLORS = {
    Af: "#a61e1e", Am: "#e03131", Aw: "#f28b8b",           /* 열대 — 빨강 계열 */
    BW: "#d49200", BS: "#f7cf45",                          /* 건조 — 노랑 계열 */
    Cfa: "#2f6b0f", Cfb: "#9bd65b", Cs: "#d2d62a", Cw: "#62a822",   /* 온대 — 연두 계열 */
    Df: "#1c46a8", Dw: "#7aa6f0",                          /* 냉대 — 파랑 계열 */
    ET: "#7a45c0", EF: "#c2a6ee"                           /* 한대 — 보라 계열 */
  };
  function image(focus, sub) {
    const key = (sub ? "sub:" : "") + (focus || "all");
    if (imgCache[key]) return imgCache[key];
    const g = decode();
    const cv = document.createElement("canvas");
    cv.width = M.w; cv.height = M.h;
    const ctx = cv.getContext("2d");
    const im = ctx.createImageData(M.w, M.h);
    const pal = M.codes.map(function (c) {
      if (!c) return null;
      const z = c.charAt(0), rgb = hexRgb(ZONES[z].color);
      if (focus && focus !== z) return rgb.map(function (v) { return Math.round(v + (255 - v) * (sub ? 0.86 : 0.8)); });
      if (sub && SUB_COLORS[c]) return hexRgb(SUB_COLORS[c]);
      return rgb;
    });
    for (let k = 0; k < g.length; k++) {
      const c = pal[g[k]];
      if (!c) continue;
      im.data[k * 4] = c[0]; im.data[k * 4 + 1] = c[1]; im.data[k * 4 + 2] = c[2]; im.data[k * 4 + 3] = 255;
    }
    ctx.putImageData(im, 0, 0);
    imgCache[key] = cv.toDataURL("image/png");
    return imgCache[key];
  }

  function zoneName(z) { return ZONES[z].name + " 기후"; }

  /* 육지 윤곽·국경 경로는 문서에 한 번만 두고 지도마다 <use>로 가져다 씀 */
  let landEl = null;
  function ensureDefs() {
    if (landEl) return landEl;
    const holder = document.createElement("div");
    holder.innerHTML = '<svg class="wm-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
      '<path id="wm-land-path" d="' + M.land + '"/><path id="wm-borders-path" d="' + M.borders + '"/></defs></svg>';
    const svgEl = holder.firstChild;
    document.body.appendChild(svgEl);
    landEl = svgEl.querySelector("#wm-land-path");
    return landEl;
  }

  /* ---------- 지도 만들기 ---------- */
  function create(host, opts) {
    opts = opts || {};
    const id = "wm" + (++seq);
    const landPath = ensureDefs();
    const v = opts.view || [-180, 85, 180, -60];     // [서쪽 경도, 북쪽 위도, 동쪽 경도, 남쪽 위도]
    const vb = { x: v[0], y: -v[1], w: v[2] - v[0], h: v[1] - v[3] };
    const cities = (opts.cities || []).map(function (c) { return typeof c === "string" ? { id: c } : c; });
    if (opts.highland) HIGHLAND.forEach(function (hid) { cities.push({ id: hid, highland: true, noLabel: true }); });

    let latSvg = "";
    LAT_LINES.forEach(function (l) {                    // 확대·이동에 대비해 위도선은 경도 전체에 긋고 글자 위치만 맞춤
      latSvg += '<line class="wm-lat ' + l.cls + '" x1="-180" x2="180" y1="' + (-l.lat) + '" y2="' + (-l.lat) + '"/>' +
        '<text class="wm-lat-t ' + l.cls + '" data-lat="' + l.lat + '" text-anchor="end">' + l.name + '</text>';
    });

    let citySvg = "";
    cities.forEach(function (c) {
      const d = CITY_BY_ID[c.id];
      if (!d) return;
      citySvg += '<g class="wm-city' + (c.highland ? " hl" : "") + (c.emph ? " emph" : "") + (c.noLabel ? " nolabel" : "") + (c.color ? " dot" : "") + '" data-city="' + c.id + '">' +
        '<circle cx="' + d.lon + '" cy="' + (-d.lat) + '"' + (c.color ? ' style="fill:' + c.color + '"' : "") + '/>' +
        '<text>' + escHtml(c.label || d.kr) + '</text></g>';
    });

    let legend = "";
    if (opts.legend !== false) {
      if (opts.allKey) legend += '<button type="button" class="wm-key wm-all on" data-zone="">전체</button>';
      ZONE_ORDER.forEach(function (z) {
        legend += '<button type="button" class="wm-key" data-zone="' + z + '" style="--zc:' + ZONES[z].color + '">' +
          '<i></i><b>' + z + '</b>' + ZONES[z].name + '</button>';
      });
      if (opts.latToggle) legend += '<button type="button" class="wm-key wm-lat-btn" aria-pressed="false">위도선</button>';
    }
    if (opts.subtypes && opts.focus) {                 // 세부 유형 범례 (누르지 않는 표시)
      legend = Object.keys(SUB_COLORS).filter(function (c) { return c.charAt(0) === opts.focus; }).map(function (c) {
        return '<span class="wm-key sub" style="--zc:' + SUB_COLORS[c] + '"><i></i><b>' + c + '</b>' +
          (typeof Koppen !== "undefined" ? Koppen.NAMES[c] : "") + '</span>';
      }).join("") + (opts.latToggle ? '<button type="button" class="wm-key wm-lat-btn" aria-pressed="false">위도선</button>' : "");
    }

    host.innerHTML =
      '<div class="wm" id="' + id + '">' +
        '<div class="wm-stage">' +
          '<svg class="wm-svg" viewBox="' + vb.x + " " + vb.y + " " + vb.w + " " + vb.h + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="쾨펜 세계 기후 지도">' +
            '<defs><clipPath id="' + id + '-clip"><use href="#wm-land-path"/></clipPath></defs>' +
            '<rect class="wm-sea" x="-180" y="-90" width="360" height="180"/>' +
            '<image class="wm-img" href="' + image(null, !!opts.subtypes) + '" x="-180" y="-90" width="360" height="180" preserveAspectRatio="none" clip-path="url(#' + id + '-clip)"/>' +
            '<use class="wm-borders" href="#wm-borders-path"/>' +
            '<use class="wm-coast" href="#wm-land-path"/>' +
            '<g class="wm-lats">' + latSvg + '</g>' +
            '<g class="wm-cities">' + citySvg + '</g>' +
          '</svg>' +
          '<div class="wm-tip" hidden></div>' +
        '</div>' +
        (opts.regions ? '<div class="wm-regions" role="group" aria-label="지역 확대">' + REGIONS.map(function (r, i) {
          return '<button type="button" class="wm-reg' + (i === 0 ? " on" : "") + '" data-reg="' + i + '">' + r[0] + '</button>'; }).join("") + '</div>' : "") +
        (legend ? '<div class="wm-legend">' + legend + '</div>' : "") +
        '<div class="wm-src">기후 자료 Beck et al.(2023) 1991~2020년, CC BY 4.0 · 지도 Natural Earth</div>' +
      '</div>';

    const root = host.firstChild;
    const svg = root.querySelector("svg");
    if (vb.w < 60) root.classList.add("wm-smooth");        // 좁은 지역 확대: 격자 경계를 부드럽게
    const img = root.querySelector(".wm-img");
    const tip = root.querySelector(".wm-tip");
    const api = { root: root, focus: null };

    api.highlight = function (z) {
      api.focus = z || null;
      img.setAttribute("href", image(z && z !== "H" ? z : null, !!opts.subtypes));
      root.classList.toggle("focus-h", z === "H");
      root.classList.toggle("focused", !!z);
      root.querySelectorAll(".wm-key[data-zone]").forEach(function (b) {
        const on = (b.getAttribute("data-zone") || null) === (z || null);   // 「전체」(data-zone 빈 값)는 강조 없음일 때 켜짐
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", String(on));
      });
    };
    api.setLatLines = function (on) {
      root.classList.toggle("lat-on", !!on);
      const b = root.querySelector(".wm-lat-btn");
      if (b) { b.classList.toggle("on", !!on); b.setAttribute("aria-pressed", String(!!on)); }
    };
    api.showTip = function (html, x, y) {
      const r = root.querySelector(".wm-stage").getBoundingClientRect();
      tip.innerHTML = html;
      tip.hidden = false;
      tip.style.left = Math.max(8, Math.min(r.width - 8, x - r.left)) + "px";
      tip.style.top = (y - r.top) + "px";
    };
    api.hideTip = function () { tip.hidden = true; };

    /* 지역 확대 — 보기 범위를 0.6초 동안 부드럽게 바꿈 */
    let zoomRaf = 0;
    api.zoomTo = function (view, ms) {
      const from = { x: vb.x, y: vb.y, w: vb.w, h: vb.h };
      const to = { x: view[0], y: -view[1], w: view[2] - view[0], h: view[1] - view[3] };
      const dur = REDUCED ? 0 : (ms == null ? 600 : ms), t0 = performance.now();
      cancelAnimationFrame(zoomRaf);
      (function step(now) {
        const t = dur ? Math.min(1, (now - t0) / dur) : 1, e2 = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        ["x", "y", "w", "h"].forEach(function (k) { vb[k] = from[k] + (to[k] - from[k]) * e2; });
        svg.setAttribute("viewBox", vb.x + " " + vb.y + " " + vb.w + " " + vb.h);
        root.classList.toggle("wm-smooth", vb.w < 60);
        layout();
        if (t < 1) zoomRaf = requestAnimationFrame(step);
      })(t0);
    };

    root.addEventListener("click", function (e) {
      const reg = e.target.closest(".wm-reg");
      if (reg) {
        root.querySelectorAll(".wm-reg").forEach(function (b) { b.classList.toggle("on", b === reg); });
        api.zoomTo(REGIONS[+reg.getAttribute("data-reg")][1]);
        return;
      }
      const key = e.target.closest(".wm-key");
      if (key) {
        if (key.classList.contains("wm-lat-btn")) api.setLatLines(!root.classList.contains("lat-on"));
        else { const z = key.getAttribute("data-zone") || null; api.highlight(!z || api.focus === z ? null : z); }
        return;
      }
      if (!e.target.closest(".wm-svg")) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const m = svg.getScreenCTM();
      if (!m) return;
      const q = pt.matrixTransform(m.inverse());
      const lon = q.x, lat = -q.y;
      const cityEl = e.target.closest(".wm-city");
      const onLand = landPath.isPointInFill ? landPath.isPointInFill(new DOMPoint(q.x, q.y)) : true;
      let zone = "", code = "";
      if (cityEl && CITY_BY_ID[cityEl.getAttribute("data-city")].type === "H") zone = "H";
      else if (onLand) { code = codeAt(lon, lat); zone = code ? code.charAt(0) : ""; }
      if (cityEl && opts.onCity) { opts.onCity(cityEl.getAttribute("data-city"), api); return; }
      if (opts.onPick) { opts.onPick({ zone: zone, code: code, lon: lon, lat: lat, x: e.clientX, y: e.clientY }, api); return; }
      if (opts.info === false) return;
      if (!zone) { api.hideTip(); return; }
      const cityName = cityEl ? CITY_BY_ID[cityEl.getAttribute("data-city")].kr + " · " : "";
      const subTxt = opts.subtypes && code && typeof Koppen !== "undefined" ? Koppen.NAMES[code] + " (" + code + ")" : zoneName(zone) + " (" + zone + ")";
      api.showTip('<i style="background:' + (opts.subtypes && SUB_COLORS[code] ? SUB_COLORS[code] : ZONES[zone].color) + '"></i>' + escHtml(cityName) + subTxt, e.clientX, e.clientY);
    });

    /* 글자·점은 화면 픽셀 기준 크기로 — 지도 확대 비율(s)에 맞춰 다시 계산 */
    function layout() {
      const W = svg.clientWidth, H = svg.clientHeight;
      if (!W || !H) return;
      const sc = Math.min(W / vb.w, H / vb.h);
      root.querySelectorAll(".wm-lat-t").forEach(function (t) {
        t.setAttribute("font-size", 15 / sc);
        t.setAttribute("x", vb.x + vb.w - 8 / sc);
        t.setAttribute("y", -(+t.getAttribute("data-lat")) - 5 / sc);
      });
      root.querySelectorAll(".wm-city").forEach(function (g) {
        const d = CITY_BY_ID[g.getAttribute("data-city")];
        const emph = g.classList.contains("emph") || g.classList.contains("sel");
        const r = (emph ? 8 : g.classList.contains("dot") ? 5 : 5.5) / sc, f = (emph ? 24 : 18) / sc;
        g.querySelector("circle").setAttribute("r", r);
        const t = g.querySelector("text");
        if (t) { t.setAttribute("font-size", f); t.setAttribute("x", d.lon + r * 1.7); t.setAttribute("y", -d.lat + f * 0.36); t.style.strokeWidth = (4 / sc) + "px"; }
      });
      root.querySelectorAll(".wm-lat-t").forEach(function (t) { t.style.strokeWidth = (3 / sc) + "px"; });
      /* 도시 이름 겹침 피하기 — 앞 이름과 겹치면 점의 왼쪽으로 옮김 */
      const placed = [];
      root.querySelectorAll(".wm-city:not(.nolabel) text, .wm-city.sel text").forEach(function (t) {
        let b;
        try { b = t.getBBox(); } catch (e) { return; }
        const hit = function (bb) { return placed.some(function (p) { return bb.x < p.x + p.width && bb.x + bb.width > p.x && bb.y < p.y + p.height && bb.y + bb.height > p.y; }); };
        if (hit(b)) {
          const g = t.parentNode, d = CITY_BY_ID[g.getAttribute("data-city")], r = +g.querySelector("circle").getAttribute("r");
          t.setAttribute("x", d.lon - r * 1.7);
          t.setAttribute("text-anchor", "end");
          try { b = t.getBBox(); } catch (e) { /* 그대로 */ }
        } else t.removeAttribute("text-anchor");
        placed.push(b);
      });
    }
    api.layout = layout;
    /* 도시 하나 선택 표시 (PART 6 도시 지도) — 여러 개면 배열 */
    api.select = function (ids) {
      ids = [].concat(ids || []);
      root.querySelectorAll(".wm-city").forEach(function (g) { g.classList.toggle("sel", ids.indexOf(g.getAttribute("data-city")) >= 0); });
      const cities = root.querySelector(".wm-cities");
      root.querySelectorAll(".wm-city.sel").forEach(function (g) { cities.appendChild(g); });   // 선택한 점을 맨 위로
      layout();
    };
    if ("ResizeObserver" in window) new ResizeObserver(layout).observe(svg);
    requestAnimationFrame(layout);
    if (opts.latLines) api.setLatLines(true);
    if (opts.focus) api.highlight(opts.focus);
    return api;
  }

  return { REGIONS: REGIONS, SUB_COLORS: SUB_COLORS, create: create, codeAt: codeAt, zoneName: zoneName, HIGHLAND: HIGHLAND };
})();
