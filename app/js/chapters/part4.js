/* ============================================================
   지오엑스-세계의 기후 — chapters/part4.js
   PART 4 기후 구분과 기후 그래프 — 4-1 기후 그래프 읽는 법 · 4-2 쾨펜의 구분 기준 · 4-3 판별 연습
   (파트기획/PART4_기후_구분과_기후_그래프.md 기준, 화면 문구는 개조식)
   판별 기준: ui/koppen.js (교과서 기준) · 그래프: ui/climgraph.js
   JudgeBoard(판별판)는 PART 6 도시 판별에서도 사용
   ============================================================ */
"use strict";

/* ---------- 판별판: 1차 → 2차 → 3차 기호 버튼 + 근거 ---------- */
const JudgeBoard = (function () {
  const OPTS2 = { A: ["f", "m", "w"], B: ["W", "S"], C: ["f", "w", "s"], D: ["f", "w", "s"], E: ["T", "F"] };
  const DESC2 = { f: "연중 습윤", m: "짧은 건기(계절풍)", w: "겨울 건조", s: "여름 건조", W: "사막", S: "스텝", T: "툰드라", F: "빙설" };

  function stepsHtml(steps, lv) {
    return steps.filter(function (s) { return s.lv === lv; }).map(function (s) {
      return '<li><span class="jb-q">' + fmtKo(s.q) + '</span><span class="jb-v">' + fmtKo(s.v) + '</span>' +
        '<span class="jb-a ' + (s.ans ? "yes" : "no") + '">' + (s.ans ? "예" : "아니요") + '</span>' +
        (s.letter ? '<b class="jb-l">→ ' + s.letter + '</b>' : "") + '</li>';
    }).join("");
  }

  /* opts: { label: "도시 ①", reveal: true(이름 공개 버튼) } */
  function html(city, opts) {
    opts = opts || {};
    const j = Koppen.judge(city);
    const hemi = city.lat >= 0 ? "북반구" : "남반구";
    const btns = function (lv, list) {
      return '<div class="jb-btns">' + list.map(function (x) {
        return '<button type="button" class="jb-b" data-lv="' + lv + '" data-x="' + x + '">' + x +
          (lv === 1 ? '<small>' + ZONES[x].name + '</small>' : lv === 2 ? '<small>' + DESC2[x] + '</small>' : '<small>' + (x === "a" ? "최난월 22℃ 이상" : "최난월 22℃ 미만") + '</small>') + '</button>';
      }).join("") + '</div>';
    };
    const second = j.code.charAt(1), third = j.code.length > 2 ? j.code.charAt(2) : "";
    return '<div class="jb" data-code="' + j.code + '" data-zone="' + j.zone + '">' +
      '<div class="jb-head"><span class="jb-city" data-name="' + escHtml(city.kr) + '">' + escHtml(opts.label || city.kr) + '</span>' +
        '<span class="jb-hemi">' + hemi + ' 도시</span>' +
        (opts.label ? '<button type="button" class="jb-show">도시 공개</button>' : "") + '</div>' +
      '<div class="jb-step" data-lv="1"><div class="jb-t"><span>1차</span>기후대</div>' + btns(1, ["A", "B", "C", "D", "E"]) +
        '<ul class="jb-why">' + stepsHtml(j.steps, 1) + '</ul></div>' +
      '<div class="jb-step" data-lv="2" data-wait="1"><div class="jb-t"><span>2차</span>' + (j.zone === "B" || j.zone === "E" ? "세분" : "강수의 계절") + '</div>' +
        btns(2, OPTS2[j.zone]) + '<ul class="jb-why">' + stepsHtml(j.steps, 2) + '</ul></div>' +
      (third ? '<div class="jb-step" data-lv="3" data-wait="1"><div class="jb-t"><span>3차</span>여름 기온</div>' + btns(3, ["a", "b"]) +
        '<ul class="jb-why">' + stepsHtml(j.steps, 3) + '</ul></div>' : "") +
      '<div class="jb-result"><span class="jb-code">' + j.code + '</span><span class="jb-name">' + j.name + '</span></div>' +
      '<div class="jb-ctrl"><button type="button" class="qz-btn jb-reveal">정답 보기</button><button type="button" class="qz-btn ghost jb-reset">다시 풀기</button></div>' +
    '</div>';
    /* second·third는 data-code로 확인 */
  }

  function init(el) {
    const jb = el.querySelector(".jb");
    const code = jb.getAttribute("data-code");
    const want = { 1: code.charAt(0), 2: code.charAt(1), 3: code.charAt(2) };
    function open(lv) {
      const st = jb.querySelector('.jb-step[data-lv="' + lv + '"]');
      if (st) st.removeAttribute("data-wait");
      else jb.classList.add("done");
    }
    function solve(lv) {
      const st = jb.querySelector('.jb-step[data-lv="' + lv + '"]');
      if (!st) return;
      st.classList.add("solved");
      st.querySelectorAll(".jb-b").forEach(function (b) { if (b.getAttribute("data-x") === want[lv]) b.classList.add("ok"); });
      open(lv + 1);
    }
    jb.addEventListener("click", function (e) {
      const b = e.target.closest(".jb-b");
      if (b) {
        const lv = +b.getAttribute("data-lv");
        const st = b.closest(".jb-step");
        if (st.hasAttribute("data-wait") || st.classList.contains("solved")) return;
        if (b.getAttribute("data-x") === want[lv]) solve(lv);
        else { b.classList.add("no"); setTimeout(function () { b.classList.remove("no"); }, 900); }
        return;
      }
      if (e.target.closest(".jb-reveal")) { [1, 2, 3].forEach(solve); jb.classList.add("done"); return; }
      if (e.target.closest(".jb-reset")) {
        jb.classList.remove("done");
        jb.querySelectorAll(".jb-step").forEach(function (st) {
          st.classList.remove("solved");
          if (st.getAttribute("data-lv") !== "1") st.setAttribute("data-wait", "1");
        });
        jb.querySelectorAll(".jb-b").forEach(function (x) { x.classList.remove("ok", "no"); });
        return;
      }
      const show = e.target.closest(".jb-show");
      if (show) {
        const c = jb.querySelector(".jb-city");
        c.textContent = c.getAttribute("data-name");
        show.remove();
      }
    });
  }

  return { html: html, init: init };
})();

(function () {
  const C = function (id) { return CITY_BY_ID[id]; };
  const num = function (v, d) { return (Math.round(v * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toLocaleString("ko-KR"); };
  const deg = Koppen.deg, mm = Koppen.mm;
  const sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };

  function pts(list, cls) {
    return '<ul class="pts' + (cls ? " " + cls : "") + '">' + list.map(function (t) { return "<li>" + fmtKo(t) + "</li>"; }).join("") + "</ul>";
  }
  /* 그래프 표시 버튼 — 누르면 켜기·끄기 */
  function toggles(list) {
    return '<div class="cg-btns">' + list.map(function (k) {
      return '<button type="button" class="cg-btn ' + (k[2] || "") + '" data-key="' + k[0] + '">' + k[1] + '</button>';
    }).join("") + '</div>';
  }
  function bindToggles(el, exclusive) {
    el.addEventListener("click", function (e) {
      const b = e.target.closest(".cg-btn");
      if (!b) return;
      const on = !b.classList.contains("on");
      if (exclusive) {
        el.querySelectorAll(".cg-btn").forEach(function (x) { x.classList.remove("on"); ClimGraph.set(el, x.getAttribute("data-key"), false); });
      }
      b.classList.toggle("on", on);
      b.getAttribute("data-key").split(" ").forEach(function (k) { ClimGraph.set(el, k, on); });
    });
  }

  const seoul = C("Seoul"), sydney = C("Sydney");
  const sj = Koppen.judge(seoul).stats;
  const READ4 = ["Singapore", "Cairo", "Rome", "Moscow", "Mumbai", "Barrow"];
  function readout(c) {
    const st = Koppen.judge(c).stats;
    return '<dt>최난월</dt><dd>' + (st.iMax + 1) + '월 ' + deg(st.tmax) + '</dd>' +
      '<dt>최한월</dt><dd>' + (st.iMin + 1) + '월 ' + deg(st.tmin) + '</dd>' +
      '<dt>연교차</dt><dd>' + deg(st.range) + '</dd>' +
      '<dt>연강수량</dt><dd>' + mm(st.pAnn) + '</dd>' +
      '<dt>최다우월</dt><dd>' + (st.iPmax + 1) + '월 ' + mm(c.p[st.iPmax]) + '</dd>' +
      '<dt>최소우월</dt><dd>' + (st.iPmin + 1) + '월 ' + mm(st.pmin) + '</dd>';
  }
  function sydneyGraph(start) {
    return '<div class="sh-g' + (start ? " shifted" : "") + '">' +
      ClimGraph.svg(sydney, { title: "시드니 (남반구 " + num(-sydney.lat, 1) + "°S)" + (start ? " — 7월부터" : ""), on: ["tmax", "tmin"], start: start }) + '</div>';
  }

  /* ==========================================================
     4-1 기후 그래프 읽는 법
     ========================================================== */
  CHAPTER_CONTENT["4-1"] = { blocks: [
    {
      title: "기후 그래프의 구성",
      html: '<div class="split">' +
        '<div class="split-main graph-main">' + ClimGraph.svg(seoul, { title: "서울의 기후 그래프" }) + '</div>' +
        '<div class="split-side">' +
          toggles([["hl-line", "기온 선", "t"], ["hl-bars", "강수 막대", "p"], ["hl-x", "가로축 (월)", "x"]]) +
          pts(["<b>선</b> = 월평균 기온 → 왼쪽 눈금(℃)", "<b>막대</b> = 월 강수량 → 오른쪽 눈금(mm)", "<b>가로축</b> = 1월 ~ 12월"], "lg") +
          '<p class="keyline sm">한 도시의 30년 평균(평년값)을 한 장에 나타낸 그래프</p>' +
        '</div></div>',
      init: function (el) { bindToggles(el, true); }
    },
    {
      title: "기후 그래프 그리는 순서",
      html: '<div class="split">' +
        '<div class="split-main graph-main"><div class="cg-build empty" data-st="0">' + ClimGraph.svg(seoul, { title: "서울의 기후 그래프 그리기" }) + '</div></div>' +
        '<div class="split-side"><div class="build-ctl"></div>' +
          '<div class="build-say"></div>' +
        '</div></div>',
      init: function (el) {
        /* 가로축 → 강수 막대 → 기온 점 → 선 잇기 → 완성 — 단계마다 .cg-build의 data-st를 바꿔 차례로 그려짐 */
        const host = el.querySelector(".cg-build"), say = el.querySelector(".build-say");
        const SAY = [
          ["빈 그래프", "▶ 재생 또는 단계 버튼 → 한 단계씩 그리기"],
          ["가로축: 1월 ~ 12월", "왼쪽 눈금 = 기온(℃), 오른쪽 눈금 = 강수량(mm)"],
          ["월 강수량 → 막대", "각 달의 강수량만큼 막대를 세움 (오른쪽 눈금)"],
          ["월평균 기온 → 점", "각 달의 평균 기온 위치에 점을 찍음 (왼쪽 눈금)"],
          ["점을 선으로 잇기", "기온 변화가 한눈에 보이게 연결"],
          ["완성", "한 도시의 30년 평균 기후가 그래프 한 장에"]
        ];
        Anim.player(el.querySelector(".build-ctl"), { steps: ["시작", "가로축 · 눈금", "강수 막대", "기온 점", "기온 선", "완성"], interval: 2200, start: 0,
          onStep: function (k) {
            host.classList.toggle("empty", k === 0);
            host.setAttribute("data-st", Math.max(0, k - 1));
            say.innerHTML = '<div class="bs-t">' + SAY[k][0] + '</div>' + pts([SAY[k][1]], "lg");
          } });
      }
    },
    {
      title: "기온 읽기",
      html: '<div class="split">' +
        '<div class="split-main graph-main">' + ClimGraph.svg(seoul, { title: "서울" }) + '</div>' +
        '<div class="split-side">' +
          toggles([["tmax", "최난월", "t"], ["tmin", "최한월", "t"], ["range", "기온의 연교차", "r"], ["tmean", "연평균 기온", "t"]]) +
          '<dl class="readout">' +
            '<dt>최난월</dt><dd>가장 따뜻한 달 · ' + (sj.iMax + 1) + '월 ' + deg(sj.tmax) + '</dd>' +
            '<dt>최한월</dt><dd>가장 추운 달 · ' + (sj.iMin + 1) + '월 ' + deg(sj.tmin) + '</dd>' +
            '<dt>연교차</dt><dd>최난월 − 최한월 = ' + deg(sj.range) + '</dd>' +
            '<dt>연평균 기온</dt><dd>12개월 평균 ' + deg(sum(seoul.t) / 12) + '</dd>' +
          '</dl></div></div>',
      init: function (el) { bindToggles(el, false); }
    },
    {
      title: "강수 읽기",
      html: '<div class="split">' +
        '<div class="split-main graph-main">' + ClimGraph.svg(seoul, { title: "서울" }) + '</div>' +
        '<div class="split-side">' +
          toggles([["pann", "연강수량", "p"], ["pmax", "최다우월", "p"], ["pmin", "최소우월(최건월)", "p"]]) +
          '<dl class="readout">' +
            '<dt>연강수량</dt><dd>12개월 합 ' + mm(sj.pAnn) + '</dd>' +
            '<dt>최다우월</dt><dd>강수량이 가장 많은 달 · ' + (sj.iPmax + 1) + '월 ' + mm(seoul.p[sj.iPmax]) + '</dd>' +
            '<dt>최소우월</dt><dd>가장 건조한 달(최건월) · ' + (sj.iPmin + 1) + '월 ' + mm(sj.pmin) + '</dd>' +
          '</dl>' + pts(["강수 집중 시기 = 막대가 높은 달 → 서울은 여름(6~8월)"], "sm") + '</div></div>',
      init: function (el) { bindToggles(el, false); }
    },
    {
      title: "다른 도시로 읽어 보기",
      html: '<div class="rd-pick" role="group" aria-label="도시 고르기">' + READ4.map(function (id, i) {
          return '<button type="button" class="rd-b' + (i === 0 ? " on" : "") + '" data-id="' + id + '">' + escHtml(C(id).kr) + '</button>'; }).join("") + '</div>' +
        '<div class="split"><div class="split-main graph-main rd-graph">' + ClimGraph.svg(C(READ4[0]), { title: escHtml(C(READ4[0]).kr) }) + '</div>' +
        '<div class="split-side">' +
          toggles([["tmax", "최난월", "t"], ["tmin", "최한월", "t"], ["range", "연교차", "r"], ["pann", "연강수량", "p"], ["pmax", "최다우월", "p"], ["pmin", "최소우월", "p"]]) +
          '<button type="button" class="qz-btn ghost rd-show">값 모두 보기</button>' +
          '<dl class="readout rd-out" hidden>' + readout(C(READ4[0])) + '</dl>' +
          pts(["도시 바꾸기 → 학생이 그래프에서 값 읽기 → 표시 버튼이나 「값 모두 보기」로 확인"], "sm") +
        '</div></div>',
      init: function (el) {
        el.querySelector(".rd-pick").addEventListener("click", function (e) {
          const b = e.target.closest(".rd-b");
          if (!b) return;
          const c = C(b.getAttribute("data-id"));
          el.querySelectorAll(".rd-b").forEach(function (x) { x.classList.toggle("on", x === b); });
          const on = [].map.call(el.querySelectorAll(".cg-btn.on"), function (x) { return x.getAttribute("data-key"); });
          el.querySelector(".rd-graph").innerHTML = ClimGraph.svg(c, { title: escHtml(c.kr), on: on });
          el.querySelector(".rd-out").innerHTML = readout(c);
          el.querySelector(".rd-out").hidden = true;
          el.querySelector(".rd-show").textContent = "값 모두 보기";
        });
        el.querySelector(".rd-show").addEventListener("click", function () {
          const o = el.querySelector(".rd-out");
          o.hidden = !o.hidden;
          this.textContent = o.hidden ? "값 모두 보기" : "값 숨기기";
        });
        bindToggles(el, false);
      }
    },
    {
      title: "남반구의 기후 그래프",
      html: '<div class="two-graphs">' +
          ClimGraph.svg(seoul, { title: "서울 (북반구 " + num(seoul.lat, 1) + "°N)", on: ["tmax", "tmin"] }) +
          '<div class="sh-host">' + sydneyGraph(0) + '</div>' +
        '</div>' +
        '<div class="sh-row">' + pts(["남반구: 북반구와 <b>계절이 반대</b> — 1월 여름, 7월 겨울", "최난월·최한월을 월 이름이 아닌 <b>그래프 모양</b>으로 찾기"], "inline") +
          '<button type="button" class="qz-btn sh-btn">시드니를 7월부터 그려 보기</button></div>',
      init: function (el) {
        /* 7월부터 그리면 북반구 그래프와 같은 모양(가운데가 볼록) — 계절이 반대임을 확인 */
        let on = false;
        el.querySelector(".sh-btn").addEventListener("click", function () {
          on = !on;
          el.querySelector(".sh-host").innerHTML = sydneyGraph(on ? 6 : 0);
          this.textContent = on ? "1월부터 다시 그리기" : "시드니를 7월부터 그려 보기";
        });
      }
    },
    {
      title: "연교차 비교", kind: "quiz",
      quiz: {
        type: "graphs",
        q: "기온의 연교차가 가장 큰 그래프는?",
        options: ["London", "Harbin", "Singapore", "Moscow"].map(function (id) { return ClimateChart.svg(C(id), {}); }),
        answer: 1,
        explain: "② 하얼빈 — 최난월 " + deg(Math.max.apply(null, C("Harbin").t)) + " · 최한월 " + deg(Math.min.apply(null, C("Harbin").t)) +
          " → 연교차 약 " + num(Math.max.apply(null, C("Harbin").t) - Math.min.apply(null, C("Harbin").t), 0) + "℃ (① 런던 · ③ 싱가포르 · ④ 모스크바)"
      }
    },
    {
      title: "강수가 집중되는 계절", kind: "quiz",
      quiz: {
        type: "mcq",
        q: "이 도시에서 강수가 집중되는 계절은? (북반구 도시)",
        visual: ClimGraph.svg(C("Mumbai"), { hideName: true }),
        options: ["봄 (3~5월)", "여름 (6~8월)", "가을 (9~11월)", "겨울 (12~2월)"],
        answer: 1,
        explain: "뭄바이(인도) — 6~8월 강수량 " + mm(C("Mumbai").p[5] + C("Mumbai").p[6] + C("Mumbai").p[7]) +
          " / 연강수량 " + mm(sum(C("Mumbai").p)) + " · 여름 계절풍의 영향 (→ 2-2 기후 요인)"
      }
    },
    {
      title: "정리", kind: "summary",
      html: sumCards([
        { emo: "📈", t: "기후 그래프", c: "#e2632b", float: true, d: ["<b>선</b> = 월평균 기온 (왼쪽 ℃)", "<b>막대</b> = 월 강수량 (오른쪽 mm)", "가로축 = 1월 ~ 12월"] },
        { emo: "🌡️", t: "기온 읽기", c: "#e0483a", float: true, d: ["<b>최난월</b> · <b>최한월</b>", "기온의 연교차 = 최난월 − 최한월", "연평균 기온"] },
        { emo: "🌧️", t: "강수 읽기", c: "#2b6fe3", float: true, d: ["<b>연강수량</b> = 12달의 합", "최다우월 · 최소우월(최건월)", "강수가 집중되는 계절"] },
        { emo: "🌏", t: "남반구", c: "#2f9e5b", float: true, d: ["계절이 반대 — 1월 여름, 7월 겨울", "월 이름보다 <b>그래프 모양</b>으로 판단"] }
      ])
    }
  ] };

  /* ==========================================================
     4-2 쾨펜의 구분 기준
     ========================================================== */
  const FLOW = [
    { q: "최난월 평균 기온 10℃ 미만", z: "E", why: "여름에도 너무 추워 나무가 자라지 못함" },
    { q: "연강수량 500mm 미만", z: "B", why: "강수가 부족해 나무가 자라기 어려움" },
    { q: "최한월 평균 기온 18℃ 이상", z: "A", why: "일 년 내내 더움" },
    { q: "최한월 평균 기온 −3℃ 초과", z: "C", no: "D", why: "겨울이 비교적 온화함 / 아니면 D" }
  ];
  function flowHtml() {
    return '<div class="flow">' + FLOW.map(function (f, i) {
      return '<div class="fl-row" data-i="' + i + '">' +
        '<span class="fl-n">' + (i + 1) + '</span>' +
        '<div class="fl-q">' + fmtKo(f.q) + '?</div>' +
        '<span class="fl-yes">예 →</span>' +
        '<span class="fl-z" style="--zc:' + ZONES[f.z].color + '"><b>' + f.z + '</b>' + ZONES[f.z].name + '</span>' +
        (f.no ? '<span class="fl-yes">아니요 →</span><span class="fl-z" style="--zc:' + ZONES[f.no].color + '"><b>' + f.no + '</b>' + ZONES[f.no].name + '</span>'
              : '<span class="fl-down">아니요 ↓</span>') +
        '<span class="fl-why">' + fmtKo(f.why) + '</span>' +
      '</div>';
    }).join("") + '</div>';
  }
  /* 기준 실험하기 — 최난월 · 최한월 · 연강수량 막대 */
  const sgn = function (x) { return (x < 0 ? "−" + -x : x) + "℃"; };
  const LAB = [
    { k: "tmax", n: "최난월 평균 기온", min: -30, max: 35, step: 1, v: 25, f: sgn },
    { k: "tmin", n: "최한월 평균 기온", min: -45, max: 30, step: 1, v: -2, f: sgn },
    { k: "pann", n: "연강수량", min: 0, max: 3000, step: 50, v: 1400, f: function (x) { return x.toLocaleString("ko-KR") + "mm"; } }
  ];
  const LAB_CITY = ["Seoul", "Singapore", "Cairo", "Moscow", "Barrow"];
  const SYM = [
    { x: "f", t: "연중 습윤", d: "뚜렷한 건기 없음", c: "London", z: "C" },
    { x: "w", t: "겨울 건조", d: "여름 최다우월 ≥ 겨울 최소우월 × 10", c: "Seoul", z: "C" },
    { x: "s", t: "여름 건조", d: "여름 최소우월 < 40mm, 겨울 최다우월 ≥ 그 3배", c: "Rome", z: "C" },
    { x: "m", t: "계절풍 · 짧은 건기", d: "열대에서만 (Am)", c: "Yangon", z: "A" },
    { x: "W", t: "사막", d: "연강수량 250mm 미만", c: "Cairo", z: "B" },
    { x: "S", t: "스텝", d: "연강수량 250~500mm", c: "Ulaanbaatar", z: "B" },
    { x: "T", t: "툰드라", d: "최난월 0~10℃", c: "Barrow", z: "E" },
    { x: "F", t: "빙설", d: "최난월 0℃ 미만", c: "Vostok", z: "E" }
  ];
  /* 13유형 + 고산의 대표 도시 · 기호 풀이 */
  const TYPE_CITY = { Af: "Singapore", Am: "Yangon", Aw: "Darwin", BW: "Cairo", BS: "Ulaanbaatar", Cfa: "Tokyo", Cfb: "London", Cs: "Rome", Cw: "Seoul",
    Df: "Moscow", Dw: "Harbin", ET: "Barrow", EF: "Vostok", H: "Quito" };
  const L2 = { f: "강수의 계절 — 연중 습윤", m: "강수의 계절 — 계절풍 · 짧은 건기", w: "강수의 계절 — 겨울 건조", s: "강수의 계절 — 여름 건조",
    W: "세분 — 사막(연강수량 250mm 미만)", S: "세분 — 스텝(250~500mm)", T: "세분 — 툰드라(최난월 0~10℃)", F: "세분 — 빙설(최난월 0℃ 미만)" };
  const L3 = { a: "여름 기온 — 최난월 22℃ 이상", b: "여름 기온 — 최난월 22℃ 미만" };
  function codeRead(code) {
    const z = code.charAt(0), c = C(TYPE_CITY[code]);
    const letters = code === "H" ? [["z", "H"]] : code.split("").map(function (x, i) { return [["z", "s", "a"][i], x]; });
    const parts = code === "H" ? ['<div><b>H</b>해발 고도가 높은 지역을 따로 구분 — 쾨펜의 원래 구분에는 없음</div>'] :
      [ '<div><b>' + z + '</b>1차 · 기후대 — ' + ZONES[z].name + '</div>' ]
        .concat(code.length > 1 ? ['<div><b>' + code.charAt(1) + '</b>2차 · ' + L2[code.charAt(1)] + '</div>'] : [])
        .concat(code.length > 2 ? ['<div><b>' + code.charAt(2) + '</b>3차 · ' + L3[code.charAt(2)] + '</div>'] : []);
    const name = (Koppen.NAMES[code] || (code === "H" ? "고산 기후" : "")).replace(/ 기후$/, "") + " 기후";
    return '<div class="cr-big" style="--zC:' + ZONES[z].color + '">' + letters.map(function (l) { return '<span class="cr-l ' + l[0] + '">' + l[1] + '</span>'; }).join("") + '</div>' +
      '<div class="cr-parts" style="--zC:' + ZONES[z].color + '">' + parts.join("") +
        '<div class="cr-eq">= <b>' + name + '</b> (예: ' + escHtml(c.kr) + ')</div></div>' +
      '<div class="cr-chart">' + ClimateChart.svg(c, {}) + '</div>';
  }
  const TYPES13 = [
    ["A", [["Af", "열대 우림"], ["Am", "열대 몬순"], ["Aw", "사바나"]]],
    ["B", [["BW", "사막"], ["BS", "스텝"]]],
    ["C", [["Cfa", "온난 습윤"], ["Cfb", "서안 해양성"], ["Cs", "지중해성"], ["Cw", "온대 겨울 건조"]]],
    ["D", [["Df", "냉대 습윤"], ["Dw", "냉대 겨울 건조"]]],
    ["E", [["ET", "툰드라"], ["EF", "빙설"]]],
    ["H", [["H", "고산"]]]
  ];


  /* ---------- 쾨펜 기후 구분이 만들어지기까지 (이야기 애니메이션) ---------- */
  const STORY = [
    { y: "1846", emo: "👶", t: "러시아에서 태어난 과학자", d: ["블라디미르 쾨펜 — 상트페테르부르크 출생, 독일에서 활동", "대학에서 식물학 공부 → 식물과 기후의 관계에 관심"],
      art: '<div class="st-art person"><span>🧑‍🔬</span><span>🌿</span><span>🌡️</span></div>' },
    { y: "1874", emo: "🌿", t: "식물학자가 나눈 5가지 식물 무리", d: ["스위스 식물학자 드캉돌: 식물을 필요한 열·물에 따라 5무리로 구분", "쾨펜: 식물 분포 = 기후를 보여 주는 지표"],
      art: '<div class="st-art plants">' + [["🌴", "더위 좋아함"], ["🌵", "건조 견딤"], ["🌳", "온화한 곳"], ["🌲", "추위 견딤"], ["🌱", "아주 추운 곳"]].map(function (x) { return '<span><b>' + x[0] + '</b><small>' + x[1] + '</small></span>'; }).join("") + '</div>' },
    { y: "1884", emo: "🗺️", t: "세계 기온대 지도", d: ["일 년 중 더운 달 · 추운 달 수로 세계를 기온대로 나눈 지도 발표", "기후를 숫자(기온)로 나누는 첫걸음"],
      art: '<div class="st-art bands">' + ["#8e5cc8", "#2f6fdb", "#6cb52d", "#e03131", "#6cb52d", "#2f6fdb", "#8e5cc8"].map(function (c) { return '<i style="background:' + c + '"></i>'; }).join("") + '</div>' },
    { y: "1900", emo: "📘", t: "식생으로 나눈 기후 구분", d: ["식물 무리의 분포를 기준으로 세계 기후를 처음 체계적으로 구분", "기후대마다 알파벳 기호를 붙이기 시작"],
      art: '<div class="st-art match">' + [["🌴", "A"], ["🌵", "B"], ["🌳", "C"], ["🌲", "D"], ["🌱", "E"]].map(function (x) { return '<span><b>' + x[0] + '</b><i>→</i><em style="--zc:' + ZONES[x[1]].color + '">' + x[1] + '</em></span>'; }).join("") + '</div>' },
    { y: "1918", emo: "🔢", t: "기온 · 강수 수치 기준으로 개정", d: ["식물 대신 <b>월평균 기온 · 월 강수량</b>의 경계값으로 판별", "기후 그래프만 있으면 누구나 같은 결과 → 오늘날의 기준"],
      art: '<div class="st-art nums">' + ["최난월 10℃", "연강수량", "최한월 18℃", "최한월 −3℃"].map(function (x) { return '<span>' + x + '</span>'; }).join("") + '</div>' },
    { y: "1936~1961", emo: "🤝", t: "쾨펜-가이거 기후 구분", d: ["1936 쾨펜의 마지막 개정 → 1940 세상을 떠남", "제자 가이거가 지도와 기준을 다듬음 → 「쾨펜-가이거 기후 구분」"],
      art: '<div class="st-art person"><span>🧓</span><span>🤝</span><span>🧑‍🏫</span></div>' },
    { y: "오늘", emo: "🛰️", t: "지금도 쓰이는 기후 구분", d: ["관측·위성 자료로 전 세계를 격자로 판별한 지도 — 1-2 세계 기후 지도", "교과서 · 기후 연구에서 가장 널리 쓰이는 기후 구분"],
      art: '<div class="st-art sat"><span>🛰️</span><span>🌍</span></div>' }
  ];
  function storyBlock() {
    return {
      title: "쾨펜의 기후 구분이 만들어지기까지",
      html: '<div class="story">' +
          '<div class="st-line">' + STORY.map(function (s, i) { return '<button type="button" class="st-dot" data-i="' + i + '"><i></i><span>' + s.y + '</span></button>'; }).join("") + '</div>' +
          '<div class="st-stage"></div>' +
        '</div><div class="st-ctl"></div>',
      init: function (el) {
        const stage = el.querySelector(".st-stage");
        function show(k) {
          const s = STORY[k];
          el.querySelectorAll(".st-dot").forEach(function (b, i) { b.classList.toggle("on", i === k); b.classList.toggle("done", i < k); });
          el.querySelector(".st-line").style.setProperty("--p", (k / (STORY.length - 1) * 100).toFixed(1) + "%");
          stage.innerHTML = '<div class="st-card"><div class="st-y">' + s.y + '</div><div class="st-body"><h4><span aria-hidden="true">' + s.emo + '</span>' + s.t + '</h4>' +
            pts(s.d, "lg") + '</div>' + s.art + '</div>';
        }
        const pl = Anim.player(el.querySelector(".st-ctl"), { steps: STORY.map(function (s) { return s.y; }), interval: 3600, onStep: show });
        el.querySelector(".st-line").addEventListener("click", function (e) { const b = e.target.closest(".st-dot"); if (b) { pl.pause(); pl.go(+b.dataset.i); } });
      }
    };
  }

  /* ---------- 쾨펜 기후 분류 체계 (나무 도식) ---------- */
  const TREE_WHY = {
    A: "최한월 18℃ 이상", B: "연강수량 500mm 미만", C: "최한월 −3℃ 초과 18℃ 미만", D: "최한월 −3℃ 이하 · 최난월 10℃ 이상", E: "최난월 10℃ 미만",
    Af: "최소우월 60mm 이상 — 건기 없음", Am: "짧은 건기 — 계절풍", Aw: "건기 뚜렷(겨울)", BW: "연강수량 250mm 미만", BS: "연강수량 250~500mm",
    Cfa: "연중 습윤 · 최난월 22℃ 이상", Cfb: "연중 습윤 · 최난월 22℃ 미만", Cs: "여름 건조", Cw: "겨울 건조", Df: "연중 습윤", Dw: "겨울 건조",
    ET: "최난월 0~10℃", EF: "최난월 0℃ 미만"
  };
  function treeSvg() {
    const W = 1200, H = 520, zs = ["A", "C", "D", "B", "E"];
    const types = { A: ["Af", "Am", "Aw"], C: ["Cfa", "Cfb", "Cs", "Cw"], D: ["Df", "Dw"], B: ["BW", "BS"], E: ["ET", "EF"] };
    let leaves = [], x = 130;
    zs.forEach(function (z, i) { if (i === 3) x += 40; types[z].forEach(function (t) { leaves.push({ t: t, z: z, x: x }); x += 78; }); });
    const zx = {}; zs.forEach(function (z) { const l = leaves.filter(function (q) { return q.z === z; }); zx[z] = (l[0].x + l[l.length - 1].x) / 2; });
    const gx = [(zx.A + zx.D) / 2, (zx.B + zx.E) / 2], rx = (gx[0] + gx[1]) / 2;
    const Y = [50, 150, 270, 420];
    const ln = function (x1, y1, x2, y2, cls) { const m = (y1 + y2) / 2; return '<path class="kt-l ' + cls + '" d="M' + x1 + ' ' + (y1 + 22) + ' C' + x1 + ' ' + m + ' ' + x2 + ' ' + m + ' ' + x2 + ' ' + (y2 - 22) + '"/>'; };
    let s = '<svg class="p2-svg kt-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="쾨펜 기후 분류 체계">';
    s += ln(rx, Y[0], gx[0], Y[1], "g0") + ln(rx, Y[0], gx[1], Y[1], "g1");
    zs.forEach(function (z) { s += ln(z === "B" || z === "E" ? gx[1] : gx[0], Y[1], zx[z], Y[2], "z" + z); });
    leaves.forEach(function (q) { s += ln(zx[q.z], Y[2], q.x, Y[3], "t" + q.t + " z" + q.z); });
    s += '<g class="kt-n root"><rect x="' + (rx - 90) + '" y="' + (Y[0] - 24) + '" width="180" height="48" rx="14"/><text x="' + rx + '" y="' + (Y[0] + 7) + '" text-anchor="middle">기후</text></g>';
    [["수목 기후", "🌳 나무가 자람", 0], ["무수목 기후", "🌵❄️ 나무가 자라기 어려움", 1]].forEach(function (g) {
      s += '<g class="kt-n grp g' + g[2] + '" data-g="' + g[2] + '"><rect x="' + (gx[g[2]] - 130) + '" y="' + (Y[1] - 26) + '" width="260" height="52" rx="14"/><text x="' + gx[g[2]] + '" y="' + (Y[1] - 2) + '" text-anchor="middle">' + g[0] + '</text><text class="kt-s" x="' + gx[g[2]] + '" y="' + (Y[1] + 17) + '" text-anchor="middle">' + g[1] + '</text></g>';
    });
    zs.forEach(function (z) {
      s += '<g class="kt-n zone" data-k="' + z + '" style="--zc:' + ZONES[z].color + '"><rect x="' + (zx[z] - 72) + '" y="' + (Y[2] - 30) + '" width="144" height="60" rx="14"/><text class="kt-z" x="' + zx[z] + '" y="' + (Y[2] + 2) + '" text-anchor="middle">' + z + ' ' + ZONES[z].name + '</text><text class="kt-s" x="' + zx[z] + '" y="' + (Y[2] + 21) + '" text-anchor="middle">1차</text></g>';
    });
    leaves.forEach(function (q) {
      s += '<g class="kt-n leaf" data-k="' + q.t + '" style="--zc:' + ZONES[q.z].color + '"><rect x="' + (q.x - 38) + '" y="' + (Y[3] - 30) + '" width="76" height="60" rx="12"/><text class="kt-c" x="' + q.x + '" y="' + (Y[3] + 2) + '" text-anchor="middle">' + q.t + '</text><text class="kt-s" x="' + q.x + '" y="' + (Y[3] + 20) + '" text-anchor="middle">' + (Koppen.NAMES[q.t] || "").replace(/ 기후$/, "").replace("온대 겨울 건조", "온대 겨울건조").replace("냉대 겨울 건조", "냉대 겨울건조").slice(0, 6) + '</text></g>';
    });
    s += '<text class="kt-lv" x="14" y="' + (Y[2] + 5) + '">1차</text><text class="kt-lv" x="14" y="' + (Y[3] + 5) + '">2·3차</text>';
    return s + '</svg>';
  }
  function treeBlock() {
    return {
      title: "쾨펜 기후 분류 체계",
      html: '<div class="kt-wrap">' + treeSvg() + '</div><div class="p2-readout kt-t">기후대나 기후 기호를 누르면 → 가지가 강조되고 판별 기준이 나타남</div>' +
        '<p class="keyline sm">나무가 자랄 수 있는가(수목 · 무수목) → 기후대 5개(1차) → 강수의 계절 · 세분(2차) · 여름 기온(3차) = 13개 기후형 · 고산 기후(H)는 따로 구분</p>',
      init: function (el) {
        const svg = el.querySelector(".kt-svg");
        svg.addEventListener("click", function (e) {
          const n = e.target.closest(".kt-n.zone, .kt-n.leaf");
          if (!n) return;
          const k = n.getAttribute("data-k"), z = k.charAt(0), g = (z === "B" || z === "E") ? 1 : 0;
          svg.classList.add("focus");
          svg.querySelectorAll(".kt-n, .kt-l").forEach(function (x) { x.classList.remove("hot"); });
          svg.querySelector(".kt-n.root").classList.add("hot");
          svg.querySelector('.kt-n.grp[data-g="' + g + '"]').classList.add("hot");
          svg.querySelector(".kt-l.g" + g).classList.add("hot");
          svg.querySelector('.kt-n.zone[data-k="' + z + '"]').classList.add("hot");
          svg.querySelectorAll(".kt-l").forEach(function (x) {
            const c = x.getAttribute("class");
            if (c.indexOf("z" + z) >= 0 && c.indexOf(" t") < 0) x.classList.add("hot");            // 무리 → 기후대
            if (k.length === 1 && c.indexOf("z" + z) >= 0) x.classList.add("hot");                    // 기후대 → 모든 기후형
            if (k.length > 1 && c.indexOf("t" + k + " ") >= 0) x.classList.add("hot");               // 기후대 → 그 기후형
          });
          svg.querySelectorAll('.kt-n.leaf[data-k^="' + z + '"]').forEach(function (x) { if (k.length === 1 || x.getAttribute("data-k") === k) x.classList.add("hot"); });
          const zN = ZONES[z].name;
          el.querySelector(".kt-t").innerHTML = k.length === 1
            ? "<b>" + z + " " + zN + " 기후</b> — 1차 기준: " + TREE_WHY[z] + " → 기후형 " + svg.querySelectorAll('.kt-n.leaf[data-k^="' + z + '"]').length + "개"
            : "<b>" + k + " " + Koppen.NAMES[k] + "</b> — 1차: " + TREE_WHY[z] + " · 2·3차: " + TREE_WHY[k] + " (예: " + escHtml(C(TYPE_CITY[k]).kr) + ")";
        });
      }
    };
  }

  /* ---------- 1차 · 2차 · 3차 구분 한눈에 ---------- */
  const OVER = [
    { z: "A", c1: "최한월 18℃ 이상", c2: [["f", "최소우월 60mm 이상"], ["m", "짧은 건기(계절풍)"], ["w", "겨울 건기 뚜렷"]], c3: "—" },
    { z: "B", c1: "연강수량 500mm 미만", c2: [["W", "250mm 미만 · 사막"], ["S", "250~500mm · 스텝"]], c3: "—" },
    { z: "C", c1: "최한월 −3℃ 초과 18℃ 미만", c2: [["f", "연중 습윤"], ["s", "여름 건조"], ["w", "겨울 건조"]], c3: "<span class=\"ov-c3\">Cf만 세분<br><b>a</b> 최난월 22℃ 이상<br><b>b</b> 최난월 22℃ 미만</span>" },
    { z: "D", c1: "최한월 −3℃ 이하", c2: [["f", "연중 습윤"], ["w", "겨울 건조"]], c3: "—" },
    { z: "E", c1: "최난월 10℃ 미만", c2: [["T", "최난월 0~10℃ · 툰드라"], ["F", "최난월 0℃ 미만 · 빙설"]], c3: "—" }
  ];
  const ORDER = ["E", "B", "A", "C", "D"];
  function overBlock() {
    return {
      title: "1차 · 2차 · 3차 구분 한눈에",
      html: '<div class="ov-ctl"></div><div class="ov" data-st="3">' +
          '<div class="ov-h"><span></span><span class="c1">1차 — 기후대</span><span class="c2">2차 — 강수의 계절 · 세분</span><span class="c3">3차 — 여름 기온</span></div>' +
          ORDER.map(function (z, i) {
            const o = OVER.filter(function (x) { return x.z === z; })[0];
            return '<div class="ov-r" style="--zc:' + ZONES[z].color + '"><span class="ov-z"><em>' + (i + 1) + '</em><b>' + z + '</b>' + ZONES[z].name + '</span>' +
              '<span class="c1">' + o.c1 + '</span>' +
              '<span class="c2">' + o.c2.map(function (x) { return '<i><b>' + x[0] + '</b>' + x[1] + '</i>'; }).join("") + '</span>' +
              '<span class="c3">' + o.c3 + '</span></div>';
          }).join("") +
        '</div>' +
        '<p class="keyline sm">1차는 위에서부터 차례로(E → B → A → C/D) 확인 · 교과서 기준 · 여름 반년: 북반구 4~9월, 남반구 10~3월</p>',
      init: function (el) {
        const ov = el.querySelector(".ov");
        Anim.player(el.querySelector(".ov-ctl"), { steps: ["1차 구분", "2차 구분", "3차 구분", "모두 보기"], interval: 2400, start: 3, onStep: function (k) { ov.setAttribute("data-st", k); } });
      }
    };
  }

  CHAPTER_CONTENT["4-2"] = { blocks: [
    {
      title: "쾨펜의 기후 구분",
      html: '<div class="tree2">' +
          '<div class="tr-box tree"><div class="tr-emo" aria-hidden="true">🌳</div><h4>수목 기후</h4><p>나무가 자랄 수 있는 기후</p>' +
            '<div class="tr-z">' + ["A", "C", "D"].map(function (z) { return '<span style="--zc:' + ZONES[z].color + '"><b>' + z + '</b>' + ZONES[z].name + '</span>'; }).join("") + '</div></div>' +
          '<div class="tr-box notree"><div class="tr-emo" aria-hidden="true">🌵❄️</div><h4>무수목 기후</h4><p>나무가 자라기 어려운 기후</p>' +
            '<div class="tr-z">' + [["B", "강수 부족"], ["E", "기온 부족"]].map(function (k) { return '<span style="--zc:' + ZONES[k[0]].color + '"><b>' + k[0] + '</b>' + ZONES[k[0]].name + ' <small>' + k[1] + '</small></span>'; }).join("") + '</div></div>' +
        '</div>' +
        pts(["<b>쾨펜</b>(1846~1940, 러시아 태생 독일 기후학자): <b>식생 분포</b>를 기준으로 기후 구분", "기준 = 월평균 기온 · 월 강수량 → 기후 그래프만으로 판별 가능"], "inline")
    },
    storyBlock(),
    treeBlock(),
    {
      title: "1차 구분 — 기후대",
      html: '<div class="flow-wrap">' + flowHtml() +
        '<div class="fl-ctrl"><button type="button" class="qz-btn fl-next">다음 기준</button><button type="button" class="qz-btn ghost fl-all">모두 보기</button><button type="button" class="qz-btn ghost fl-reset">처음부터</button></div></div>' +
        '<p class="keyline sm">위에서부터 차례로 확인 — 먼저 해당하는 기준에서 기후대 확정 · 고산 기후(H)는 해발 고도가 높은 지역을 따로 구분</p>',
      init: function (el) {
        let n = 1;
        const rows = el.querySelectorAll(".fl-row");
        const show = function () { rows.forEach(function (r, i) { r.classList.toggle("shown", i < n); }); };
        show();
        el.addEventListener("click", function (e) {
          if (e.target.closest(".fl-next")) { n = Math.min(rows.length, n + 1); show(); }
          if (e.target.closest(".fl-all")) { n = rows.length; show(); }
          if (e.target.closest(".fl-reset")) { n = 1; show(); }
        });
      }
    },
    {
      title: "기준 실험하기",
      html: '<div class="split lab">' +
        '<div class="split-main lab-main">' +
          LAB.map(function (s) {
            return '<div class="lab-sl"><label for="lab-' + s.k + '">' + s.n + '</label>' +
              '<input type="range" id="lab-' + s.k + '" data-k="' + s.k + '" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + s.v + '">' +
              '<output class="lab-v" data-k="' + s.k + '"></output></div>';
          }).join("") +
          '<div class="lab-presets"><span>도시 값 넣기</span>' + LAB_CITY.map(function (id) {
            return '<button type="button" class="lab-pre" data-c="' + id + '">' + escHtml(C(id).kr) + '</button>'; }).join("") + '</div>' +
          '<div class="lab-flow">' + FLOW.map(function (f, i) { return '<div class="lab-row" data-i="' + i + '"><span class="fl-n">' + (i + 1) + '</span><span class="lab-q">' + fmtKo(f.q) + '?</span><span class="lab-a"></span></div>'; }).join("") + '</div>' +
        '</div>' +
        '<div class="split-side"><div class="lab-res"></div>' +
          pts(["막대를 움직여 값 바꾸기 → 기후대가 바로 바뀜", "위에서부터 차례로 확인 — 처음 ‘예’가 나온 기준에서 결정"], "sm") + '</div>' +
      '</div>',
      init: function (el) {
        const v = {};
        function judge() {
          if (v.tmax < 10) return [0, "E"];
          if (v.pann < 500) return [1, "B"];
          if (v.tmin >= 18) return [2, "A"];
          return [3, v.tmin > -3 ? "C" : "D"];
        }
        function paint() {
          LAB.forEach(function (s) { el.querySelector('.lab-v[data-k="' + s.k + '"]').textContent = s.f(v[s.k]); });
          const j = judge();
          el.querySelectorAll(".lab-row").forEach(function (r, i) {
            const hit = i === j[0], ans = i < j[0] ? "아니요" : hit ? (i === 3 ? (j[1] === "C" ? "예 → C" : "아니요 → D") : "예 → " + j[1]) : "";
            r.classList.toggle("pass", i < j[0]); r.classList.toggle("hit", hit); r.classList.toggle("skip", i > j[0]);
            r.style.setProperty("--zc", hit ? ZONES[j[1]].color : "");
            r.querySelector(".lab-a").textContent = ans;
          });
          const res = el.querySelector(".lab-res");
          res.style.setProperty("--zc", ZONES[j[1]].color);
          res.innerHTML = '<span class="lab-z">' + j[1] + '</span><span class="lab-zn">' + ZONES[j[1]].name + ' 기후</span>';
        }
        function set(k, x, fromUser) {
          v[k] = x;
          /* 최한월은 최난월보다 높을 수 없음 */
          if (k === "tmax" && v.tmin > v.tmax) v.tmin = v.tmax;
          if (k === "tmin" && v.tmin > v.tmax) v.tmax = v.tmin;
          LAB.forEach(function (s) { el.querySelector('input[data-k="' + s.k + '"]').value = v[s.k]; });
          if (fromUser) el.querySelectorAll(".lab-pre").forEach(function (b) { b.classList.remove("on"); });
          paint();
        }
        LAB.forEach(function (s) { v[s.k] = s.v; });
        el.addEventListener("input", function (e) { const k = e.target.getAttribute("data-k"); if (k) set(k, +e.target.value, true); });
        el.addEventListener("click", function (e) {
          const b = e.target.closest(".lab-pre");
          if (!b) return;
          const st = Koppen.judge(C(b.getAttribute("data-c"))).stats;
          v.tmax = Math.round(st.tmax); v.tmin = Math.round(st.tmin); set("pann", Math.round(st.pAnn / 50) * 50);
          el.querySelectorAll(".lab-pre").forEach(function (x) { x.classList.toggle("on", x === b); });
        });
        set("tmax", v.tmax);
      }
    },
    {
      title: "2차 구분 — 강수의 계절 · 세분",
      html: '<div class="symcards">' + SYM.map(function (s) {
        return '<div class="sym" style="--zc:' + ZONES[s.z].color + '"><div class="sym-top"><span class="sym-x">' + s.x + '</span><span class="sym-t">' + s.t + '</span></div>' +
          '<div class="sym-d">' + fmtKo(s.d) + '</div>' +
          '<div class="sym-chart">' + ClimateChart.svg(C(s.c), {}) + '</div>' +
          '<div class="sym-c">' + escHtml(C(s.c).kr) + ' · ' + Koppen.judge(C(s.c)).code + '</div></div>';
      }).join("") + '</div>' +
      '<p class="keyline sm">소문자(f·w·s·m) = 강수의 계절 · 대문자(W·S·T·F) = 건조·한대 기후의 세분 · 여름 반년: 북반구 4~9월, 남반구 10~3월</p>'
    },
    {
      title: "3차 구분 — 여름 기온",
      html: '<div class="two-graphs">' +
          ClimGraph.svg(C("Tokyo"), { title: "도쿄 — Cfa 온난 습윤 기후", on: ["g22", "tmax"] }) +
          ClimGraph.svg(C("London"), { title: "런던 — Cfb 서안 해양성 기후", on: ["g22", "tmax"] }) +
        '</div>' +
        pts(["Cf 기후를 여름 기온으로 세분", "최난월 <b>22℃ 이상 → a</b>(여름 더움) · <b>22℃ 미만 → b</b>(여름 서늘)"], "inline")
    },
    overBlock(),
    {
      title: "기후 기호 읽기",
      html: '<div class="code-read">' + codeRead("Cfa") + '</div>' +
        '<div class="types13">' + TYPES13.map(function (g) {
          return '<div class="t13" style="--zc:' + ZONES[g[0]].color + '"><div class="t13-z"><b>' + g[0] + '</b>' + ZONES[g[0]].name + '</div>' +
            g[1].map(function (t) {
              return '<button type="button" class="t13-i' + (t[0] === "Cfa" ? " on" : "") + '" data-code="' + t[0] + '"><b>' + t[0] + '</b>' + t[1] +
                '<small>' + escHtml(C(TYPE_CITY[t[0]]).kr) + '</small></button>';
            }).join("") + '</div>';
        }).join("") + '</div>' +
        '<p class="keyline sm">기호 칸을 누르면 → 위에서 기호 풀이와 대표 도시의 기후 그래프</p>',
      init: function (el) {
        el.querySelector(".types13").addEventListener("click", function (e) {
          const b = e.target.closest(".t13-i");
          if (!b) return;
          el.querySelectorAll(".t13-i").forEach(function (x) { x.classList.toggle("on", x === b); });
          el.querySelector(".code-read").innerHTML = codeRead(b.getAttribute("data-code"));
        });
      }
    },
    {
      title: "참고 — 경계 기준",
      html: '<div class="ref2">' +
          '<div class="ref"><h4>온대 · 냉대 경계</h4>' + pts(["이 교과서: 최한월 <b>−3℃</b> (쾨펜의 원래 기준)", "0℃를 경계로 쓰는 자료·지도도 있음", "서울(최한월 −2.4℃): −3℃ 기준 → 온대(Cw) / 0℃ 기준 → 냉대(Dw)"]) + '</div>' +
          '<div class="ref"><h4>건조 기후 경계</h4>' + pts(["이 교과서: 연강수량 <b>500mm 미만</b> (사막 250mm 미만) — 단순화 기준", "정밀 기준: 건조 한계가 기온·강수 계절에 따라 달라짐", "1-2 세계 기후 지도는 정밀 기준 적용 → 일부 경계 지역은 판별 결과와 다를 수 있음"]) + '</div>' +
          '<div class="ref"><h4>3차 구분</h4>' + pts(["이 교과서: <b>Cf만</b> a · b로 세분", "원래 쾨펜 구분: Cs · Cw · D에도 a · b · c · d, 건조 기후에 h · k", "b는 원래 「10℃ 이상인 달 4개 이상」 조건도 있음 — 교과서에서는 생략"]) + '</div>' +
        '</div>'
    },
    {
      title: "수치로 판별하기", kind: "quiz",
      quiz: {
        type: "mcq",
        q: "최난월 28℃ · 최한월 20℃ · 연강수량 2,000mm · 최소우월 80mm인 기후는?",
        options: ["Af", "Am", "Aw", "Cfa"],
        answer: 0,
        explain: "최난월 10℃ 이상 · 연강수량 500mm 이상 → 최한월 20℃ ≥ 18℃ → <b>A</b> / 최소우월 80mm ≥ 60mm → <b>f</b> → Af 열대 우림 기후"
      }
    },
    {
      title: "기호의 뜻", kind: "quiz",
      quiz: {
        type: "mcq",
        q: "지중해성 기후(Cs)의 s가 뜻하는 것은?",
        options: ["연중 습윤", "겨울 건조", "여름 건조", "사막"],
        answer: 2,
        explain: "s = 여름 건조 (여름 반년 최소우월 40mm 미만) — 여름에 건조하고 겨울에 비가 내리는 지중해성 기후"
      }
    },
    {
      title: "판별 순서", kind: "quiz",
      quiz: {
        type: "ox",
        q: "최난월 평균 기온이 10℃ 미만이면 강수량과 관계없이 한대 기후(E)임",
        answer: true,
        explain: "1차 구분은 <b>최난월 10℃ 미만(E)</b>을 가장 먼저 확인 — 강수량이 적어도 E로 판별"
      }
    },
    {
      title: "정리", kind: "summary",
      html: sumCards([
        { emo: "🌳", t: "쾨펜의 기후 구분", c: "#2f9e5b", float: true, d: ["<b>식생 분포</b>를 기준으로 구분", "수목 기후(A · C · D) · 무수목 기후(B · E)"] },
        { emo: "1️⃣", t: "1차 — 기후대", c: "#e0483a", float: true, d: ["<b>E</b> 최난월 10℃ 미만 → <b>B</b> 연강수량 500mm 미만", "→ <b>A</b> 최한월 18℃ 이상 → <b>C</b> −3℃ 초과 / <b>D</b>"] },
        { emo: "2️⃣", t: "2차 — 강수 · 세분", c: "#2b6fe3", float: true, d: ["<b>f</b> 연중 습윤 · <b>s</b> 여름 건조 · <b>w</b> 겨울 건조 · <b>m</b>", "<b>W · S</b> 건조 · <b>T · F</b> 한대"] },
        { emo: "3️⃣", t: "3차 — 여름 기온", c: "#e6a700", float: true, d: ["Cf만 세분", "<b>a</b> 최난월 22℃ 이상 · <b>b</b> 22℃ 미만"] }
      ])
    }
  ] };

  /* ==========================================================
     4-3 판별 연습
     ========================================================== */
  const PRACTICE = ["Singapore", "Darwin", "London", "Perth", "Seoul", "Rome", "Cairo", "Moscow", "Barrow"];
  const NUMS = "①②③④⑤⑥⑦⑧⑨";
  const blocks43 = PRACTICE.map(function (id, i) {
    const c = C(id);
    return {
      title: "도시 " + NUMS[i] + " 판별하기",
      html: '<div class="split judge-split">' +
          '<div class="split-main graph-main">' + ClimGraph.svg(c, { hideName: true, on: ["g18", "g10", "gm3"] }) +
            toggles([["tmax", "최난월", "t"], ["tmin", "최한월", "t"], ["pann", "연강수량", "p"], ["pmin", "최소우월", "p"], ["g22", "22℃ 선", "t"]]) + '</div>' +
          '<div class="split-side">' + JudgeBoard.html(c, { label: "도시 " + NUMS[i] }) + '</div>' +
        '</div>',
      init: function (el) { bindToggles(el.querySelector(".graph-main"), false); JudgeBoard.init(el); }
    };
  });
  CHAPTER_CONTENT["4-3"] = { blocks: blocks43 };
})();
