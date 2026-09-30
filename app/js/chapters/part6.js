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

  function compareHtml(a, b) {
    const ca = C(a), cb = C(b), sc = ClimGraph.scaleFor([ca, cb]);
    const row = function (k, fa, fb) { return '<tr><th>' + k + '</th><td>' + fa(ca) + '</td><td>' + fb(cb) + '</td></tr>'; };
    const code = function (c) { return c.type; };
    return '<div class="cmp-graphs">' +
        ClimGraph.svg(ca, { title: escHtml(ca.kr) + " (" + latTxt(ca) + ")", lo: sc.lo, hi: sc.hi, pTop: sc.pTop }) +
        ClimGraph.svg(cb, { title: escHtml(cb.kr) + " (" + latTxt(cb) + ")", lo: sc.lo, hi: sc.hi, pTop: sc.pTop }) +
      '</div>' +
      '<table class="cmp-table"><thead><tr><th></th><th>' + escHtml(ca.kr) + '</th><th>' + escHtml(cb.kr) + '</th></tr></thead><tbody>' +
        row("기후 기호", code, code) +
        row("최난월", function (c) { return deg(maxOf(c.t)); }, function (c) { return deg(maxOf(c.t)); }) +
        row("최한월", function (c) { return deg(minOf(c.t)); }, function (c) { return deg(minOf(c.t)); }) +
        row("연교차", function (c) { return deg(maxOf(c.t) - minOf(c.t)); }, function (c) { return deg(maxOf(c.t) - minOf(c.t)); }) +
        row("연강수량", function (c) { return mm(sum(c.p)); }, function (c) { return mm(sum(c.p)); }) +
      '</tbody></table>';
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
        '<div class="cmp-why"><button type="button" class="qz-btn ghost cmp-why-btn">까닭 보기</button><div class="cmp-why-t" hidden></div></div>',
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
      html: pts([
        "두 도시 비교: 같은 눈금에서 <b>연교차 · 연강수량 · 강수 계절</b> 비교",
        "차이의 까닭 → 기후 요인(수륙 분포 · 해류 · 지형 · 계절풍)과 대기 대순환",
        "남반구 도시: 계절 반대 — 그래프 모양으로 최난월·최한월 찾기"
      ], "lg")
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
  function judgeHtml(id) {
    const c = C(id);
    return '<div class="split judge-split"><div class="split-main graph-main">' +
        ClimGraph.svg(c, { title: escHtml(c.kr) + " (" + latTxt(c) + ")", on: ["g18", "g10", "gm3"] }) +
        '<div class="cg-btns">' + [["tmax", "최난월", "t"], ["tmin", "최한월", "t"], ["pann", "연강수량", "p"], ["pmin", "최소우월", "p"], ["g22", "22℃ 선", "t"]].map(function (k) {
          return '<button type="button" class="cg-btn ' + k[2] + '" data-key="' + k[0] + '">' + k[1] + '</button>'; }).join("") + '</div></div>' +
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
      html: pts([
        "1차: 최난월 10℃ 미만 <b>E</b> → 연강수량 500mm 미만 <b>B</b> → 최한월 18℃ 이상 <b>A</b> → −3℃ 초과 <b>C</b> / 이하 <b>D</b>",
        "2차: 강수의 계절(f · w · s · m) · 건조(W · S) · 한대(T · F)",
        "3차: Cf만 — 최난월 22℃ 이상 a / 미만 b"
      ], "lg") + '<div class="q-go">' + goBtn("4-2", "쾨펜의 구분 기준 다시 보기") + '</div>'
    }
  ] };
  function bindJudge(el) {
    JudgeBoard.init(el.querySelector(".judge-host"));
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
        '</div>',
      init: function (el) { quizInit(el); }
    },
    {
      title: "정리", kind: "summary", terms: ["그래프 읽기","판별 순서","형성 원인 · 분포 · 주민 생활"],
      html: pts([
        "그래프 읽기 → 판별 순서(E → B → A → C/D) → 강수의 계절 → 여름 기온",
        "헷갈리면 기준선(18 · 10 · −3 · 22℃)과 연강수량(500 · 250mm)부터 확인",
        "기후대마다 형성 원인 · 분포 · 주민 생활까지 함께 떠올리기"
      ], "lg") + '<div class="q-go">' + goBtn("4-2", "판별 기준") + goBtn("5-1", "세계의 기후대") + '</div>'
    }
  ] };

  function quizInit(el) {
    const st = { mode: "zone", time: 0, order: shuffle(POOL), i: -1, n: 0, right: 0, streak: 0, best: 0, tried: false, teams: 0, turn: 0, score: [0, 0], answered: false, timer: null, left: 0 };
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
      q(".cq-count").innerHTML = "문제 <b>" + st.n + "</b> · 정답 <b>" + st.right + "</b>" +
        (st.streak >= 2 ? ' · <span class="cq-streak">🔥 ' + st.streak + '연속</span>' : "") + (st.best >= 3 ? ' · 최고 ' + st.best + '연속' : "");
    }
    function next() {
      stopTimer();
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
          st.left--; if (st.left <= 0) { st.streak = 0; count(); reveal(true); }
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
        if (ok) { st.right++; if (!st.tried) { st.streak++; st.best = Math.max(st.best, st.streak); if (st.teams) st.score[st.turn]++; } count(); reveal(false); }
        else { st.tried = true; st.streak = 0; count(); }
        return;
      }
      if (e.target.closest(".cq-reveal")) { if (!st.answered) { st.streak = 0; count(); } reveal(false); return; }
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
