/* ============================================================
   지오엑스-세계의 기후 — chapters/part6.js
   PART 6 정리와 평가 — 6-1 기후 그래프 탐구 · 6-2 도시 판별하기 · 6-3 교실 퀴즈
   (파트기획/PART6_정리와_평가.md 기준, 화면 문구는 개조식)
   - 도시 자료 103곳(data/cities.js), 판별 ui/koppen.js, 판별판 JudgeBoard(chapters/part4.js)
   - 판별 문제에 쓰는 도시: 고산(H) 제외 + 판별 결과가 교과서 유형과 같은 도시만 (경계값 도시 제외)
   ============================================================ */
"use strict";

(function () {
  const C = function (id) { return CITY_BY_ID[id]; };
  const deg = Koppen.deg, mm = Koppen.mm;
  const sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
  const maxOf = function (a) { return Math.max.apply(null, a); };
  const minOf = function (a) { return Math.min.apply(null, a); };
  const byName = CITIES.slice().sort(function (a, b) { return a.kr.localeCompare(b.kr, "ko"); });
  const zoneOfType = function (t) { return t.charAt(0); };
  const latTxt = function (c) { return Math.abs(c.lat).toFixed(1) + "°" + (c.lat >= 0 ? "N" : "S"); };

  function pts(list, cls) {
    return '<ul class="pts' + (cls ? " " + cls : "") + '">' + list.map(function (t) { return "<li>" + fmtKo(t) + "</li>"; }).join("") + "</ul>";
  }
  function goBtn(id, label, node) { return chapterChip(id, label, node); }   // core/app.js

  /* 판별 문제용 도시 — 고산 제외, 앱 판별 결과 = 교과서 유형 */
  const POOL = CITIES.filter(function (c) {
    if (c.type === "H") return false;
    const j = Koppen.judge(c).code;
    return j === c.type || (c.type.length === 2 && j.slice(0, 2) === c.type);
  });
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[k]; a[k] = t; }
    return a;
  }
  function cityOptions(sel) {
    return byName.map(function (c) { return '<option value="' + c.id + '"' + (c.id === sel ? " selected" : "") + '>' + escHtml(c.kr) + ' (' + latTxt(c) + ')</option>'; }).join("");
  }
  function cityCard(c) {
    const j = { code: c.type, name: Koppen.NAMES[c.type] || "" };      // 표시는 도시 자료의 교과서 유형
    return '<div class="cinfo"><div class="cinfo-top"><span class="cinfo-name">' + escHtml(c.kr) + '</span><span class="cinfo-lat">' + latTxt(c) + '</span>' +
      '<span class="cinfo-code" style="--zc:' + ZONES[zoneOfType(j.code)].color + '">' + j.code + '</span><span class="cinfo-cname">' + j.name + '</span></div>' +
      '<div class="cinfo-stats"><span>최난월 <b>' + deg(maxOf(c.t)) + '</b></span><span>최한월 <b>' + deg(minOf(c.t)) + '</b></span>' +
      '<span>연교차 <b>' + deg(maxOf(c.t) - minOf(c.t)) + '</b></span><span>연강수량 <b>' + mm(sum(c.p)) + '</b></span></div></div>';
  }

  /* ==========================================================
     6-1 기후 그래프 탐구
     ========================================================== */
  const SETS = [
    { a: "London", b: "Moscow", t: "해안 vs 대륙 내부", why: "모스크바: 바다에서 멀어 겨울에 빨리 식음 → 연교차 큼(대륙성) / 런던: 바다의 영향 → 연교차 작음(해양성)", go: "2-2" },
    { a: "Vancouver", b: "Quebec", t: "대륙 서안 vs 동안", why: "밴쿠버: 편서풍이 바다 공기를 실어 옴 → 겨울 온화 / 퀘벡: 대륙을 지나온 바람 · 한류 → 겨울 매우 추움", go: "2-2" },
    { a: "Quito", b: "Iquitos", t: "같은 위도, 다른 높이", why: "키토: 해발 약 2,850m → 연중 약 14℃ / 이키토스: 아마존 저지대 → 연중 약 26℃", go: "5-6" },
    { a: "Rome", b: "Seoul", t: "강수 계절이 반대", why: "로마: 여름에 아열대 고압대 → 여름 건조(Cs) / 서울: 여름 계절풍 → 여름에 강수 집중(Cw)", go: "5-3" },
    { a: "Lima", b: "Belem", t: "저위도의 사막과 열대 우림", why: "리마: 페루 해류(한류) → 대기 안정 → 해안 사막 / 벨렘: 적도 저압대 → 연중 다우", go: "2-2" },
    { a: "Sydney", b: "Tokyo", t: "남반구 vs 북반구", why: "두 도시 모두 온난 습윤 기후(Cfa) — 남반구 시드니는 1월이 최난월, 북반구 도쿄는 8월이 최난월", go: "4-1" }
  ];

  /* 두 도시의 차이를 읽어 까닭 후보 제시 (개조식) */
  function autoWhy(ca, cb) {
    const out = [], ra = maxOf(ca.t) - minOf(ca.t), rb = maxOf(cb.t) - minOf(cb.t), pa = sum(ca.p), pb = sum(cb.p);
    const ma = sum(ca.t) / 12, mb = sum(cb.t) / 12, dLat = Math.abs(Math.abs(ca.lat) - Math.abs(cb.lat));
    const hot = function (c) { return c.lat >= 0 ? c.t.indexOf(maxOf(c.t)) : c.t.indexOf(maxOf(c.t)); };
    if ((ca.lat >= 0) !== (cb.lat >= 0)) out.push(["🌏", "반구가 다름", "최난월이 " + (hot(ca) + 1) + "월 · " + (hot(cb) + 1) + "월 — 계절이 반대"]);
    if (dLat >= 15) out.push(["☀️", "위도 차이 " + Math.round(dLat) + "°", "저위도일수록 태양 에너지 많음 → 연평균 기온 " + deg(Math.abs(ma - mb)) + " 차이"]);
    else if (Math.abs(ma - mb) >= 8) out.push(["⛰️", "위도는 비슷한데 기온 차 " + deg(Math.abs(ma - mb)), "해발 고도 차이를 의심 (고산 기후)"]);
    if (Math.abs(ra - rb) >= 10) out.push(["🏔️", "연교차 차이 " + deg(Math.abs(ra - rb)), (ra > rb ? ca.kr : cb.kr) + " — 대륙성(대륙 내부 · 동안) / " + (ra > rb ? cb.kr : ca.kr) + " — 해양성"]);
    if (Math.max(pa, pb) >= Math.min(pa, pb) * 2.5 && Math.abs(pa - pb) >= 400) out.push(["💧", "연강수량 " + Math.round(Math.max(pa, pb) / Math.max(1, Math.min(pa, pb))) + "배 차이", (pa < pb ? ca.kr : cb.kr) + " — 고압대 · 한류 · 대륙 내부 · 비 그늘 등 건조 요인"]);
    const sumer = function (c) { const s6 = c.lat >= 0 ? [5, 6, 7] : [11, 0, 1]; return s6.reduce(function (x, i) { return x + c.p[i]; }, 0) / Math.max(1, sum(c.p)); };
    const sa = sumer(ca), sb = sumer(cb);
    if (Math.abs(sa - sb) >= .25) out.push(["🌦️", "비가 오는 계절이 다름", (sa > sb ? ca.kr : cb.kr) + " — 여름에 집중(계절풍 · 적도 저압대) / " + (sa > sb ? cb.kr : ca.kr) + " — " + (Math.min(sa, sb) < .12 ? "여름 건조(아열대 고압대)" : "고르게 내림")]);
    if (!out.length) out.push(["🔎", "두 도시가 비슷함", "같은 기후대 — 작은 차이는 해류 · 지형 등에서 찾기"]);
    return out.slice(0, 3);
  }
  function diffBars(ca, cb) {
    const rows = [["최난월", maxOf(ca.t), maxOf(cb.t), "℃"], ["최한월", minOf(ca.t), minOf(cb.t), "℃"], ["연교차", maxOf(ca.t) - minOf(ca.t), maxOf(cb.t) - minOf(cb.t), "℃"], ["연강수량", sum(ca.p), sum(cb.p), "mm"]];
    return '<div class="dv">' + rows.map(function (r) {
      const lo = Math.min(0, r[1], r[2]), hi = Math.max(r[1], r[2], r[3] === "mm" ? 100 : 10), w = function (v) { return ((v - lo) / (hi - lo) * 100).toFixed(1); };
      const fmt = function (v) { return r[3] === "mm" ? Math.round(v).toLocaleString() + "mm" : deg(v); };
      return '<div class="dv-r"><span class="dv-k">' + r[0] + '</span><div class="dv-bars">' +
        '<div class="dv-b a"><i style="width:' + w(r[1]) + '%"></i><b>' + fmt(r[1]) + '</b></div>' +
        '<div class="dv-b b"><i style="width:' + w(r[2]) + '%"></i><b>' + fmt(r[2]) + '</b></div></div></div>';
    }).join("") + '</div>';
  }
  function compareHtml(a, b) {
    const ca = C(a), cb = C(b), sc = ClimGraph.scaleFor([ca, cb]);
    const row = function (k, fa, fb) { return '<tr><th>' + k + '</th><td>' + fa(ca) + '</td><td>' + fb(cb) + '</td></tr>'; };
    const code = function (c) { return c.type; };
    const head = function (c, k) { return '<div class="cmp-h ' + k + '"><i></i><b>' + escHtml(c.kr) + '</b><span>' + latTxt(c) + '</span><em style="--zc:' + ZONES[zoneOfType(c.type)].color + '">' + code(c) + '</em></div>'; };
    return '<div class="cmp-graphs">' +
        '<div class="cmp-g">' + head(ca, "a") + ClimGraph.svg(ca, { title: escHtml(ca.kr) + " (" + latTxt(ca) + ")", lo: sc.lo, hi: sc.hi, pTop: sc.pTop }) + '</div>' +
        '<div class="cmp-g">' + head(cb, "b") + ClimGraph.svg(cb, { title: escHtml(cb.kr) + " (" + latTxt(cb) + ")", lo: sc.lo, hi: sc.hi, pTop: sc.pTop }) + '</div>' +
      '</div>' +
      '<div class="cmp-right">' + diffBars(ca, cb) +
        '<div class="cmp-auto"><div class="cmp-at">차이에서 찾은 단서</div>' + autoWhy(ca, cb).map(function (w) { return '<div class="cmp-ai"><span>' + w[0] + '</span><div><b>' + fmtKo(w[1]) + '</b><small>' + fmtKo(w[2]) + '</small></div></div>'; }).join("") + '</div></div>';
  }

  /* 그래프 짝 맞추기 — 기후대가 다른 네 도시, 그래프를 고른 뒤 도시 이름 누르기 */
  function matchBlock() {
    function pick() {
      const zs = shuffle(["A", "B", "C", "D", "E"]).slice(0, 4);
      return zs.map(function (z) { const l = POOL.filter(function (c) { return c.type.charAt(0) === z; }); return l[Math.floor(Math.random() * l.length)]; });
    }
    return {
      title: "그래프 짝 맞추기", tag: "함께 풀기",
      html: '<div class="mt"><div class="mt-top"><span class="mt-q"><span class="qz-tag q">Q</span>그래프 고르기 → 도시 이름 누르기 — 네 쌍을 모두 맞히기</span><span class="mt-score"></span></div>' +
        '<div class="mt-graphs"></div><div class="mt-names"></div>' +
        '<div class="mt-foot"><div class="mt-fb" aria-live="polite"></div><button type="button" class="qz-btn ghost mt-show">정답 보기</button><button type="button" class="qz-btn mt-new">새 문제 ▶</button></div></div>',
      init: function (el) {
        let set = [], sel = -1, done = {}, miss = 0;
        function draw() {
          const names = shuffle(set.map(function (c, i) { return i; }));
          el.querySelector(".mt-graphs").innerHTML = set.map(function (c, i) {
            return '<button type="button" class="mt-g' + (done[i] !== undefined ? " ok" : "") + (sel === i ? " sel" : "") + '" data-i="' + i + '"><span class="mt-n">' + "ⓐⓑⓒⓓ"[i] + '</span>' + ClimateChart.svg(c, {}) +
              '<span class="mt-tag">' + (done[i] !== undefined ? escHtml(c.kr) + ' · ' + c.type : "?") + '</span></button>';
          }).join("");
          el.querySelector(".mt-names").innerHTML = names.map(function (i) {
            const c = set[i];
            return '<button type="button" class="mt-nm' + (done[i] !== undefined ? " used" : "") + '" data-i="' + i + '">' + escHtml(c.kr) + ' <small>' + latTxt(c) + '</small></button>';
          }).join("");
          const n = Object.keys(done).length;
          el.querySelector(".mt-score").innerHTML = "맞힌 짝 <b>" + n + "</b> / 4 · 틀린 횟수 " + miss;
          if (n === 4) { const fb = el.querySelector(".mt-fb"); fb.className = "mt-fb ok"; fb.textContent = miss ? "완성 — " + miss + "번 틀린 뒤 모두 맞힘" : "완벽 — 한 번에 모두 맞힘"; }
        }
        function fresh() { set = pick(); sel = -1; done = {}; miss = 0; el.querySelector(".mt-fb").textContent = ""; el.querySelector(".mt-fb").className = "mt-fb"; draw(); }
        el.addEventListener("click", function (e) {
          const g = e.target.closest(".mt-g");
          if (g) { const i = +g.dataset.i; if (done[i] === undefined) { sel = sel === i ? -1 : i; draw(); } return; }
          const nm = e.target.closest(".mt-nm");
          if (nm && !nm.classList.contains("used")) {
            const fb = el.querySelector(".mt-fb");
            if (sel < 0) { fb.className = "mt-fb"; fb.textContent = "그래프를 먼저 고르기"; return; }
            if (+nm.dataset.i === sel) { done[sel] = true; fb.className = "mt-fb ok"; fb.textContent = "정답 — " + set[sel].kr + " (" + set[sel].type + ")"; sel = -1; }
            else { miss++; fb.className = "mt-fb no"; fb.textContent = "오답 — 기온 선(최난월 · 최한월)과 강수 막대를 다시 보기"; }
            draw(); return;
          }
          if (e.target.closest(".mt-show")) { set.forEach(function (c, i) { done[i] = true; }); sel = -1; draw(); return; }
          if (e.target.closest(".mt-new")) fresh();
        });
        fresh();
      }
    };
  }

  CHAPTER_CONTENT["6-1"] = { blocks: [
    {
      title: "세계 도시 지도",
      html: '<div class="split city-split"><div class="split-main">' +
          pts(["점 색 = 기후대 · 점 누르기 → 오른쪽에 그 도시의 기후 그래프", "세계 " + CITIES.length + "개 도시 (WMO 평년값)"], "inline") +
          '<div class="map-host"></div></div>' +
        '<div class="split-side city-side"></div></div>',
      init: function (el) {
        const side = el.querySelector(".city-side");
        function show(id) {
          const c = C(id);
          side.innerHTML = ClimGraph.svg(c, { title: escHtml(c.kr) }) + cityCard(c);
        }
        const map = pickMap = WorldMap.create(el.querySelector(".map-host"), {
          legend: true, view: [-180, 80, 180, -60], regions: true,
          cities: CITIES.map(function (c) { return { id: c.id, noLabel: true, color: ZONES[zoneOfType(c.type)].color }; }),
          onCity: function (id, api) { api.select(id); show(id); }
        });
        map.select("Seoul");
        show("Seoul");
      }
    },
    {
      title: "두 도시 비교",
      html: '<div class="cmp-ctrl">' +
          '<label class="cmp-sel"><span>도시 ①</span><select data-k="a">' + cityOptions("London") + '</select></label>' +
          '<label class="cmp-sel"><span>도시 ②</span><select data-k="b">' + cityOptions("Moscow") + '</select></label>' +
          '<div class="cmp-sets"><span class="cmp-sets-l">추천 비교</span>' + SETS.map(function (s, i) {
            return '<button type="button" class="cmp-set' + (i === 0 ? " on" : "") + '" data-i="' + i + '">' + escHtml(s.t) + '</button>';
          }).join("") + '</div>' +
        '</div>' +
        '<div class="cmp-body">' + compareHtml("London", "Moscow") + '</div>' +
        '<div class="cmp-why"><button type="button" class="qz-btn ghost cmp-why-btn">교과서 설명 보기</button><div class="cmp-why-t" hidden></div></div>',
      init: function (el) {
        const selA = el.querySelector('select[data-k="a"]'), selB = el.querySelector('select[data-k="b"]');
        const body = el.querySelector(".cmp-body"), whyT = el.querySelector(".cmp-why-t"), whyWrap = el.querySelector(".cmp-why");
        let cur = 0;
        function render() {
          body.innerHTML = compareHtml(selA.value, selB.value);
          const s = SETS.filter(function (x) { return x.a === selA.value && x.b === selB.value; })[0];
          cur = s ? SETS.indexOf(s) : -1;
          el.querySelectorAll(".cmp-set").forEach(function (b) { b.classList.toggle("on", +b.getAttribute("data-i") === cur); });
          whyWrap.hidden = !s;
          whyT.hidden = true;
          if (s) whyT.innerHTML = fmtKo(s.why) + ' ' + goBtn(s.go);
        }
        el.addEventListener("change", function (e) { if (e.target.tagName === "SELECT") render(); });
        el.addEventListener("click", function (e) {
          const b = e.target.closest(".cmp-set");
          if (b) { const s = SETS[+b.getAttribute("data-i")]; selA.value = s.a; selB.value = s.b; render(); return; }
          if (e.target.closest(".cmp-why-btn")) whyT.hidden = !whyT.hidden;
        });
        render();
      }
    },
    matchBlock(),
    {
      title: "대륙 내부의 도시", kind: "quiz",
      quiz: {
        type: "graphs", q: "두 도시는 위도가 비슷함 — 대륙 내부에 있는 도시의 그래프는?",
        options: ["London", "Moscow"].map(function (id) { return ClimateChart.svg(C(id), {}); }), answer: 1,
        explain: "② 모스크바 — 연교차 " + deg(maxOf(C("Moscow").t) - minOf(C("Moscow").t)) + " (런던 " + deg(maxOf(C("London").t) - minOf(C("London").t)) + ") · 대륙 내부는 겨울에 빨리 식어 연교차가 큼"
      }
    },
    {
      title: "여름 건조의 까닭", kind: "quiz",
      quiz: {
        type: "mcq", q: "로마(Cs)는 여름에 건조하고 서울(Cw)은 여름에 강수가 집중됨 — 로마의 여름이 건조한 까닭은?",
        options: ["여름 계절풍", "아열대 고압대의 영향", "한류의 영향", "해발 고도"], answer: 1,
        explain: "여름에 아열대 고압대가 북쪽으로 이동 → 하강 기류 → 지중해 연안 여름 건조 (→ 3-8 계절에 따른 기압대의 이동)"
      }
    },
    {
      title: "정리", kind: "summary", terms: ["같은 눈금 비교","대륙성 · 해양성","대륙 서안 · 동안","남반구 그래프"],
      html: sumCards([
        { emo: "📊", t: "같은 눈금으로 비교", d: "연교차 · 연강수량 · 비가 오는 계절", c: "#e8730c" },
        { emo: "🧭", t: "차이의 까닭", d: "기후 요인(수륙 분포 · 해류 · 지형 · 계절풍) · 대기 대순환", c: "#0f9d8a" },
        { emo: "🌏", t: "남반구 도시", d: "계절 반대 — 그래프 모양으로 최난월 · 최한월 찾기", c: "#2b6fe3" }
      ], "g3")
    }
  ] };

  /* ==========================================================
     6-2 도시 판별하기
     ========================================================== */
  let judgeCity = "Tokyo", pickMap = null;
  function randomCity() {
    let c;
    do { c = POOL[Math.floor(Math.random() * POOL.length)]; } while (POOL.length > 1 && c.id === judgeCity);
    return c;
  }
  /* 판별 기록 — 스스로 판별(✓) · 정답 보기 사용(👀) · 틀린 횟수 */
  const LOG = [];
  function logHtml() {
    const self = LOG.filter(function (x) { return !x.peek; }).length;
    return '<div class="jlog"><div class="jlog-t">판별 기록 <small>' + LOG.length + '곳 · 스스로 판별 ' + self + '곳</small></div>' +
      (LOG.length ? '<div class="jlog-l">' + LOG.slice(-8).reverse().map(function (x) {
        const c = C(x.id);
        return '<span class="jlog-i' + (x.peek ? " peek" : x.miss ? " miss" : " ok") + '" style="--zc:' + ZONES[zoneOfType(c.type)].color + '"><em>' + Koppen.judge(c).code + '</em>' + escHtml(c.kr) + (x.peek ? " 👀" : x.miss ? " · " + x.miss + "번 틀림" : " ✓") + '</span>';
      }).join("") + '</div>' : '<div class="jlog-e">판별을 마치면 여기에 쌓임</div>') + '</div>';
  }
  function judgeHtml(id) {
    const c = C(id);
    return '<div class="split judge-split"><div class="split-main graph-main">' +
        ClimGraph.svg(c, { title: escHtml(c.kr) + " (" + latTxt(c) + ")", on: ["g18", "g10", "gm3"] }) +
        '<div class="cg-btns">' + [["tmax", "최난월", "t"], ["tmin", "최한월", "t"], ["pann", "연강수량", "p"], ["pmin", "최소우월", "p"], ["g22", "22℃ 선", "t"]].map(function (k) {
          return '<button type="button" class="cg-btn ' + k[2] + '" data-key="' + k[0] + '">' + k[1] + '</button>'; }).join("") + '</div>' + logHtml() + '</div>' +
      '<div class="split-side">' + JudgeBoard.html(c, {}) + '<button type="button" class="qz-btn ghost jh-next">다른 무작위 도시 ▶</button></div></div>';
  }
  CHAPTER_CONTENT["6-2"] = { blocks: [
    {
      title: "도시 고르기",
      html: '<div class="pick-ctrl">' + pts(["지도에서 도시를 누르기 → 다음 화면에서 판별", "판별 연습용 " + POOL.length + "개 도시 (고산 · 경계값 도시 제외)"], "inline") +
          '<button type="button" class="qz-btn pick-rand">무작위 도시</button></div>' +
        '<div class="map-host"></div>',
      init: function (el) {
        const map = pickMap = WorldMap.create(el.querySelector(".map-host"), {
          legend: false, info: false, view: [-180, 80, 180, -60],
          cities: POOL.map(function (c) { return { id: c.id, noLabel: true, color: "#394155" }; }),
          onCity: function (id, api) { api.select(id); choose(id); }
        });
        el.querySelector(".pick-rand").addEventListener("click", function () {
          const c = randomCity();
          map.select(c.id); choose(c.id);
        });
        map.select(judgeCity);
      }
    },
    {
      title: "판별하기",
      html: '<div class="judge-host">' + judgeHtml(judgeCity) + '</div>',
      init: function (el) { bindJudge(el); }
    },
    {
      title: "정리", kind: "summary", terms: ["1차 기후대","2차 강수의 계절","3차 여름 기온"],
      html: sumCards([
        { emo: "1️⃣", t: "1차 — 기후대", d: ["최난월 10℃ 미만 → E", "연강수량 500mm 미만 → B", "최한월 18℃ 이상 → A", "−3℃ 초과 C / 이하 D"], c: "#e03131" },
        { emo: "2️⃣", t: "2차 — 강수 · 건조 · 한대", d: ["강수의 계절 f · w · s · m", "건조 W · S", "한대 T · F"], c: "#2b6fe3" },
        { emo: "3️⃣", t: "3차 — 여름 기온", d: ["Cf만 구분", "최난월 22℃ 이상 a", "22℃ 미만 b"], c: "#6cb52d" }
      ], "g3") + '<div class="q-go">' + goBtn("4-2", "쾨펜의 구분 기준 다시 보기") + '</div>'
    }
  ] };
  function bindJudge(el) {
    JudgeBoard.init(el.querySelector(".judge-host"));
    const jb = el.querySelector(".jb"), rec = { id: judgeCity, miss: 0, peek: false };
    let logged = false;
    jb.addEventListener("click", function (e) {
      const b = e.target.closest(".jb-b");
      if (b && b.classList.contains("no")) rec.miss++;
      if (e.target.closest(".jb-reveal")) rec.peek = true;
      if (e.target.closest(".jb-reset")) { logged = false; rec.miss = 0; rec.peek = false; }
      if (!logged && jb.classList.contains("done")) {
        logged = true; LOG.push({ id: rec.id, miss: rec.miss, peek: rec.peek });
        const l = el.querySelector(".jlog"); if (l) l.outerHTML = logHtml();
      }
    });
    el.querySelector(".jh-next").addEventListener("click", function () {
      const c = randomCity();
      if (pickMap) pickMap.select(c.id);
      choose(c.id);
    });
    el.querySelector(".graph-main").addEventListener("click", function (e) {
      const b = e.target.closest(".cg-btn");
      if (!b) return;
      b.classList.toggle("on");
      ClimGraph.set(el, b.getAttribute("data-key"), b.classList.contains("on"));
    });
  }
  function choose(id) {
    judgeCity = id;
    const blk = $("page").querySelector('.blk[data-blk="2"] .judge-host');
    if (!blk) return;
    blk.innerHTML = judgeHtml(id);
    bindJudge(blk.closest(".blk"));
    Slides.go(2);
  }

  /* ==========================================================
     6-3 교실 퀴즈
     ========================================================== */
  const CODES13 = ["Af", "Am", "Aw", "BW", "BS", "Cfa", "Cfb", "Cs", "Cw", "Df", "Dw", "ET", "EF"];
  CHAPTER_CONTENT["6-3"] = { blocks: [
    {
      title: "교실 퀴즈",
      html: '<div class="cq">' +
          '<div class="cq-bar">' +
            '<div class="cq-grp"><span>맞힐 것</span><button type="button" class="cq-mode on" data-mode="zone">기후대 (A~E)</button><button type="button" class="cq-mode" data-mode="code">기후 기호</button></div>' +
            '<div class="cq-grp"><span>대결</span><button type="button" class="cq-team on" data-team="0">없음</button><button type="button" class="cq-team" data-team="2">두 팀</button></div>' +
            '<div class="cq-grp"><span>문제 수</span><button type="button" class="cq-round on" data-r="0">계속</button><button type="button" class="cq-round" data-r="10">10문제 도전</button></div>' +
            '<div class="cq-grp"><span>제한 시간</span><button type="button" class="cq-time on" data-t="0">없음</button><button type="button" class="cq-time" data-t="15">15초</button><button type="button" class="cq-time" data-t="30">30초</button></div>' +
            '<div class="cq-count"></div>' +
          '</div>' +
          '<div class="cq-timer"><i></i></div>' +
          '<div class="cq-stage">' +
            '<div class="cq-graph"></div>' +
            '<div class="cq-side"><div class="cq-hemi"></div><div class="cq-opts"></div>' +
              '<div class="cq-fb" aria-live="polite"></div>' +
              '<div class="cq-ans" hidden></div>' +
              '<div class="cq-ctrl"><button type="button" class="qz-btn ghost cq-hint">힌트</button><button type="button" class="qz-btn cq-reveal">정답 보기</button><button type="button" class="qz-btn ghost cq-next">다음 문제 ▶</button></div>' +
            '</div>' +
          '</div>' +
          '<div class="cq-result" hidden></div>' +
        '</div>',
      init: function (el) { quizInit(el); }
    },
    mapBlock(),
    {
      title: "정리", kind: "summary", terms: ["그래프 읽기","판별 순서","형성 원인 · 분포 · 주민 생활"],
      html: sumCards([
        { emo: "👀", t: "그래프 읽기", d: "판별 순서 E → B → A → C/D → 강수의 계절 → 여름 기온", c: "#7a5cc8" },
        { emo: "📏", t: "헷갈리면 기준선부터", d: "18 · 10 · −3 · 22℃ 선 · 연강수량 500 · 250mm", c: "#e8730c" },
        { emo: "🗺️", t: "기후대와 생활 연결", d: "형성 원인 · 분포 · 주민 생활까지 함께 떠올리기", c: "#0f9d8a" }
      ], "g3") + '<div class="q-go">' + goBtn("4-2", "판별 기준") + goBtn("5-1", "세계의 기후대") + '</div>'
    }
  ] };

  /* 단원 마무리 — 기후 단원 개념 지도 (누르면 그 챕터로) */
  function mapBlock() {
    const N = [
      { id: "1-1", x: 90, y: 70, t: "날씨와 기후", c: "#2b6fe3" }, { id: "1-2", x: 90, y: 190, t: "세계의 기후 지도", c: "#2b6fe3" },
      { id: "2-1", x: 330, y: 70, t: "기후 요소", s: "기온 · 강수 · 바람", c: "#0f9d8a" }, { id: "2-2", x: 330, y: 190, t: "기후 요인", s: "위도 · 수륙 · 해류 · 지형 · 계절풍", c: "#0f9d8a" },
      { id: "3-4", x: 330, y: 310, t: "대기 대순환", s: "기압대 · 바람", c: "#ea5a3d" },
      { id: "4-1", x: 570, y: 70, t: "기후 그래프", s: "기온 선 · 강수 막대", c: "#7a5cc8" }, { id: "4-2", x: 570, y: 190, t: "쾨펜의 기후 구분", s: "E → B → A → C/D", c: "#7a5cc8" },
      { id: "5-1", x: 810, y: 40, t: "A 열대", c: "#e03131" }, { id: "5-2", x: 810, y: 100, t: "B 건조", c: "#e6a700" }, { id: "5-3", x: 810, y: 160, t: "C 온대", c: "#6cb52d" },
      { id: "5-4", x: 810, y: 220, t: "D 냉대", c: "#2f6fdb" }, { id: "5-5", x: 810, y: 280, t: "E 한대", c: "#8e5cc8" }, { id: "5-6", x: 810, y: 340, t: "H 고산", c: "#8a8f98" }
    ];
    const E = [["1-1", "1-2"], ["2-1", "2-2"], ["2-2", "3-4"], ["1-2", "2-2"], ["2-1", "4-1"], ["4-1", "4-2"], ["3-4", "4-2"], ["4-2", "5-1"], ["4-2", "5-2"], ["4-2", "5-3"], ["4-2", "5-4"], ["4-2", "5-5"], ["4-2", "5-6"]];
    const P = {}; N.forEach(function (n) { P[n.id] = n; });
    const zone = function (n) { return /^5-/.test(n.id); };
    let svg = '<svg class="p2-svg cm-svg" viewBox="-30 0 980 410" role="img" aria-label="기후 단원 개념 지도">' +
      ['1 기후의 이해', '2 기후 요소와 요인 · 3 대기 대순환', '4 기후 구분', '5 세계의 기후대'].map(function (t, i) { return '<text class="cm-col" x="' + [90, 330, 570, 810][i] + '" y="400" text-anchor="middle">PART ' + t + '</text>'; }).join("") +
      E.map(function (e) { const a = P[e[0]], b = P[e[1]], ax = a.x + (b.x > a.x ? (zone(a) ? 50 : 100) : 0), bx = b.x - (b.x > a.x ? (zone(b) ? 50 : 100) : 0);
        return '<path class="cm-e" d="M' + ax + ' ' + (a.y + (b.x === a.x ? 30 : 0)) + ' C' + ((ax + bx) / 2) + ' ' + a.y + ' ' + ((ax + bx) / 2) + ' ' + b.y + ' ' + bx + ' ' + (b.y - (b.x === a.x ? 30 : 0)) + '"/>'; }).join("") +
      N.map(function (n) { const w = zone(n) ? 100 : 200, h = zone(n) ? 44 : (n.s ? 62 : 48);
        return '<g class="cm-n" data-go="' + n.id + '" tabindex="0" role="link"><rect x="' + (n.x - w / 2) + '" y="' + (n.y - h / 2) + '" width="' + w + '" height="' + h + '" rx="12" style="--nc:' + n.c + '"/>' +
          '<text x="' + n.x + '" y="' + (n.y + (n.s ? -4 : 6)) + '" text-anchor="middle" class="cm-t">' + n.t + '</text>' + (n.s ? '<text x="' + n.x + '" y="' + (n.y + 18) + '" text-anchor="middle" class="cm-s">' + n.s + '</text>' : "") + '</g>'; }).join("") + '</svg>';
    return {
      title: "단원 마무리 — 기후 단원 한눈에",
      html: '<p class="cm-lead">상자를 누르면 그 챕터로 이동 — 화살표를 따라 배운 내용을 이어서 설명해 보기</p><div class="p2-figwrap cm-fig">' + svg + '</div>' +
        '<p class="p2-cap">기후 요소 · 요인과 대기 대순환 → 기후 그래프와 쾨펜의 구분 → 다섯 기후대와 고산 기후</p>'
    };
  }

  function quizInit(el) {
    const st = { round: 0, log: [], mode: "zone", time: 0, order: shuffle(POOL), i: -1, n: 0, right: 0, streak: 0, best: 0, tried: false, teams: 0, turn: 0, score: [0, 0], answered: false, timer: null, left: 0 };
    const q = function (s) { return el.querySelector(s); };
    function stopTimer() { if (st.timer) { clearInterval(st.timer); st.timer = null; } }
    function reveal(timeout) {
      if (st.answered && !timeout) { /* 이미 공개 */ }
      stopTimer();
      st.answered = true;
      const c = st.order[st.i], j = Koppen.judge(c);
      const ans = st.mode === "zone" ? j.zone : j.code;
      el.querySelectorAll(".cq-opt").forEach(function (b) { if (b.getAttribute("data-v") === ans) b.classList.add("answer"); });
      q(".cq-ans").hidden = false;
      q(".cq-ans").innerHTML = '<span class="cq-code" style="--zc:' + ZONES[j.zone].color + '">' + j.code + '</span><span class="cq-name">' + j.name + '</span>' +
        '<span class="cq-city">' + escHtml(c.kr) + ' · ' + latTxt(c) + '</span>' +
        '<ul class="cq-why">' + j.steps.filter(function (s) { return s.letter; }).map(function (s) { return '<li><b>' + s.letter + '</b>' + fmtKo(s.v) + '</li>'; }).join("") + '</ul>';
      if (timeout) { q(".cq-fb").className = "cq-fb no"; q(".cq-fb").textContent = "시간 종료"; }
    }
    function count() {
      if (st.teams) {
        q(".cq-count").innerHTML = [0, 1].map(function (t) {
          return '<span class="cq-tm' + (t === st.turn ? " now" : "") + '">' + (t + 1) + '팀 <b>' + st.score[t] + '</b></span>';
        }).join("") + '<span class="cq-turn">지금: ' + (st.turn + 1) + '팀 차례</span>';
        return;
      }
      q(".cq-count").innerHTML = (st.round ? "도전 <b>" + st.n + "</b>/" + st.round : "문제 <b>" + st.n + "</b>") + " · 정답 <b>" + st.right + "</b>" +
        (st.streak >= 2 ? ' · <span class="cq-streak">🔥 ' + st.streak + '연속</span>' : "") + (st.best >= 3 ? ' · 최고 ' + st.best + '연속' : "");
    }
    function showResult() {
      stopTimer();
      const by = {};
      st.log.forEach(function (x) { (by[x.z] = by[x.z] || [0, 0])[1]++; if (x.ok) by[x.z][0]++; });
      const right = st.log.filter(function (x) { return x.ok; }).length;
      const weak = Object.keys(by).filter(function (z) { return by[z][0] < by[z][1]; }).sort(function (a, b) { return by[a][0] / by[a][1] - by[b][0] / by[b][1]; });
      const ch = { A: "5-1", B: "5-2", C: "5-3", D: "5-4", E: "5-5" };
      const r = q(".cq-result");
      r.hidden = false;
      r.innerHTML = '<div class="cqr-card"><div class="cqr-emo">' + (right >= 9 ? "🏆" : right >= 6 ? "🎉" : "💪") + '</div>' +
        '<div class="cqr-score"><b>' + right + '</b> / ' + st.log.length + '</div><div class="cqr-t">' + (right >= 9 ? "기후 판별 박사" : right >= 6 ? "잘했음 — 조금만 더" : "기준선부터 다시 확인") + '</div>' +
        '<div class="cqr-bars">' + ["A", "B", "C", "D", "E"].filter(function (z) { return by[z]; }).map(function (z) {
          return '<div class="cqr-b" style="--zc:' + ZONES[z].color + '"><span>' + z + ' ' + ZONES[z].name + '</span><i><s style="width:' + (by[z][0] / by[z][1] * 100) + '%"></s></i><em>' + by[z][0] + '/' + by[z][1] + '</em></div>'; }).join("") + '</div>' +
        (weak.length ? '<div class="cqr-go"><span>다시 보기</span>' + weak.slice(0, 2).map(function (z) { return goBtn(ch[z]); }).join("") + '</div>' : "") +
        '<button type="button" class="qz-btn cq-again">다시 도전 ▶</button></div>';
    }
    function next() {
      stopTimer();
      if (st.round && st.log.length >= st.round) { showResult(); return; }
      q(".cq-result").hidden = true;
      const hb = q(".cq-hint"); if (hb) hb.classList.remove("on");
      if (st.teams && st.n > 0) st.turn = 1 - st.turn;
      st.i = (st.i + 1) % st.order.length;
      if (st.i === 0 && st.n > 0) st.order = shuffle(POOL);
      st.n++;
      st.answered = false;
      const c = st.order[st.i], j = Koppen.judge(c);
      q(".cq-graph").innerHTML = ClimGraph.svg(c, { hideName: true, on: ["g18", "g10", "gm3"] });
      q(".cq-hemi").textContent = (c.lat >= 0 ? "북반구" : "남반구") + " 도시";
      let opts;
      if (st.mode === "zone") opts = ["A", "B", "C", "D", "E"];
      else {
        const same = CODES13.filter(function (x) { return x !== j.code && x.charAt(0) === j.zone; });
        const other = shuffle(CODES13.filter(function (x) { return x.charAt(0) !== j.zone; }));
        opts = shuffle([j.code].concat(shuffle(same).slice(0, 2)).concat(other).slice(0, 4));
        opts = [j.code].concat(opts.filter(function (x) { return x !== j.code; })).slice(0, 4);
        opts = shuffle(opts);
      }
      q(".cq-opts").innerHTML = opts.map(function (v) {
        const z = v.charAt(0);
        return '<button type="button" class="cq-opt" data-v="' + v + '" style="--zc:' + ZONES[z].color + '"><b>' + v + '</b><small>' + (st.mode === "zone" ? ZONES[z].name : Koppen.NAMES[v]) + '</small></button>';
      }).join("");
      q(".cq-fb").textContent = ""; q(".cq-fb").className = "cq-fb";
      q(".cq-ans").hidden = true;
      count();
      st.tried = false;
      const bar = q(".cq-timer i");
      if (st.time > 0) {
        st.left = st.time;
        q(".cq-timer").classList.add("on");
        bar.style.transition = "none"; bar.style.width = "100%";
        void bar.offsetWidth;
        bar.style.transition = "width " + st.time + "s linear"; bar.style.width = "0%";
        st.timer = setInterval(function () {
          if (!el.isConnected) { stopTimer(); return; }          // 다른 챕터로 가면 멈춤
          st.left--; if (st.left <= 0) { if (!st.tried) st.log.push({ z: Koppen.judge(st.order[st.i]).zone, ok: false }); st.streak = 0; count(); reveal(true); }
        }, 1000);
      } else q(".cq-timer").classList.remove("on");
    }
    el.addEventListener("click", function (e) {
      const m = e.target.closest(".cq-mode");
      if (m) { st.mode = m.getAttribute("data-mode"); el.querySelectorAll(".cq-mode").forEach(function (b) { b.classList.toggle("on", b === m); }); st.n = 0; st.right = 0; st.i = -1; next(); return; }
      const tm = e.target.closest(".cq-team");
      if (tm) {
        st.teams = +tm.getAttribute("data-team"); st.turn = 0; st.score = [0, 0]; st.n = 0; st.right = 0; st.streak = 0; st.best = 0; st.i = -1;
        el.querySelectorAll(".cq-team").forEach(function (b) { b.classList.toggle("on", b === tm); });
        el.classList.toggle("teams", !!st.teams);
        next(); return;
      }
      const t = e.target.closest(".cq-time");
      if (t) { st.time = +t.getAttribute("data-t"); el.querySelectorAll(".cq-time").forEach(function (b) { b.classList.toggle("on", b === t); }); st.n = Math.max(0, st.n - 1); st.i = Math.max(-1, st.i - 1); next(); return; }
      const o = e.target.closest(".cq-opt");
      if (o && !st.answered) {
        const c = st.order[st.i], j = Koppen.judge(c);
        const ok = o.getAttribute("data-v") === (st.mode === "zone" ? j.zone : j.code);
        el.querySelectorAll(".cq-opt").forEach(function (b) { b.classList.remove("ok", "no"); });
        o.classList.add(ok ? "ok" : "no");
        const fb = q(".cq-fb");
        fb.className = "cq-fb " + (ok ? "ok" : "no");
        fb.textContent = ok ? "정답" : "오답 — 다시 생각해 보기";
        if (!st.tried && !st.answered) st.log.push({ z: j.zone, ok: ok });
        if (ok) { st.right++; if (!st.tried) { st.streak++; st.best = Math.max(st.best, st.streak); if (st.teams) st.score[st.turn]++; } count(); reveal(false); }
        else { st.tried = true; st.streak = 0; count(); }
        return;
      }
      if (e.target.closest(".cq-reveal")) { if (!st.answered) { if (!st.tried) st.log.push({ z: Koppen.judge(st.order[st.i]).zone, ok: false }); st.streak = 0; count(); } reveal(false); return; }
      const rd = e.target.closest(".cq-round");
      if (rd) { st.round = +rd.getAttribute("data-r"); el.querySelectorAll(".cq-round").forEach(function (b) { b.classList.toggle("on", b === rd); }); st.log = []; st.n = 0; st.right = 0; st.streak = 0; st.i = -1; next(); return; }
      if (e.target.closest(".cq-again")) { st.log = []; st.n = 0; st.right = 0; st.streak = 0; st.order = shuffle(POOL); st.i = -1; next(); return; }
      const h = e.target.closest(".cq-hint");
      if (h) {
        /* 힌트: 그래프에 최난월 · 최한월 · 연강수량 표시 */
        const on = !h.classList.contains("on");
        h.classList.toggle("on", on);
        ["tmax", "tmin", "pann"].forEach(function (k) { ClimGraph.set(q(".cq-graph"), k, on); });
        return;
      }
      if (e.target.closest(".cq-next")) next();
    });
    next();
  }
})();
