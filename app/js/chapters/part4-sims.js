/* ============================================================
   지오엑스-세계의 기후 — chapters/part4-sims.js
   PART 4 시뮬레이터 (2026-09-30) — chapters/part4.js 다음에 불러와 블록을 끼워 넣음
   ① 4-1 내가 만드는 기후 그래프 (점·막대 끌기 → 실시간 판별)
   ② 4-2 판별 흐름 따라가기 (도시 카드가 순서도를 통과)
   ③ 4-2 경계 기준 실험실 (경계값을 바꾸면 세계 도시의 기후대가 바뀜)
   ④ 4-2 경계 도시 찾기 (기준선 가까이 있는 도시)
   ⑤ 4-3 기호 보고 그래프 고르기
   ============================================================ */
"use strict";

(function () {
  const C = function (id) { return CITY_BY_ID[id]; };
  const NS = "http://www.w3.org/2000/svg";
  const sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
  const r1 = function (v) { return Math.round(v * 10) / 10; };
  const deg = function (v) { return (v < 0 ? "−" + r1(-v).toFixed(1) : r1(v).toFixed(1)) + "℃"; };
  const mm = function (v) { return Math.round(v).toLocaleString("ko-KR") + "mm"; };
  const clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  const latTxt = function (c) { return Math.abs(c.lat).toFixed(1) + "°" + (c.lat >= 0 ? "N" : "S"); };
  const zc = function (z) { return ZONES[z] ? ZONES[z].color : "#8a8f98"; };
  function pts(list, cls) { return '<ul class="pts' + (cls ? " " + cls : "") + '">' + list.map(function (t) { return "<li>" + fmtKo(t) + "</li>"; }).join("") + "</ul>"; }
  function seg(name, items, on) {
    return '<div class="p4-seg" role="group" data-seg="' + name + '">' + items.map(function (it, i) {
      return '<button type="button" class="p4-sb' + (i === on ? " on" : "") + '" data-i="' + i + '">' + it + '</button>'; }).join("") + '</div>';
  }
  function bindSeg(el, name, fn) {
    const g = el.querySelector('[data-seg="' + name + '"]');
    g.addEventListener("click", function (e) {
      const b = e.target.closest(".p4-sb"); if (!b) return;
      g.querySelectorAll(".p4-sb").forEach(function (x) { x.classList.toggle("on", x === b); });
      fn(+b.getAttribute("data-i"));
    });
  }
  function insertAfter(ch, title, block) {
    const bl = CHAPTER_CONTENT[ch].blocks;
    const i = bl.findIndex(function (b) { return b.title === title; });
    bl.splice(i < 0 ? bl.length : i + 1, 0, block);
  }
  const NON_H = CITIES.filter(function (c) { return c.type !== "H"; });

  /* ==========================================================
     ① 4-1 내가 만드는 기후 그래프
     ========================================================== */
  const ED_START = ["Seoul", "Rome", "Singapore", "Cairo", "Moscow", "Barrow"];
  const TARGETS = ["Af", "Aw", "BW", "Cs", "Cfb", "Dw", "ET"];
  function editorBlock() {
    const W = 760, H = 440, L = 64, R = 70, T = 30, B = 46, lo = -40, hi = 40, pTop = 500;
    const cw = (W - L - R) / 12;
    const yT = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
    const yP = function (v) { return H - B - v / pTop * (H - T - B); };
    const vT = function (y) { return hi - (y - T) / (H - T - B) * (hi - lo); };
    const vP = function (y) { return (H - B - y) / (H - T - B) * pTop; };
    const xM = function (m) { return L + m * cw + cw / 2; };
    function frame() {
      let s = '<svg class="ed-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="끌어서 만드는 기후 그래프">';
      for (let v = lo; v <= hi; v += 10) s += '<line class="cg-grid' + (v === 0 ? " zero" : "") + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + yT(v) + '" y2="' + yT(v) + '"/><text class="cg-tick t" x="' + (L - 10) + '" y="' + (yT(v) + 6) + '" text-anchor="end">' + (v < 0 ? "−" + -v : v) + '</text>';
      for (let k = 0; k <= 4; k++) s += '<text class="cg-tick p" x="' + (W - R + 10) + '" y="' + (yP(pTop / 4 * k) + 6) + '">' + pTop / 4 * k + '</text>';
      s += '<text class="cg-unit t" x="' + (L - 10) + '" y="' + (T - 12) + '" text-anchor="end">기온(℃)</text><text class="cg-unit p" x="' + (W - 4) + '" y="' + (T - 12) + '" text-anchor="end">강수량(mm)</text>';
      [[22, "22℃"], [18, "18℃"], [10, "10℃"], [-3, "−3℃"]].forEach(function (g) {
        s += '<g class="ed-guide"><line x1="' + L + '" x2="' + (W - R) + '" y1="' + yT(g[0]) + '" y2="' + yT(g[0]) + '"/><text x="' + (L + 6) + '" y="' + (yT(g[0]) - 5) + '">' + g[1] + '</text></g>';
      });
      s += '<g class="ed-bars"></g><polyline class="ed-line" points=""/><g class="ed-pts"></g>';
      for (let m = 0; m < 12; m++) s += '<text class="cg-axis-x ed-mon" x="' + xM(m) + '" y="' + (H - B + 26) + '" text-anchor="middle">' + (m + 1) + '</text>';
      s += '<line class="cg-base" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/>';
      return s + '<text class="cg-unit x" x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end">(월)</text></svg>';
    }
    return {
      title: "내가 만드는 기후 그래프",
      html: '<div class="ed-ctl">' +
          '<div class="ed-grp"><span>시작 그래프</span>' + seg("start", ED_START.map(function (id) { return escHtml(C(id).kr); }), 0) + '</div>' +
          '<div class="ed-grp"><span>반구</span>' + seg("hemi", ["북반구", "남반구"], 0) + '</div>' +
          '<div class="ed-grp"><span>목표 기후</span>' + seg("goal", ["없음"].concat(TARGETS), 0) + '</div>' +
        '</div>' +
        '<div class="ed-main"><div class="ed-fig">' + frame() + '<p class="ed-hint">점(기온)과 막대 끝(강수량)을 위아래로 끌기 · 누른 뒤 ↑↓ 키로도 조절</p></div>' +
          '<div class="ed-side"><div class="ed-res"></div><div class="ed-goal" hidden></div><div class="ed-stats"></div><ol class="ed-why"></ol></div></div>',
      init: function (el) {
        const svg = el.querySelector(".ed-svg");
        let city = { lat: 37.6, t: C("Seoul").t.slice(), p: C("Seoul").p.slice() }, goal = null, drag = null;
        function build() {
          let b = "", q = "";
          for (let m = 0; m < 12; m++) {
            b += '<g class="ed-b" data-m="' + m + '" tabindex="0" role="slider" aria-label="' + (m + 1) + '월 강수량"><rect class="ed-bar" x="' + (L + m * cw + cw * .17) + '" width="' + (cw * .66) + '" rx="3"/>' +
              '<rect class="ed-cap" x="' + (L + m * cw + cw * .1) + '" width="' + (cw * .8) + '" height="10" rx="5"/><rect class="ed-hit" x="' + (L + m * cw) + '" width="' + cw + '"/></g>';
            q += '<g class="ed-p" data-m="' + m + '" tabindex="0" role="slider" aria-label="' + (m + 1) + '월 기온"><circle class="ed-hitc" r="18"/><circle class="ed-dot" r="8"/></g>';
          }
          svg.querySelector(".ed-bars").innerHTML = b;
          svg.querySelector(".ed-pts").innerHTML = q;
        }
        function paint() {
          svg.querySelectorAll(".ed-b").forEach(function (g) {
            const m = +g.dataset.m, y = yP(city.p[m]);
            g.querySelector(".ed-bar").setAttribute("y", y.toFixed(1)); g.querySelector(".ed-bar").setAttribute("height", Math.max(0, H - B - y).toFixed(1));
            g.querySelector(".ed-cap").setAttribute("y", (y - 5).toFixed(1));
            g.querySelector(".ed-hit").setAttribute("y", (y - 16).toFixed(1)); g.querySelector(".ed-hit").setAttribute("height", Math.max(32, H - B - y + 16).toFixed(1));
            g.setAttribute("aria-valuenow", Math.round(city.p[m]));
          });
          svg.querySelectorAll(".ed-p").forEach(function (g) {
            const m = +g.dataset.m;
            g.setAttribute("transform", "translate(" + xM(m).toFixed(1) + " " + yT(city.t[m]).toFixed(1) + ")");
            g.setAttribute("aria-valuenow", r1(city.t[m]));
          });
          svg.querySelector(".ed-line").setAttribute("points", city.t.map(function (v, m) { return xM(m) + "," + yT(v).toFixed(1); }).join(" "));
          const j = Koppen.judge(city), st = j.stats;
          el.querySelector(".ed-res").innerHTML = '<span class="ed-code" style="--zc:' + zc(j.zone) + '">' + j.code + '</span><span class="ed-name">' + j.name + '</span>';
          el.querySelector(".ed-stats").innerHTML = [["최난월", (st.iMax + 1) + "월 " + deg(st.tmax)], ["최한월", (st.iMin + 1) + "월 " + deg(st.tmin)], ["연교차", deg(st.range)],
            ["연강수량", mm(st.pAnn)], ["최소우월", (st.iPmin + 1) + "월 " + mm(st.pmin)]].map(function (x) { return '<span><small>' + x[0] + '</small><b>' + x[1] + '</b></span>'; }).join("");
          el.querySelector(".ed-why").innerHTML = j.steps.map(function (s) {
            return '<li class="' + (s.ans ? "y" : "n") + '"><span class="q">' + fmtKo(s.q) + '</span><span class="v">' + fmtKo(s.v) + '</span><b>' + (s.ans ? "예" : "아니요") + (s.letter ? " → " + s.letter : "") + '</b></li>';
          }).join("");
          const gb = el.querySelector(".ed-goal");
          gb.hidden = !goal;
          if (goal) {
            const ok = j.code === goal;
            gb.className = "ed-goal" + (ok ? " ok" : "");
            gb.innerHTML = ok ? "🎉 목표 달성 — <b>" + goal + "</b> " + Koppen.NAMES[goal] : "목표 <b>" + goal + "</b> " + Koppen.NAMES[goal] + " — 지금은 " + j.code;
          }
        }
        function load(id) { const c = C(id); city = { lat: c.lat, t: c.t.slice(), p: c.p.slice() }; hemiSeg(); paint(); }
        function hemiSeg() { el.querySelectorAll('[data-seg="hemi"] .p4-sb').forEach(function (b, i) { b.classList.toggle("on", i === (city.lat < 0 ? 1 : 0)); }); }
        function toSvgY(e) { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()).y; }
        function setVal(k, m, y) {
          if (k === "t") city.t[m] = clamp(Math.round(vT(y) * 2) / 2, lo, hi);
          else city.p[m] = clamp(Math.round(vP(y) / 5) * 5, 0, pTop);
          paint();
        }
        svg.addEventListener("pointerdown", function (e) {
          const g = e.target.closest(".ed-p, .ed-b"); if (!g) return;
          e.preventDefault();
          drag = { k: g.classList.contains("ed-p") ? "t" : "p", m: +g.dataset.m, g: g };
          g.classList.add("drag"); svg.setPointerCapture(e.pointerId);
          setVal(drag.k, drag.m, toSvgY(e));
        });
        svg.addEventListener("pointermove", function (e) { if (drag) setVal(drag.k, drag.m, toSvgY(e)); });
        function end() { if (drag) drag.g.classList.remove("drag"); drag = null; }
        svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
        svg.addEventListener("keydown", function (e) {
          const g = e.target.closest(".ed-p, .ed-b"); if (!g || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
          e.preventDefault();
          const d = e.key === "ArrowUp" ? 1 : -1, m = +g.dataset.m;
          if (g.classList.contains("ed-p")) city.t[m] = clamp(city.t[m] + d, lo, hi); else city.p[m] = clamp(city.p[m] + d * 10, 0, pTop);
          paint();
        });
        bindSeg(el, "start", function (i) { load(ED_START[i]); });
        bindSeg(el, "hemi", function (i) { city.lat = i ? -Math.abs(city.lat || 30) : Math.abs(city.lat || 30); paint(); });
        bindSeg(el, "goal", function (i) { goal = i ? TARGETS[i - 1] : null; paint(); });
        build(); paint();
      }
    };
  }

  /* ==========================================================
     ② 4-2 판별 흐름 따라가기
     ========================================================== */
  const FLOW_CITIES = ["Seoul", "Singapore", "Cairo", "Rome", "Moscow", "Barrow", "London", "Darwin"];
  function flowBlock() {
    const opts = NON_H.slice().sort(function (a, b) { return a.kr.localeCompare(b.kr, "ko"); }).map(function (c) { return '<option value="' + c.id + '">' + escHtml(c.kr) + '</option>'; }).join("");
    return {
      title: "판별 흐름 따라가기",
      html: '<div class="ed-ctl">' + seg("city", FLOW_CITIES.map(function (id) { return escHtml(C(id).kr); }), 0) +
          '<label class="p4-pick">다른 도시 <select>' + opts + '</select></label></div>' +
        '<div class="fw-ctl"></div>' +
        '<div class="fw-main"><div class="fw-graph"></div><div class="fw-flow"><div class="fw-rows"></div><div class="fw-token"></div></div></div>',
      init: function (el) {
        let pl = null;
        const sel = el.querySelector("select");
        function show(id) {
          const c = C(id), j = Koppen.judge(c);
          sel.value = id;
          el.querySelector(".fw-graph").innerHTML = ClimGraph.svg(c, { title: escHtml(c.kr) + " (" + latTxt(c) + ")", on: ["g18", "g10", "gm3"] });
          const rows = j.steps.map(function (s) {
            return '<div class="fw-r lv' + s.lv + '"><span class="fw-lv">' + s.lv + '차</span><span class="fw-q">' + fmtKo(s.q) + '</span><span class="fw-v">' + fmtKo(s.v) + '</span>' +
              '<span class="fw-a ' + (s.ans ? "y" : "n") + '">' + (s.ans ? "예" : "아니요") + (s.letter ? ' <b>→ ' + s.letter + '</b>' : "") + '</span></div>';
          }).concat(['<div class="fw-r fin" style="--zc:' + zc(j.zone) + '"><span class="fw-lv">결과</span><span class="fw-code">' + j.code + '</span><span class="fw-q">' + j.name + '</span></div>']);
          el.querySelector(".fw-rows").innerHTML = rows.join("");
          el.querySelector(".fw-token").textContent = c.kr;
          if (pl) pl.pause();
          el.querySelector(".fw-ctl").innerHTML = "";
          const n = rows.length;
          pl = Anim.player(el.querySelector(".fw-ctl"), {
            steps: (function () { const cnt = {}; return j.steps.map(function (s) { cnt[s.lv] = (cnt[s.lv] || 0) + 1; return s.lv + "차 " + "①②③④⑤"[cnt[s.lv] - 1]; }); })().concat(["결과"]), interval: 1500,
            onStep: function (k) {
              const rs = el.querySelectorAll(".fw-r");
              rs.forEach(function (r, i) { r.classList.toggle("done", i < k); r.classList.toggle("now", i === k); r.classList.toggle("wait", i > k); });
              const t = el.querySelector(".fw-token");
              t.style.transform = "translateY(" + (rs[k].offsetTop + rs[k].offsetHeight / 2 - 18) + "px)";
              t.classList.toggle("fin", k === n - 1);
            }
          });
          pl.play();
        }
        bindSeg(el, "city", function (i) { show(FLOW_CITIES[i]); });
        sel.addEventListener("change", function () { el.querySelectorAll('[data-seg="city"] .p4-sb').forEach(function (b) { b.classList.remove("on"); }); show(sel.value); });
        show(FLOW_CITIES[0]);
      }
    };
  }

  /* 1차 기후대 — 경계값을 바꿀 수 있는 판별 */
  function zoneWith(c, cd, dry, tr) {
    const tmax = Math.max.apply(null, c.t), tmin = Math.min.apply(null, c.t), p = sum(c.p);
    if (tmax < 10) return "E";
    if (p < dry) return "B";
    if (tmin >= tr) return "A";
    return tmin > cd ? "C" : "D";
  }

  /* ==========================================================
     ③ 4-2 경계 기준 실험실
     ========================================================== */
  const LABS = [
    { k: "cd", n: "온대 · 냉대 경계 (최한월)", min: -6, max: 3, step: 0.5, v: -3, f: function (x) { return (x < 0 ? "−" + (-x) : x) + "℃"; } },
    { k: "dry", n: "건조 경계 (연강수량)", min: 250, max: 800, step: 50, v: 500, f: function (x) { return x + "mm"; } },
    { k: "tr", n: "열대 경계 (최한월)", min: 14, max: 22, step: 0.5, v: 18, f: function (x) { return x + "℃"; } }
  ];
  function labBlock() {
    return {
      title: "경계 기준 실험실",
      html: '<div class="bl-top"><div class="bl-sl">' + LABS.map(function (s) {
          return '<div class="p2-slider"><label for="bl-' + s.k + '">' + s.n + '</label><input type="range" id="bl-' + s.k + '" data-k="' + s.k + '" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + s.v + '"><span class="p2-sl-v" data-v="' + s.k + '"></span></div>';
        }).join("") + '</div>' +
        '<div class="bl-pre"><button type="button" class="p4-sb on" data-p="0">교과서 기준</button><button type="button" class="p4-sb" data-p="1">온대·냉대 0℃ 기준</button></div></div>' +
        '<div class="bl-main"><div class="p2-mapbox muted bl-map" data-map="bl"></div>' +
          '<div class="bl-side"><div class="bl-count"></div><div class="bl-bars"></div><div class="bl-list-t">바뀐 도시</div><div class="bl-list"></div></div></div>' +
        '<p class="keyline sm">점 = 세계 도시(고산 도시 제외) · 테두리 점 = 교과서 기준과 달라진 도시 · 기준은 사람이 정한 경계 → 기준이 바뀌면 같은 도시도 다른 기후대가 됨</p>',
      init: function (el) {
        const v = { cd: -3, dry: 500, tr: 18 };
        const base = {}; NON_H.forEach(function (c) { base[c.id] = zoneWith(c, -3, 500, 18); });
        let cur = {};
        const m = P2F.kit.makeMap(el.querySelector('[data-map="bl"]'), { legend: false, info: false, view: [-180, 80, 180, -60] }, draw);
        function draw(u) {
          return NON_H.map(function (c) {
            const z = cur[c.id] || base[c.id], ch = z !== base[c.id];
            return '<circle class="bl-dot' + (ch ? " ch" : "") + '" cx="' + c.lon + '" cy="' + (-c.lat) + '" r="' + ((ch ? 1.9 : 1.3) * u).toFixed(2) + '" style="fill:' + zc(z) + ';stroke-width:' + ((ch ? .7 : .3) * u).toFixed(2) + '"><title>' + escHtml(c.kr) + " " + z + '</title></circle>';
          }).join("");
        }
        function run() {
          LABS.forEach(function (s) { el.querySelector('[data-v="' + s.k + '"]').textContent = s.f(v[s.k]); el.querySelector('#bl-' + s.k).value = v[s.k]; });
          const cnt = { A: 0, B: 0, C: 0, D: 0, E: 0 }, changed = [];
          NON_H.forEach(function (c) { const z = zoneWith(c, v.cd, v.dry, v.tr); cur[c.id] = z; cnt[z]++; if (z !== base[c.id]) changed.push([c, base[c.id], z]); });
          m.draw(draw);
          el.querySelector(".bl-count").innerHTML = '<b>' + changed.length + '</b>개 도시의 기후대가 바뀜 <small>(' + NON_H.length + '개 중)</small>';
          const mx = Math.max.apply(null, Object.keys(cnt).map(function (z) { return cnt[z]; }));
          el.querySelector(".bl-bars").innerHTML = ["A", "B", "C", "D", "E"].map(function (z) {
            const b0 = NON_H.filter(function (c) { return base[c.id] === z; }).length, d = cnt[z] - b0;
            return '<div class="bl-row" style="--zc:' + zc(z) + '"><span><b>' + z + '</b>' + ZONES[z].name + '</span><i style="width:' + (cnt[z] / mx * 100).toFixed(1) + '%"></i><em>' + cnt[z] + (d ? ' <small class="' + (d > 0 ? "up" : "dn") + '">' + (d > 0 ? "+" : "") + d + '</small>' : "") + '</em></div>';
          }).join("");
          el.querySelector(".bl-list").innerHTML = changed.length ? changed.map(function (x) {
            return '<span class="bl-chip">' + escHtml(x[0].kr) + ' <b style="color:' + zc(x[1]) + '">' + x[1] + '</b>→<b style="color:' + zc(x[2]) + '">' + x[2] + '</b></span>';
          }).join("") : '<span class="bl-none">없음 — 교과서 기준과 같음</span>';
        }
        el.querySelectorAll(".bl-sl input").forEach(function (inp) { inp.addEventListener("input", function () { v[inp.dataset.k] = +inp.value; el.querySelectorAll(".bl-pre .p4-sb").forEach(function (b) { b.classList.remove("on"); }); run(); }); });
        el.querySelector(".bl-pre").addEventListener("click", function (e) {
          const b = e.target.closest(".p4-sb"); if (!b) return;
          el.querySelectorAll(".bl-pre .p4-sb").forEach(function (x) { x.classList.toggle("on", x === b); });
          v.cd = b.dataset.p === "1" ? 0 : -3; v.dry = 500; v.tr = 18; run();
        });
        run();
      }
    };
  }

  /* ==========================================================
     ④ 4-2 경계 도시 찾기
     ========================================================== */
  function margins(c) {
    const j = Koppen.judge(c), st = j.stats, out = [];
    const add = function (n, val, lim, unit, near) { out.push({ n: n, d: val - lim, unit: unit, near: Math.abs(val - lim) <= near, lim: lim, val: val }); };
    add("최난월 ↔ 10℃ (한대)", st.tmax, 10, "℃", 1.5);
    add("연강수량 ↔ 500mm (건조)", st.pAnn, 500, "mm", 70);
    if (j.zone === "B") add("연강수량 ↔ 250mm (사막·스텝)", st.pAnn, 250, "mm", 40);
    add("최한월 ↔ 18℃ (열대)", st.tmin, 18, "℃", 1.5);
    if (j.zone === "C" || j.zone === "D") add("최한월 ↔ −3℃ (온대·냉대)", st.tmin, -3, "℃", 1.5);
    if (j.code === "Cfa" || j.code === "Cfb") add("최난월 ↔ 22℃ (a·b)", st.tmax, 22, "℃", 1);
    return { j: j, list: out, near: out.filter(function (x) { return x.near; }) };
  }
  function nearBlock() {
    const info = {}; NON_H.forEach(function (c) { info[c.id] = margins(c); });
    const near = NON_H.filter(function (c) { return info[c.id].near.length; });
    return {
      title: "경계 도시 찾기",
      html: '<div class="bl-main nb"><div class="p2-mapbox muted bl-map" data-map="nb"></div><div class="nb-side"></div></div>' +
        '<div class="nb-chips"><span>경계 도시 ' + near.length + '곳</span>' + near.map(function (c) { return '<button type="button" class="bl-chip nb-c" data-id="' + c.id + '">' + escHtml(c.kr) + '</button>'; }).join("") + '</div>' +
        '<p class="keyline sm">큰 점 = 기준값에 아주 가까운 도시 — 관측 자료나 기준이 조금만 달라져도 다른 기후로 판별될 수 있음 · 점 누르기 → 오른쪽에 그래프와 기준까지의 거리</p>',
      init: function (el) {
        let sel = "Seoul";
        const m = P2F.kit.makeMap(el.querySelector('[data-map="nb"]'), { legend: false, info: false, view: [-180, 80, 180, -60] }, draw);
        function draw(u) {
          return NON_H.map(function (c) {
            const n = info[c.id].near.length > 0, on = c.id === sel;
            return '<circle class="nb-dot' + (n ? " near" : "") + (on ? " on" : "") + '" data-id="' + c.id + '" cx="' + c.lon + '" cy="' + (-c.lat) + '" r="' + ((on ? 2.4 : n ? 1.8 : 1.1) * u).toFixed(2) + '" style="fill:' + zc(info[c.id].j.zone) + ';stroke-width:' + ((n || on ? .6 : .25) * u).toFixed(2) + '"/>';
          }).join("");
        }
        function show(id) {
          sel = id; m.draw(draw);
          const c = C(id), I = info[id];
          el.querySelectorAll(".nb-c").forEach(function (b) { b.classList.toggle("on", b.dataset.id === id); });
          el.querySelector(".nb-side").innerHTML = '<div class="nb-head"><span class="ed-code" style="--zc:' + zc(I.j.zone) + '">' + I.j.code + '</span><span><b>' + escHtml(c.kr) + '</b> ' + latTxt(c) + '<br><small>' + I.j.name + '</small></span></div>' +
            ClimGraph.svg(c, { on: ["g18", "g10", "gm3"] }) +
            '<div class="nb-list">' + I.list.map(function (x) {
              const span = x.unit === "mm" ? 300 : 10, p = clamp(50 + x.d / span * 50, 2, 98);
              return '<div class="nb-r' + (x.near ? " near" : "") + '"><span class="nb-n">' + x.n + '</span><span class="nb-track"><i class="mid"></i><i class="pos" style="left:' + p.toFixed(1) + '%"></i></span>' +
                '<b>' + (x.d >= 0 ? "+" : "−") + (x.unit === "mm" ? Math.round(Math.abs(x.d)) : r1(Math.abs(x.d)).toFixed(1)) + x.unit + '</b></div>';
            }).join("") + '</div>';
        }
        m.root.addEventListener("click", function (e) { const d = e.target.closest(".nb-dot"); if (d) { e.stopPropagation(); show(d.dataset.id); } }, true);
        el.querySelector(".nb-chips").addEventListener("click", function (e) { const b = e.target.closest(".nb-c"); if (b) show(b.dataset.id); });
        show(sel);
      }
    };
  }

  /* ==========================================================
     ⑤ 4-3 기호 보고 그래프 고르기
     ========================================================== */
  const QCODES = ["Af", "Aw", "BW", "BS", "Cfa", "Cfb", "Cs", "Cw", "Df", "Dw", "ET"];
  function pickBlock() {
    const pool = {};
    NON_H.forEach(function (c) { const j = Koppen.judge(c).code; if (j === c.type) (pool[j] = pool[j] || []).push(c); });
    const codes = QCODES.filter(function (k) { return pool[k] && pool[k].length; });
    const rnd = function (a) { return a[Math.floor(Math.random() * a.length)]; };
    function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[k]; a[k] = t; } return a; }
    return {
      title: "기호 보고 그래프 고르기", tag: "함께 풀기",
      html: '<div class="pk"><div class="pk-top"><div class="pk-q"></div><div class="pk-score"></div></div><div class="pk-opts"></div>' +
        '<div class="pk-foot"><div class="pk-fb" aria-live="polite"></div><button type="button" class="qz-btn ghost pk-show">정답 보기</button><button type="button" class="qz-btn pk-next">다음 문제 ▶</button></div></div>',
      init: function (el) {
        let q = null, n = 0, right = 0, done = false;
        function next() {
          const code = rnd(codes), ans = rnd(pool[code]);
          const sameZone = shuffle(codes.filter(function (k) { return k !== code && k.charAt(0) === code.charAt(0); })).slice(0, 1);
          const others = shuffle(codes.filter(function (k) { return k.charAt(0) !== code.charAt(0); })).slice(0, 3 - sameZone.length);
          const opts = shuffle([ans].concat(sameZone.concat(others).map(function (k) { return rnd(pool[k]); })));
          q = { code: code, ans: ans, opts: opts }; n++; done = false;
          el.querySelector(".pk-q").innerHTML = '<span class="qz-tag q">Q</span><span class="ed-code sm" style="--zc:' + zc(code.charAt(0)) + '">' + code + '</span> ' + Koppen.NAMES[code] + '의 기후 그래프는?';
          el.querySelector(".pk-opts").innerHTML = opts.map(function (c, i) {
            return '<button type="button" class="pk-o" data-i="' + i + '"><span class="qz-num">' + "①②③④"[i] + '</span>' + ClimateChart.svg(c, {}) + '<span class="pk-ans" hidden></span></button>';
          }).join("");
          el.querySelector(".pk-fb").textContent = ""; el.querySelector(".pk-fb").className = "pk-fb";
          score();
        }
        function score() { el.querySelector(".pk-score").innerHTML = "문제 <b>" + n + "</b> · 정답 <b>" + right + "</b>"; }
        function reveal() {
          done = true;
          el.querySelectorAll(".pk-o").forEach(function (b, i) {
            const c = q.opts[i], j = Koppen.judge(c), a = b.querySelector(".pk-ans");
            a.hidden = false; a.innerHTML = escHtml(c.kr) + " · <b>" + j.code + "</b>";
            b.classList.toggle("answer", c === q.ans);
          });
        }
        el.addEventListener("click", function (e) {
          const o = e.target.closest(".pk-o");
          if (o && !done) {
            const c = q.opts[+o.dataset.i], ok = c === q.ans, fb = el.querySelector(".pk-fb");
            o.classList.add(ok ? "ok" : "no");
            if (ok) { right++; score(); fb.className = "pk-fb ok"; fb.textContent = "정답 — " + q.ans.kr + " (" + q.code + ")"; reveal(); }
            else { fb.className = "pk-fb no"; fb.textContent = "오답 — 이 그래프는 " + Koppen.judge(c).code + " · 기준선을 다시 확인"; }
            return;
          }
          if (e.target.closest(".pk-show")) reveal();
          if (e.target.closest(".pk-next")) next();
        });
        next();
      }
    };
  }

  /* ---------- 끼워 넣기 ---------- */
  insertAfter("4-1", "다른 도시로 읽어 보기", editorBlock());
  insertAfter("4-2", "1차 구분 — 기후대", flowBlock());
  insertAfter("4-2", "참고 — 경계 기준", nearBlock());
  insertAfter("4-2", "참고 — 경계 기준", labBlock());
  CHAPTER_CONTENT["4-3"].blocks.push(pickBlock());

  /* ==========================================================
     ⑥ 4-3 그래프 추리 — 단서를 하나씩 공개, 적은 단서로 맞힐수록 높은 점수
     ========================================================== */
  function guessBlock() {
    const pool = NON_H.filter(function (c) { const j = Koppen.judge(c).code; return j === c.type || (c.type.length === 2 && j.slice(0, 2) === c.type); });
    function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[k]; a[k] = t; } return a; }
    function clues(c) {
      const st = Koppen.judge(c).stats;
      return [
        ["🌐", "반구", c.lat >= 0 ? "북반구" : "남반구"],
        ["🌡️", "최난월 평균 기온", deg(st.tmax)],
        ["💧", "연강수량", mm(st.pAnn)],
        ["❄️", "최한월 평균 기온", deg(st.tmin)],
        ["☔", "최소우월 강수량", (st.iPmin + 1) + "월 " + mm(st.pmin)],
        ["📈", "기후 그래프", null]
      ];
    }
    return {
      title: "그래프 추리 — 단서로 기후대 맞히기", tag: "함께 풀기",
      html: '<div class="gs"><div class="gs-top"><span class="gs-q"><span class="qz-tag q">Q</span>어느 기후대일까? 단서를 하나씩 열어 추리하기</span><span class="gs-score"></span></div>' +
        '<div class="gs-main"><div class="gs-clues"></div><div class="gs-side"><div class="gs-opts">' +
          ["A", "B", "C", "D", "E"].map(function (z) { return '<button type="button" class="gs-o" data-z="' + z + '" style="--zc:' + zc(z) + '"><b>' + z + '</b>' + ZONES[z].name + '</button>'; }).join("") +
        '</div><div class="gs-fb" aria-live="polite"></div><div class="gs-ans" hidden></div>' +
        '<div class="gs-ctl"><button type="button" class="qz-btn gs-more">단서 하나 더 ▶</button><button type="button" class="qz-btn ghost gs-next">다음 도시</button></div></div></div>' +
        '<p class="keyline sm">점수 = 남은 단서 수 + 1 · 1차 판별 순서(최난월 10℃ → 연강수량 500mm → 최한월 18℃ → −3℃)를 떠올리며 추리</p></div>',
      init: function (el) {
        let order = shuffle(pool), idx = -1, open = 1, done = false, score = 0, n = 0;
        function draw() {
          const c = order[idx], cl = clues(c);
          el.querySelector(".gs-clues").innerHTML = cl.map(function (x, i) {
            const on = i < open;
            return '<div class="gs-c' + (on ? " on" : "") + '"><span class="gs-e">' + x[0] + '</span><span class="gs-l">' + (i + 1) + '. ' + x[1] + '</span>' +
              (on ? (x[2] === null ? '<div class="gs-g">' + ClimateChart.svg(c, {}) + '</div>' : '<b>' + x[2] + '</b>') : '<i>?</i>') + '</div>';
          }).join("");
          el.querySelector(".gs-more").disabled = open >= cl.length || done;
          el.querySelector(".gs-score").innerHTML = "도시 <b>" + n + "</b> · 점수 <b>" + score + "</b>";
        }
        function next() {
          idx = (idx + 1) % order.length; if (idx === 0 && n) order = shuffle(pool);
          n++; open = 1; done = false;
          el.querySelectorAll(".gs-o").forEach(function (b) { b.classList.remove("ok", "no", "answer"); });
          el.querySelector(".gs-fb").textContent = ""; el.querySelector(".gs-fb").className = "gs-fb";
          el.querySelector(".gs-ans").hidden = true;
          draw();
        }
        function reveal() {
          const c = order[idx], j = Koppen.judge(c);
          done = true; open = 6; draw();
          el.querySelectorAll(".gs-o").forEach(function (b) { b.classList.toggle("answer", b.dataset.z === j.zone); });
          const a = el.querySelector(".gs-ans"); a.hidden = false;
          a.innerHTML = '<span class="ed-code sm" style="--zc:' + zc(j.zone) + '">' + j.code + '</span> <b>' + escHtml(c.kr) + '</b> ' + latTxt(c) + ' · ' + j.name;
        }
        el.addEventListener("click", function (e) {
          const o = e.target.closest(".gs-o");
          if (o && !done) {
            const j = Koppen.judge(order[idx]), ok = o.dataset.z === j.zone, fb = el.querySelector(".gs-fb");
            o.classList.add(ok ? "ok" : "no");
            if (ok) { const pt = Math.max(1, 7 - open); score += pt; fb.className = "gs-fb ok"; fb.textContent = "정답 +" + pt + "점 — 단서 " + open + "개로 맞힘"; reveal(); }
            else { fb.className = "gs-fb no"; fb.textContent = "오답 — 단서를 하나 더 열어 보기"; if (open < 6) { open++; draw(); } else { fb.textContent = "오답 — 정답 확인"; reveal(); } }
            return;
          }
          if (e.target.closest(".gs-more") && open < 6) { open++; draw(); if (open === 6) { const fb = el.querySelector(".gs-fb"); fb.className = "gs-fb"; fb.textContent = "단서를 모두 열었음 — 그래프로 판별해 보기 (맞히면 +1점)"; } }
          if (e.target.closest(".gs-next")) next();
        });
        next();
      }
    };
  }
  CHAPTER_CONTENT["4-3"].blocks.push(guessBlock());

})();
