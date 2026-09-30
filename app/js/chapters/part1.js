/* ============================================================
   지오엑스-세계의 기후 — chapters/part1.js
   PART 1 기후의 이해 — 1-1 날씨와 기후 · 1-2 세계의 기후 지도 · 1-3 탐구 질문
   (파트기획/PART1_기후의_이해.md 기준, 화면 문구는 개조식)
   수치는 모두 앱 기후 자료(data/cities.js)·지도 자료(data/koppen-map.js)에서 계산해 표시
   2026-09-29 선생님 수정: 1-1 「날씨 vs 기후」부터 · 두 그래프(31일 · 30해) · 달 바꾸기 · 그림 카드 정리
                    1-2 지도 · 위도별 비율 · 가장 넓은 기후대 · 기후대 한눈에(상세 모달) · 정리
                    1-3 탐구 질문 3개 — 머리에 질문, 「정답 보기」 상세 모달
   ============================================================ */
"use strict";

(function () {
  const C = function (id) { return CITY_BY_ID[id]; };
  const num = function (v, d) { return (Math.round(v * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toLocaleString("ko-KR"); };
  const deg = function (v) { return (v < 0 ? "−" + num(-v, 1) : num(v, 1)) + "℃"; };
  const mean = function (a) { return ClimateChart.sum(a) / a.length; };
  const latTxt = function (c) { return num(Math.abs(c.lat), 1) + "°" + (c.lat >= 0 ? "N" : "S"); };
  const tmin = function (c) { return Math.min.apply(null, c.t); };
  const pAnn = function (c) { return ClimateChart.sum(c.p); };

  function pts(list, cls) {
    return '<ul class="pts' + (cls ? " " + cls : "") + '">' + list.map(function (t) { return "<li>" + fmtKo(t) + "</li>"; }).join("") + "</ul>";
  }
  function mapHost(key) { return '<div class="map-host" data-map="' + key + '"></div>'; }

  const seoul = C("Seoul"), london = C("London"), quebec = C("Quebec"), quito = C("Quito"),
        iquitos = C("Iquitos");
  const seoulSummer = seoul.p[5] + seoul.p[6] + seoul.p[7];

  /* ==========================================================
     1-1 날씨와 기후
     ========================================================== */

  /* 「날씨가 모여 기후가 됨」 — 두 그래프로 나눔 (예시 값, 평년값만 서울 실제 자료)
     ① 어느 해 1월: 31일 하루하루의 기온 막대  ② 30년 동안 해마다의 1월 평균 막대 30칸
     두 그래프는 같은 눈금 → 날씨(들쭉날쭉)와 기후(고른 평균)의 차이가 한눈에 */
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  const CA = (function () {
    const R = rng(20260929), T0 = seoul.t[0], PICK = 12;
    const years = [];
    for (let k = 0; k < 30; k++) years.push(T0 + (R() - .5) * 5);
    const ys = mean(years); years.forEach(function (v, k) { years[k] = v - ys + T0; });     // 30년 평균 = 평년값
    const days = [];
    for (let d = 0; d < 31; d++) days.push(years[PICK] + (R() - .5) * 13);
    const ds = mean(days); days.forEach(function (v, d) { days[d] = v - ds + years[PICK]; });   // 그해 1월 평균 = years[PICK]
    return { T0: T0, PICK: PICK, years: years, days: days };
  })();
  function caChart(kind) {
    const vals = kind === "day" ? CA.days : CA.years;
    const n = vals.length, W = 620, H = 380, L = 52, R = 18, T = 34, B = 46, lo = -8, hi = 8;
    const cw = (W - L - R) / n;
    const y = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
    const x = function (i) { return L + i * cw; };
    const ticks = kind === "day" ? [1, 5, 10, 15, 20, 25, 31] : [1, 5, 10, 15, 20, 25, 30];
    let s = '<svg class="ca-svg ' + kind + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + (kind === "day" ? "어느 해 1월 하루하루의 기온" : "30년 동안 해마다의 1월 평균 기온") + '">';
    for (let v = lo; v <= hi; v += 2) {
      s += '<line class="ca-grid' + (v === 0 ? " zero" : "") + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>' +
        ('<text class="ca-ax" x="' + (L - 8) + '" y="' + (y(v) + 5) + '" text-anchor="end">' + (v < 0 ? "−" + -v : v) + '</text>');
    }
    s += '<text class="ca-ax" x="' + (L - 8) + '" y="' + (T - 16) + '" text-anchor="end">℃</text>';
    s += '<g class="ca-bars">' + vals.map(function (v, i) {
      const y0 = y(0), y1 = y(v);
      return '<rect class="ca-bar' + (kind === "year" && i === CA.PICK ? " pick" : "") + (v >= 0 ? " pos" : "") + '" style="--i:' + i + '" x="' + (x(i) + cw * .14).toFixed(1) + '" y="' + Math.min(y0, y1).toFixed(1) +
        '" width="' + (cw * .72).toFixed(1) + '" height="' + Math.max(1.5, Math.abs(y1 - y0)).toFixed(1) + '" rx="2"/>';
    }).join("") + '</g>';
    s += ticks.map(function (t) { return '<text class="ca-ax x" x="' + (x(t - 1) + cw / 2).toFixed(1) + '" y="' + (H - B + 22) + '" text-anchor="middle">' + t + '</text>'; }).join("") +
      '<text class="ca-ax x u" x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end">' + (kind === "day" ? "(일)" : "(해 — 1년째 ~ 30년째)") + '</text>';
    const m = kind === "day" ? CA.years[CA.PICK] : CA.T0;
    s += '<g class="ca-mean ' + kind + '"><line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(m) + '" y2="' + y(m) + '"/>' +
      '<rect x="' + (W - R - 238) + '" y="' + (y(m) + 8) + '" width="238" height="38" rx="10"/>' +
      '<text x="' + (W - R - 119) + '" y="' + (y(m) + 34) + '" text-anchor="middle">' + (kind === "day" ? "그해 1월 평균 " + deg(m) : "평년값 " + deg(m) + " = 기후") + '</text></g>';
    return s + '</svg>';
  }

  const MONTH = new Date().getMonth();          // 오늘의 달 — 「오늘 기온」과 비교할 평년값

  CHAPTER_CONTENT["1-1"] = { blocks: [
    {
      title: "날씨 vs 기후",
      html: '<div class="vs">' +
        '<div class="vs-card weather">' + (Photo.html("sky-shower", { cls: "vsph" }) || '<div class="vs-emo" aria-hidden="true">🌦️</div>') + '<h4>날씨 <small>(일기)</small></h4>' +
          '<dl><dt>기간</dt><dd>몇 시간 ~ 며칠</dd><dt>특징</dt><dd>매일 바뀜</dd></dl>' +
          '<div class="vs-ex"><span>예</span>오늘 오후 소나기<br>내일 아침 영하 5℃</div></div>' +
        '<div class="vs-mid" aria-hidden="true">≠</div>' +
        '<div class="vs-card climate">' + (Photo.html("sahara", { cls: "vsph" }) || '<div class="vs-emo" aria-hidden="true">📅</div>') + '<h4>기후</h4>' +
          '<dl><dt>기간</dt><dd>30년 평균</dd><dt>특징</dt><dd>해마다 비슷하게 반복</dd></dl>' +
          '<div class="vs-ex"><span>예</span>서울: 여름에 강수 집중<br>사하라: 일 년 내내 건조</div></div>' +
      '</div>' +
      '<p class="keyline"><b>기후</b> = 한 지역에서 오랜 기간 나타나는 날씨의 평균적·종합적 상태</p>'
    },
    {
      title: "날씨가 모여 기후가 됨",
      html: '<div class="anim-host ca-host" data-step="3"><div class="ca-two">' +
          '<div class="chart-card ca-card day"><div class="ca-t"><span class="chip-lbl weather">날씨</span>어느 해 1월 — 하루하루의 기온 (31일)</div>' + caChart("day") + '</div>' +
          '<div class="chart-card ca-card year"><div class="ca-t"><span class="chip-lbl climate">기후</span>30년 동안 해마다의 1월 평균 (30해)</div>' + caChart("year") + '</div>' +
        '</div></div>' +
        pts(["하루하루의 기온(날씨)은 들쭉날쭉", "해마다의 1월 평균을 30년 모아 평균 → 거의 변하지 않는 값 = <b>평년값(기후)</b>", "두 그래프는 같은 눈금 · 막대는 예시 값, 평년값만 서울 실제 자료"], "inline"),
      init: function (el) {
        const host = el.querySelector(".anim-host");
        Anim.player(host, {
          steps: ["하루하루의 날씨", "그해 1월 평균", "30년 동안의 1월 평균", "30년 평균 = 평년값"],
          interval: 2600, start: 3,
          onStep: function (k) { host.setAttribute("data-step", k); }
        });
      }
    },
    {
      title: "서울로 보기",
      html: '<div class="split center">' +
        '<div class="split-main two-stats">' +
          '<div class="stat blank today"><span class="chip-lbl weather">날씨</span><div class="stat-name">오늘 서울의 기온</div>' +
            '<label class="today-in"><input type="number" step="0.1" inputmode="decimal" placeholder="?" aria-label="오늘 서울의 기온 입력"><span>℃</span></label>' +
            '<div class="stat-cap today-cmp">일기 예보에서 확인 → 숫자 입력</div></div>' +
          '<div class="stat"><span class="chip-lbl climate">기후</span><div class="stat-name">서울 <b class="sm-mon">' + (MONTH + 1) + '</b>월 평균 기온</div>' +
            '<div class="stat-big sm-val">' + deg(seoul.t[MONTH]) + '</div><div class="stat-cap">평년값 — 30년 동안의 평균</div></div>' +
        '</div>' +
        '<div class="split-side"><div class="mon-pick"><div class="mon-pick-t">달 바꾸기</div><div class="mon-pick-b" role="group" aria-label="달 고르기">' +
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (m) { return '<button type="button" class="mp-b' + (m === MONTH ? " on" : "") + '" data-m="' + m + '">' + (m + 1) + '</button>'; }).join("") + '</div></div>' +
          '<div class="chart-card"><div class="chart-t">서울 월평균 기온 (평년값) — <span class="sm-mon">' + (MONTH + 1) + '</span>월 강조</div><div class="sm-chart">' +
          ClimateChart.svg(seoul, { show: "t", mark: [MONTH] }) + '</div></div>' +
          pts(["평년값: 30년 동안의 평균값", "세계 기상 기구(WMO) 기준, 10년마다 새로 계산 — 현재 1991~2020년"], "sm") +
        '</div>' +
      '</div>',
      init: function (el) {
        const inp = el.querySelector(".today-in input"), out = el.querySelector(".today-cmp");
        let mon = MONTH;
        function compare() {
          const v = parseFloat(inp.value);
          if (isNaN(v)) { out.textContent = "일기 예보에서 확인 → 숫자 입력"; return; }
          const d = v - seoul.t[mon];
          out.innerHTML = Math.abs(d) < 0.05 ? "평년과 같음" : "평년(" + deg(seoul.t[mon]) + ")보다 <b>" + num(Math.abs(d), 1) + "℃ " + (d > 0 ? "높음" : "낮음") + "</b> — 날씨는 평년값과 다를 수 있음";
        }
        inp.addEventListener("input", compare);
        /* 달 바꾸기: 다른 달의 평년값과 그래프 강조 */
        el.querySelector(".mon-pick").addEventListener("click", function (e) {
          const b = e.target.closest(".mp-b");
          if (!b) return;
          mon = +b.getAttribute("data-m");
          el.querySelectorAll(".mp-b").forEach(function (x) { x.classList.toggle("on", x === b); });
          el.querySelectorAll(".sm-mon").forEach(function (x) { x.textContent = mon + 1; });
          el.querySelector(".sm-val").textContent = deg(seoul.t[mon]);
          el.querySelector(".sm-chart").innerHTML = ClimateChart.svg(seoul, { show: "t", mark: [mon] });
          compare();
        });
      }
    },
    {
      title: "날씨일까, 기후일까?", kind: "quiz",
      quiz: {
        type: "sort", bins: ["날씨", "기후"],
        q: "날씨와 기후를 구분해 보자",
        items: [
          { t: "오늘 오후 서울에 소나기가 내림", a: 0 },
          { t: "서울은 여름에 강수가 집중됨", a: 1 },
          { t: "내일 아침 기온은 영하 5℃까지 내려감", a: 0 },
          { t: "사하라 사막은 일 년 내내 건조함", a: 1 },
          { t: "이번 주말 태풍이 남해안에 상륙함", a: 0 },
          { t: "런던은 겨울에도 비교적 온화함", a: 1 },
          { t: "어제 강원도에 폭설이 내림", a: 0 },
          { t: "싱가포르는 일 년 내내 덥고 습함", a: 1 }
        ],
        explain: "특정한 날·짧은 기간의 대기 상태 → <b>날씨</b> / 해마다 반복되는 평균적인 상태 → <b>기후</b>"
      }
    },
    {
      title: "정리", kind: "summary",
      html: sumCards([
        { emo: "🌦️", t: "날씨", d: "짧은 기간의 대기 상태 — 매일 바뀜", c: "#2b9bd6" },
        { emo: "📅", t: "기후", d: "오랜 기간(30년)의 평균적인 대기 상태", c: "#2f9e5b" },
        { emo: "📊", t: "평년값", d: "30년 동안의 평균 — 10년마다 새로 계산", c: "#e0a800" },
        { emo: "🌡️", t: "기후 요소", d: "기온 · 강수 · 바람 → 2-1에서 학습", c: "#e2632b" }
      ])
    }
  ] };

  /* ==========================================================
     1-2 세계의 기후 지도
     ========================================================== */
  const NATL = [-102, 66, 34, 24];       // 북대서양 (런던·퀘벡)
  const SAM = [-96, 16, -30, -26];       // 남아메리카 북부 (키토·이키토스)
  function makeMap(el, key, opts) {
    return WorldMap.create(el.querySelector('.map-host[data-map="' + key + '"]'), opts);
  }

  /* 기후대 한눈에 — 카드를 누르면 상세 모달(큰 기후 그래프 + 설명) */
  const ZONE_CARDS = [
    { z: "A", city: "Singapore", t: "연중 고온, 강수 많음",
      d: ["최한월 평균 기온 18℃ 이상 — 일 년 내내 더움", "적도 부근 — 적도 저압대의 상승 기류로 강수 많음(스콜)", "열대 우림(Af) · 열대 몬순(Am) · 사바나(Aw)"] },
    { z: "B", city: "Cairo", t: "강수량보다 증발량이 많음",
      d: ["연강수량 500mm 미만 — 나무가 자라기 어려움", "위도 20°~30° 부근(아열대 고압대) · 대륙 내부 · 한류 연안", "사막(BW, 250mm 미만) · 스텝(BS, 250~500mm)"] },
    { z: "C", city: "London", t: "사계절 뚜렷, 겨울 온화",
      d: ["최한월 −3℃ 초과 18℃ 미만 — 겨울이 비교적 온화함", "중위도(약 30°~50°) 대륙의 서안과 동안", "온난 습윤(Cfa) · 서안 해양성(Cfb) · 지중해성(Cs) · 온대 겨울 건조(Cw)"] },
    { z: "D", city: "Moscow", t: "겨울이 길고 추움",
      d: ["최한월 −3℃ 이하 · 최난월 10℃ 이상 — 겨울이 길고 추움, 연교차 큼", "북반구 고위도의 넓은 대륙 — 남반구에는 거의 없음", "냉대 습윤(Df) · 냉대 겨울 건조(Dw) — 침엽수림(타이가)"] },
    { z: "E", city: "Barrow", t: "가장 따뜻한 달도 서늘함",
      d: ["최난월 평균 기온 10℃ 미만 — 나무가 자라지 못함", "극 지방 · 북극해 연안 · 그린란드 · 남극", "툰드라(ET, 최난월 0~10℃) · 빙설(EF, 최난월 0℃ 미만)"] },
    { z: "H", city: "Quito", t: "해발 고도가 높아 서늘함",
      d: ["해발 고도가 높아 같은 위도의 저지대보다 서늘함", "적도 부근 고산 — 연중 봄 같은 날씨(상춘 기후), 일교차 큼", "안데스 산지(키토 · 보고타 · 라파스) · 에티오피아 고원"] }
  ];
  function statLine(c) {
    return escHtml(c.kr) + " · 최난월 " + deg(Math.max.apply(null, c.t)) + " · 최한월 " + deg(tmin(c)) + " · 연강수량 " + num(pAnn(c)) + "mm";
  }
  function zoneModal(k) {
    const c = C(k.city), Z = ZONES[k.z];
    Modal.open({
      tag: k.z, title: Z.name + " 기후", color: Z.color,
      html: '<div class="zm">' +
          '<div class="zm-graph">' + ClimGraph.svg(c, { title: "대표 도시 — " + escHtml(c.kr) + " (" + latTxt(c) + ")" }) + '</div>' +
          '<div class="zm-side"><p class="zm-lead">' + k.t + '</p>' +
            '<ul class="zm-pts">' + k.d.map(function (t) { return "<li>" + fmtKo(t) + "</li>"; }).join("") + '</ul>' +
            '<p class="zm-stat">' + statLine(c) + '</p></div>' +
        '</div>'
    });
  }

  /* 기후대별 육지 면적 막대 (지도 자료에서 계산 — tools/build-koppen-map.py) */
  function areaBars(set) {
    const a = KOPPEN_MAP.areas[set];
    const order = ["A", "B", "C", "D", "E"].sort(function (p, q) { return a[q] - a[p]; });
    const max = Math.max.apply(null, order.map(function (z) { return a[z]; }));
    return order.map(function (z, i) {
      return '<div class="ab-row' + (i === 0 ? " top" : "") + '" style="--zc:' + ZONES[z].color + ';--w:' + (a[z] / max * 100) + '%">' +
        '<span class="ab-z"><b>' + z + '</b>' + ZONES[z].name + '</span><span class="ab-bar"><i></i></span><span class="ab-v">' + num(a[z], 1) + '%</span></div>';
    }).join("");
  }

  /* 위도별 기후대 비율 — 세계 기후 지도 격자(0.5°)를 10° 띠로 묶어 육지 칸 수로 계산 */
  const CODE_ZONE = [null, "A", "A", "A", "B", "B", "C", "C", "C", "C", "D", "D", "E", "E"];
  const LAT_BANDS = [];
  (function () {
    const M = KOPPEN_MAP, cnt = {};
    M.grid.split(";").forEach(function (row, i) {
      const lat = M.north - (i + 0.5) * M.res, b = Math.floor(lat / 10) * 10;   // 띠 아래쪽 위도
      if (lat < -60 || lat > 80) return;
      const c = cnt[b] || (cnt[b] = { A: 0, B: 0, C: 0, D: 0, E: 0, n: 0 });
      row.split(",").forEach(function (run) {
        const z = CODE_ZONE[run.charCodeAt(0) - 65], n = parseInt(run.slice(1), 36);
        if (z) { c[z] += n; c.n += n; }
      });
    });
    for (let b = 70; b >= -60; b -= 10) if (cnt[b] && cnt[b].n) LAT_BANDS.push({ lo: b, c: cnt[b] });
  })();
  function bandLat(v) { return v === 0 ? "0°" : Math.abs(v) + "°" + (v > 0 ? "N" : "S"); }
  function latProfile() {
    return '<div class="lp">' + LAT_BANDS.map(function (b) {
      const hi = b.lo + 10;
      return '<div class="lp-row' + (b.lo === 0 || b.lo === -10 ? " eq" : "") + '"><span class="lp-l">' + bandLat(hi) + ' ~ ' + bandLat(b.lo) + '</span><span class="lp-bar">' +
        ["A", "B", "C", "D", "E"].map(function (z) {
          const p = b.c[z] / b.c.n * 100;
          return p < 0.5 ? "" : '<i data-z="' + z + '" style="width:' + p.toFixed(2) + '%;--zc:' + ZONES[z].color + '" title="' + ZONES[z].name + ' ' + num(p, 0) + '%">' + (p >= 7 ? num(p, 0) + "%" : "") + '</i>';
        }).join("") + '</span></div>';
    }).join("") + '</div>';
  }

  CHAPTER_CONTENT["1-2"] = { blocks: [
    {
      title: "세계 기후 지도",
      html: pts(["색 하나 = 기후대 하나", "범례 누르기 → 해당 기후대만 강조 · 「전체」 → 모두 보기", "위도선 → 기후대가 위도를 따라 띠 모양", "지역 버튼 → 확대"], "inline") + mapHost("all"),
      init: function (el) { makeMap(el, "all", { highland: true, regions: true, allKey: true, latToggle: true }); }
    },
    {
      title: "위도별 기후대 비율",
      html: '<div class="lp-card one"><div class="lp-top"><span class="area-t">위도 10°마다 육지에서 각 기후대가 차지하는 비율</span>' +
          '<span class="lp-keys" role="group">' + ["A", "B", "C", "D", "E"].map(function (z) {
            return '<button type="button" class="lp-key" data-z="' + z + '" style="--zc:' + ZONES[z].color + '"><b>' + z + '</b>' + ZONES[z].name + '</button>'; }).join("") +
          '</span></div>' + latProfile() + '<div class="area-src">세계 기후 지도(0.5° 격자) 자료로 계산 · 80°N ~ 60°S · 기후대 버튼 → 그 기후대만 강조</div></div>',
      init: function (el) {
        const lp = el.querySelector(".lp");
        el.querySelector(".lp-keys").addEventListener("click", function (e) {
          const b = e.target.closest(".lp-key");
          if (!b) return;
          const on = !b.classList.contains("on");
          el.querySelectorAll(".lp-key").forEach(function (x) { x.classList.toggle("on", on && x === b); });
          lp.setAttribute("data-focus", on ? b.getAttribute("data-z") : "");
        });
      }
    },
    {
      title: "가장 넓은 기후대는?",
      html: '<div class="area-card one">' +
          '<div class="area-top"><span class="area-t">세계 육지 면적에서 기후대가 차지하는 비율</span>' +
            '<span class="area-sw" role="group"><button type="button" class="on" data-set="noAnt">남극 제외</button><button type="button" data-set="all">남극 포함</button></span></div>' +
          '<div class="area-bars">' + areaBars("noAnt") + '</div>' +
          '<div class="area-src">세계 기후 지도(0.5° 격자) 자료로 계산 · 고산 기후는 따로 나누지 않음</div>' +
        '</div>',
      init: function (el) {
        el.querySelector(".area-sw").addEventListener("click", function (e) {
          const b = e.target.closest("button[data-set]");
          if (!b) return;
          el.querySelectorAll(".area-sw button").forEach(function (x) { x.classList.toggle("on", x === b); });
          el.querySelector(".area-bars").innerHTML = areaBars(b.getAttribute("data-set"));
        });
      }
    },
    {
      title: "기후대 한눈에",
      html: '<div class="zcards">' + ZONE_CARDS.map(function (k, i) {
        const c = C(k.city);
        return '<button type="button" class="zcard" data-i="' + i + '" style="--zc:' + ZONES[k.z].color + '">' +
          '<span class="zc-code">' + k.z + '</span>' +
          '<span class="zc-name">' + ZONES[k.z].name + ' 기후</span>' +
          '<span class="zc-t">' + k.t + '</span>' +
          '<span class="zc-chart">' + ClimateChart.svg(c, {}) + '</span>' +
          '<span class="zc-city">' + statLine(c) + '</span>' +
          '<span class="zc-go">자세히 보기 +</span></button>';
      }).join("") + '</div>' +
      '<p class="keyline sm">카드 누르기 → 큰 기후 그래프와 설명</p>',
      init: function (el) {
        el.querySelector(".zcards").addEventListener("click", function (e) {
          const b = e.target.closest(".zcard");
          if (b) zoneModal(ZONE_CARDS[+b.getAttribute("data-i")]);
        });
      }
    },
    {
      title: "정리", kind: "summary",
      html: sumCards([
        { emo: "🌍", t: "기후대", d: "열대 · 건조 · 온대 · 냉대 · 한대 + 고산", c: "#2b6fe3" },
        { emo: "🧭", t: "띠 모양 분포", d: "적도 → 극: 위도를 따라 띠 모양으로 나타남", c: "#8e5cc8" },
        { emo: "🏜️", t: "가장 넓은 기후대", d: "건조 기후 — 육지의 약 " + num(KOPPEN_MAP.areas.noAnt.B, 0) + "%", c: "#e6a700" },
        { emo: "⛰️", t: "고산 기후", d: "해발 고도가 높은 곳 — 저지대보다 서늘함", c: "#8a8f98" }
      ])
    }
  ] };

  /* ==========================================================
     1-3 탐구 질문 — 블록 머리에 「탐구 질문 n」 + 질문, 「정답 보기」 → 상세 모달
     ========================================================== */
  function question(Q, visual) {
    return '<div class="split q-split">' +
      '<div class="split-side q-side">' +
        '<div class="q-evid">' + Q.evid.map(function (e) { return '<span class="evid">' + fmtKo(e) + '</span>'; }).join("") + '</div>' +
        '<div class="guess"><div class="guess-t">예상해 보기 <small>— 손들기 수만큼 누르기</small><button type="button" class="guess-reset" aria-label="예상 투표 초기화">↺</button></div>' +
          Q.guess.map(function (g, i) { return '<button type="button" class="guess-b" data-i="' + i + '"><span>' + fmtKo(g) + '</span><b>0</b></button>'; }).join("") + '</div>' +
        '<button type="button" class="qz-btn q-answer">정답 보기</button>' +
      '</div>' +
      '<div class="split-main q-main">' + visual + (Q.photo ? Photo.html(Q.photo, { cls: "inset" + (Q.photoPos ? " " + Q.photoPos : "") }) : "") + '</div>' +
    '</div>';
  }
  function answerModal(n, Q) {
    const A = Q.ans;
    Modal.open({
      tag: "탐구 질문 " + n + " — 정답", title: fmtKo(Q.q), color: "#8a5cc8",
      html: '<div class="ans">' +
          '<div class="ans-stats">' + A.stats.map(function (s) {
            return '<div class="ans-stat' + (s[2] ? " " + s[2] : "") + '"><span>' + s[0] + '</span><b>' + s[1] + '</b></div>'; }).join("") + '</div>' +
          '<div class="ans-why n' + A.why.length + '">' + A.why.map(function (w) {
            return '<div class="ans-w"><span class="ans-emo" aria-hidden="true">' + w[0] + '</span><b>' + w[1] + '</b><p>' + fmtKo(w[2]) + '</p></div>'; }).join("") + '</div>' +
          '<p class="ans-key">' + fmtKo(A.key) + '</p>' +
          '<p class="ans-more">더 자세히: ' + A.more + '</p>' +
        '</div>'
    });
  }
  function bindQuestion(el, n, Q) {
    el.addEventListener("click", function (e) {
      const b = e.target.closest(".guess-b");
      if (b) { const c = b.querySelector("b"); c.textContent = +c.textContent + 1; b.classList.add("voted"); return; }
      if (e.target.closest(".guess-reset")) { el.querySelectorAll(".guess-b").forEach(function (x) { x.querySelector("b").textContent = "0"; x.classList.remove("voted"); }); return; }
      if (e.target.closest(".q-answer")) answerModal(n, Q);
    });
  }

  const dQ = mean(iquitos.t) - mean(quito.t);
  const QUESTIONS = [
    { q: "런던이 퀘벡보다 고위도인데 겨울이 더 따뜻한 까닭은?",
      evid: ["런던(" + latTxt(london) + ") 1월 " + deg(london.t[0]), "퀘벡(" + latTxt(quebec) + ") 1월 " + deg(quebec.t[0])],
      guess: ["따뜻한 바닷물(해류)의 영향", "바다에서 불어오는 바람", "높은 산맥이 찬 바람을 막아서"],
      map: "q3", photo: "norway-harbour",
      opts: { view: NATL, latLines: true, legend: false, cities: [{ id: "London", emph: true }, { id: "Quebec", emph: true }] },
      ans: {
        stats: [["런던 " + latTxt(london) + " · 1월", deg(london.t[0]), "warm"], ["퀘벡 " + latTxt(quebec) + " · 1월", deg(quebec.t[0]), "cold"], ["1월 기온 차", "약 " + num(london.t[0] - quebec.t[0], 0) + "℃", ""]],
        why: [["🌊", "북대서양 해류(난류)", "저위도의 따뜻한 바닷물이 서유럽 앞바다까지 흘러와 바다를 데움"],
              ["🌬️", "편서풍", "따뜻한 바다 위를 지난 공기가 대륙 서안(런던)으로 불어 옴 → 겨울 온화"],
              ["❄️", "퀘벡은 대륙 동안", "대륙을 지나온 차가운 바람 + 래브라도 해류(한류) → 겨울 매우 추움"]],
        key: "같은 위도라도 <b>해류</b>와 <b>바다·육지의 위치(수륙 분포)</b>에 따라 겨울 기온이 크게 달라짐",
        more: "2-2 기후 요인 — 해류 · 수륙 분포"
      } },
    { q: "우리나라 강수가 여름에 집중되는 까닭은?",
      evid: ["서울 6~8월 강수량 " + num(seoulSummer) + "mm", "연강수량 " + num(pAnn(seoul)) + "mm의 약 " + num(seoulSummer / pAnn(seoul) * 100, 0) + "%"],
      guess: ["여름에 바다에서 습한 바람이 불어와서", "장마 전선이 머물러서", "태풍 때문에만"],
      chart: true, photo: "monsoon-rain", photoPos: "tl",
      ans: {
        stats: [["서울 6~8월 강수량", num(seoulSummer) + "mm", "rain"], ["연강수량", num(pAnn(seoul)) + "mm", ""], ["여름 비율", "약 " + num(seoulSummer / pAnn(seoul) * 100, 0) + "%", "rain"]],
        why: [["🔄", "여름 계절풍", "여름에 대륙이 더 뜨거워짐 → 바다(북태평양)에서 대륙으로 습한 바람"],
              ["🌀", "장마 전선", "초여름 오호츠크해 기단과 북태평양 기단이 만나 전선이 머물며 비"],
              ["⛈️", "태풍", "늦여름~초가을 많은 비를 더함 — 태풍만의 영향은 아님"],
              ["❄️", "겨울은 건조", "대륙에서 차고 건조한 북서 계절풍 → 강수 적음"]],
        key: "여름에는 <b>습한 계절풍</b>과 <b>장마 전선</b>, 겨울에는 건조한 계절풍 → 강수가 여름에 집중",
        more: "2-2 기후 요인 — 계절풍 · 기단과 전선"
      } },
    { q: "적도 부근인데도 서늘한 도시가 있는 까닭은?",
      evid: ["키토(" + latTxt(quito) + ") 연평균 기온 약 " + num(mean(quito.t), 0) + "℃", "이키토스(" + latTxt(iquitos) + ") 연평균 기온 약 " + num(mean(iquitos.t), 0) + "℃"],
      guess: ["높은 곳이라서", "구름이 많아서", "차가운 해류 때문에"],
      map: "q5", photo: "quito",
      opts: { view: SAM, latLines: true, legend: false, cities: [{ id: "Quito", emph: true }, { id: "Iquitos", emph: true }] },
      ans: {
        stats: [["키토 · 해발 약 2,850m", "연평균 " + deg(mean(quito.t)), "cold"], ["이키토스 · 해발 약 100m", "연평균 " + deg(mean(iquitos.t)), "warm"], ["기온 차", "약 " + num(dQ, 0) + "℃", ""]],
        why: [["⛰️", "해발 고도", "높이 올라갈수록 기온 하강 — 100m마다 약 0.5~0.6℃"],
              ["🧮", "계산해 보기", "높이 차 약 2,750m × 0.5℃/100m ≈ 약 14℃ 낮아짐 → 실제 차 약 " + num(dQ, 0) + "℃"],
              ["🌤️", "상춘 기후", "적도 부근이라 연중 기온 변화 작음 → 일 년 내내 봄 같은 날씨"]],
        key: "적도 부근이라도 <b>해발 고도</b>가 높으면 서늘함 → <b>고산 기후(H)</b>",
        more: "2-2 기후 요인 — 지형 · 5-6 고산 기후"
      } }
  ];

  const blocks13 = QUESTIONS.map(function (Q, i) {
    const visual = Q.chart
      ? '<div class="chart-card big"><div class="chart-t">서울 월 강수량 (평년값) — 6~8월 강조</div>' + ClimateChart.svg(seoul, { show: "p", mark: [5, 6, 7] }) + '</div>'
      : mapHost(Q.map);
    return {
      title: Q.q, kind: "think", tag: "탐구 질문 " + (i + 1),
      html: question(Q, visual),
      init: function (el) { if (Q.map) makeMap(el, Q.map, Q.opts); bindQuestion(el, i + 1, Q); }
    };
  });
  CHAPTER_CONTENT["1-3"] = { blocks: blocks13 };
})();
