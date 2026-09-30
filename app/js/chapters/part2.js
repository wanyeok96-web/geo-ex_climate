/* ============================================================
   지오엑스-세계의 기후 — chapters/part2.js
   PART 2 기후 요소와 기후 요인 — 2-1 · 2-2 챕터 내용 (파트기획/PART2 5절)
   - 첫 내용 블록 = 노드형 블록 (ui/nodes.js): 기본 개념 + 노드 → 누르면 설명·시각 자료
   - 시각 자료는 chapters/part2-figs.js (P2F), 수치는 data/cities.js에서 계산
   - 모든 문구는 AI 초안 — 교사 검토 필요
   ============================================================ */
"use strict";

(function () {
  const U = P2F.util;
  const C = function (id) { return CITY_BY_ID[id]; };
  function pts(list, cls) {
    return '<ul class="pts' + (cls ? " " + cls : "") + '">' + list.map(function (s) { return "<li>" + fmtKo(s) + "</li>"; }).join("") + "</ul>";
  }
  function goBtn(id, label) {
    const p = PAGE_BY_ID[id];
    return '<a class="go-chip" href="#' + id + '" data-go="' + id + '"><span class="cid">' + id + '</span>' + escHtml(label || (p ? p.title : id)) + ' <span aria-hidden="true">→</span></a>';
  }
  function range(c) { return U.maxOf(c.t) - U.minOf(c.t); }

  const seoul = C("Seoul"), singapore = C("Singapore"), ulaan = C("Ulaanbaatar"), vancouver = C("Vancouver");
  const london = C("London"), quebec = C("Quebec"), lima = C("Lima"), quito = C("Quito"), iquitos = C("Iquitos");
  const barrow = C("Barrow"), mumbai = C("Mumbai");
  const seoulSummer = seoul.p[5] + seoul.p[6] + seoul.p[7];
  /* 종합 — 도시로 읽는 기후 요인: [노드, 소주제, 설명] */
  const READ_CITY = [
    { id: "London", on: ["tmin", "range"], fact: "고위도(51.5°N)인데 1월 평균 " + U.deg(london.t[0]) + " — 겨울이 온화하고 연중 비",
      f: [["cur", 1, "북대서양 해류(난류)가 바다를 데움"], ["land", 2, "편서풍이 바다의 공기를 실어 오는 대륙 서안"]] },
    { id: "Ulaanbaatar", on: ["range"], fact: "기온의 연교차 " + U.n1(range(ulaan)) + "℃ — 여름은 덥고 겨울은 매우 추움",
      f: [["land", 1, "바다에서 먼 대륙 내부 — 빨리 데워지고 빨리 식음"], ["am", 0, "겨울에 차갑고 건조한 시베리아 기단의 영향"]] },
    { id: "Lima", on: ["pann"], fact: "해안 도시인데 연강수량 약 " + U.n0(U.sum(lima.p)) + "mm",
      f: [["cur", 2, "페루 해류(한류) — 공기 아래가 차가워 상승하지 않음"]] },
    { id: "Quito", on: ["tmean"], fact: "적도 바로 아래인데 연평균 " + U.deg(U.mean(quito.t)),
      f: [["ter", 0, "해발 약 2,850m — 높이 올라갈수록 기온 하강"], ["lat", 0, "적도 부근 — 계절에 따른 기온 차 작음"]] },
    { id: "Seoul", on: ["pmax", "range"], fact: "6~8월 강수가 연강수량의 약 " + Math.round(seoulSummer / U.sum(seoul.p) * 100) + "% · 겨울은 춥고 건조",
      f: [["mon", 1, "여름 계절풍(바다 → 육지)이 습한 공기를 실어 옴"], ["am", 2, "초여름 장마 전선이 머물며 비"], ["land", 2, "대륙 동안 — 겨울에 대륙의 찬 바람"]] },
    { id: "Singapore", on: ["tmin", "pann"], fact: "연평균 " + U.deg(U.mean(singapore.t)) + " · 연강수량 약 " + U.n0(U.sum(singapore.p)) + "mm",
      f: [["lat", 0, "적도 부근 — 태양 에너지를 가장 많이 받음"], ["lat", 2, "에너지 과잉 → 상승 기류 → 대류성 강수(→ PART 3)"]] }
  ];
  const RANGE_Q = [C("London"), C("Singapore"), C("Khabarovsk"), C("Sydney")];
  /* 해안 사막 문제용 세계 지도 (육지 윤곽 + 번호 표시) */
  function coastMap() {
    const pts = [[-2, 47], [-74, -20], [134, 32], [-38, -12]];
    return '<svg class="coast-map" viewBox="-180 -75 360 135" role="img" aria-label="세계 지도의 네 해안">' +
      '<rect x="-180" y="-75" width="360" height="135" fill="#dcebf7"/><path d="' + KOPPEN_MAP.land + '" fill="#f4efe2" stroke="#9aa6b8" stroke-width=".4"/>' +
      pts.map(function (p, i) {
        return '<g class="cm-pt"><circle cx="' + p[0] + '" cy="' + (-p[1]) + '" r="6.5"/><text x="' + p[0] + '" y="' + (-p[1] + 3.4) + '" text-anchor="middle">' + (i + 1) + '</text></g>';
      }).join("") + '</svg>';
  }

  /* ==========================================================
     2-1 기후 요소
     ========================================================== */
  const DEF21 = {
    intro:
      '<div class="nd-def"><b>기후 요소</b> — 기후를 이루는 대기 현상의 여러 요소</div>' +
      pts([
        "3대 기후 요소: <b>기온 · 강수 · 바람</b> (그 밖에 습도 · 일조 · 구름양 등)",
        "기후 요소의 값을 <b>오랜 기간(30년) 평균</b> → 그 지역의 기후를 나타냄"
      ]) +
      '<p class="nd-hint">아래 카드를 누르면 → 개념 설명과 시각 자료</p>',
    nodes: [
      { id: "temp", emoji: "🌡️", name: "기온", color: "#e0483a",
        desc: "공기의 차고 따뜻한 정도",
        topics: [
          { t: "의미",
            pts: [
              "기온: 대기의 온도 — 단위 ℃",
              "지면에서 약 <b>1.5m 높이</b>의 그늘에서 측정",
              "햇빛·지면의 열을 피하려고 <b>백엽상</b>이나 자동 기상 관측 장비 사용"
            ],
            terms: ["기온", "백엽상", "자동 기상 관측 장비"],
            fig: P2F.tMeasure },
          { t: "평균 기온",
            pts: [
              "하루 평균 → <b>월평균 기온</b> → <b>연평균 기온</b> 순으로 계산",
              "기후 그래프의 꺾은선 = 월평균 기온 12개",
              "서울 연평균 기온 약 " + U.deg(U.mean(seoul.t))
            ],
            terms: ["월평균 기온", "연평균 기온"],
            fig: P2F.tMean },
          { t: "기온의 연교차",
            pts: [
              "<b>기온의 연교차</b> = 최난월 평균 기온 − 최한월 평균 기온",
              "적도 부근: 연교차 작음 (싱가포르 " + U.n1(range(singapore)) + "℃)",
              "고위도·대륙 내부: 연교차 큼 (울란바토르 " + U.n1(range(ulaan)) + "℃)"
            ],
            terms: ["최난월", "최한월", "기온의 연교차", "일교차"],
            links: goBtn("2-2", "까닭은 기후 요인에서") + goBtn("4-1"),
            fig: P2F.tRange }
        ] },
      { id: "prec", emoji: "🌧️", name: "강수", color: "#2b6fe3",
        desc: "비·눈·우박 등 하늘에서 떨어지는 물",
        topics: [
          { t: "의미",
            pts: [
              "강수: 대기 중의 수증기가 비·눈·우박 등으로 지표에 떨어지는 현상",
              "<b>강수량</b>: 떨어진 물이 고인 깊이 — 단위 mm, 우량계로 측정",
              "눈은 녹여서 물의 양으로 잼"
            ],
            terms: ["강수", "강수량", "우량계"],
            fig: P2F.pMeasure },
          { t: "비가 내리는 원리",
            pts: [
              "공기 상승 → 냉각 → 수증기 응결 → 구름 → 강수",
              "공기를 상승시키는 원인에 따라 <b>대류성 · 지형성 · 전선성 · 저기압성</b> 강수",
              "공기가 하강하는 곳 → 구름이 생기지 않아 건조"
            ],
            terms: ["응결", "대류성 강수", "지형성 강수", "전선성 강수", "저기압성 강수"],
            fig: P2F.pLift },
          { t: "연강수량과 강수 계절",
            pts: [
              "<b>연강수량</b> = 열두 달 강수량의 합",
              "양이 같아도 <b>어느 계절에 내리는가</b>에 따라 기후가 다름",
              "서울: 여름(6~8월)에 약 " + U.pct(seoulSummer, U.sum(seoul.p)) + "% 집중"
            ],
            terms: ["연강수량", "강수의 계절 분포"],
            links: goBtn("2-2", "여름 집중의 까닭 — 기후 요인"),
            fig: P2F.pSeason }
        ] },
      { id: "wind", emoji: "🌬️", name: "바람", color: "#2f9e8f",
        desc: "기압 차로 생기는 공기의 수평 이동",
        topics: [
          { t: "기압과 바람",
            pts: [
              "기압: 공기의 무게가 누르는 힘 — 단위 hPa",
              "바람: <b>고기압 → 저기압</b>으로 부는 공기의 이동",
              "두 곳의 기압 차가 클수록 바람이 강함"
            ],
            terms: ["기압", "고기압", "저기압", "hPa"],
            fig: P2F.wPressure },
          { t: "풍향과 풍속",
            pts: [
              "<b>풍향</b>: 바람이 <b>불어오는</b> 방향 — 북서풍 = 북서쪽에서 불어오는 바람",
              "16방위로 나타냄",
              "<b>풍속</b>: 바람의 빠르기 — 단위 m/s"
            ],
            terms: ["풍향", "풍속", "16방위"],
            fig: P2F.wDirection },
          { t: "여러 규모의 바람",
            pts: [
              "지구 규모: 대기 대순환 — 무역풍 · 편서풍 · 극동풍",
              "계절 규모: 계절풍 — 여름과 겨울의 풍향이 반대",
              "지역 규모: 해륙풍 · 산곡풍 — 하루 동안 풍향이 바뀜"
            ],
            terms: ["해풍", "육풍", "계절풍", "대기 대순환"],
            links: goBtn("3-6", "지구 규모의 바람") + goBtn("2-2", "계절풍"),
            fig: P2F.wScale }
        ] }
    ]
  };

  CHAPTER_CONTENT["2-1"] = { blocks: [
    {
      title: "기후 요소",
      html: function () { return Nodes.html("2-1", DEF21); },
      init: function (el) { Nodes.init(el, "2-1", DEF21); }
    },
    {
      title: "서울의 기온 연교차", kind: "quiz",
      quiz: { type: "mcq",
        q: "서울의 최난월(8월) 평균 기온은 " + U.deg(seoul.t[7]) + ", 최한월(1월) 평균 기온은 " + U.deg(seoul.t[0]) + "임. 기온의 연교차는?",
        options: [U.n1(seoul.t[7] + seoul.t[0]) + "℃", U.deg(seoul.t[7]), U.n1(range(seoul)) + "℃", U.deg(U.mean(seoul.t))],
        answer: 2,
        explain: "연교차 = 최난월 − 최한월 = " + U.n1(seoul.t[7]) + " − (" + U.deg(seoul.t[0]).replace("℃", "") + ") = <b>" + U.n1(range(seoul)) + "℃</b> — 빼는 값이 영하이면 더해지는 것에 주의" }
    },
    {
      title: "풍향 읽기", kind: "quiz",
      quiz: { type: "mcq",
        q: "겨울철 우리나라에 부는 바람이 <b>북서쪽에서 남동쪽으로</b> 붊. 이 바람의 이름은?",
        options: ["남동풍", "북서풍", "북동풍", "남서풍"],
        answer: 1,
        explain: "풍향은 바람이 <b>불어오는</b> 방향으로 부름 → 북서쪽에서 불어오므로 <b>북서풍</b>" }
    },
    {
      title: "연교차가 가장 큰 도시", kind: "quiz",
      quiz: { type: "graphs",
        q: "네 도시의 기후 그래프 — 기온의 연교차가 가장 큰 도시는?",
        options: RANGE_Q.map(function (c) { return ClimateChart.svg(c, { show: "t" }); }),
        answer: 2,
        explain: RANGE_Q.map(function (c, i) { return "①②③④"[i] + " " + escHtml(c.kr) + " " + U.n1(range(c)) + "℃"; }).join(" · ") +
          " → <b>" + escHtml(RANGE_Q[2].kr) + "</b>: 고위도 대륙 동안 — 겨울에 매우 추워 연교차 가장 큼" }
    },
    {
      title: "정리", kind: "summary",
      html: sumCards([
        { emo: "🌡️", t: "기온", c: "#e0483a", float: true,
          d: ["지면 약 1.5m 그늘에서 측정", "월평균 → 연평균 기온", "<b>연교차</b> = 최난월 − 최한월"] },
        { emo: "🌧️", t: "강수", c: "#2b6fe3", float: true,
          d: ["우량계로 측정 — 단위 mm", "공기 상승 → 응결 → 구름 → 비", "<b>연강수량</b> · 강수 계절"] },
        { emo: "🌬️", t: "바람", c: "#2f9e8f", float: true,
          d: ["<b>고기압 → 저기압</b>으로 이동", "풍향 = 바람이 불어오는 방향", "해륙풍 · 계절풍 · 대기 대순환"] }
      ]) + '<p class="sum-next">지역마다 기온·강수·바람이 다른 까닭 → <b>2-2 기후 요인</b></p>'
    }
  ] };

  /* ==========================================================
     2-2 기후 요인
     ========================================================== */
  const DEF22 = {
    intro:
      '<div class="nd-def"><b>기후 요인</b> — 기후 요소를 지역마다 다르게 만드는 원인</div>' +
      '<div class="p2-chain"><span class="c1">기후 요인<small>원인</small></span><i>→</i><span class="c2">기후 요소<small>기온 · 강수 · 바람</small></span><i>→</i><span class="c3">지역의 기후</span></div>',
    groups: [
      { label: "지리적 요인 — 자리 잡은 곳의 조건", ids: ["lat", "land", "cur", "ter"] },
      { label: "대기의 움직임", ids: ["mon", "am"],
        extra: '<a class="nd-card nd-card--link" href="#3-1" data-go="3-1" style="--nc:#55627a">' +
          '<span class="nd-card-emo" aria-hidden="true">🌐</span><span class="nd-card-name">대기 대순환</span>' +
          '<span class="nd-card-desc">지구 전체를 도는 바람 — 기후대 형성의 핵심</span><span class="nd-card-go">PART 3에서 3D로 →</span></a>' }
    ],
    nodes: [
      { id: "lat", emoji: "🌐", name: "위도", color: "#d98a1c",
        desc: "태양 에너지를 받는 양의 차이",
        topics: [
          { t: "태양 고도와 에너지",
            pts: [
              "저위도: 햇빛이 수직에 가깝게 비춤 → 좁은 면적에 에너지 집중",
              "고위도: 햇빛이 비스듬히 비춤 → 넓은 면적에 에너지 분산",
              "위도가 높을수록 <b>단위 면적당 태양 에너지 감소</b>"
            ],
            terms: ["위도", "태양 고도", "태양 복사 에너지"],
            fig: P2F.latSun },
          { t: "위도별 기온",
            pts: [
              "위도가 높아질수록 연평균 기온 낮아짐",
              "싱가포르 " + U.deg(U.mean(singapore.t)) + " → 배로 " + U.deg(U.mean(barrow.t)),
              "기후대가 위도를 따라 <b>띠 모양</b>으로 나타나는 가장 큰 까닭"
            ],
            terms: ["저위도", "중위도", "고위도"],
            links: goBtn("1-2", "세계의 기후 지도"),
            fig: P2F.latTemp },
          { t: "에너지 과잉과 부족",
            pts: [
              "저위도: 받는 에너지 > 내보내는 에너지 → <b>과잉</b>",
              "고위도: 받는 에너지 < 내보내는 에너지 → <b>부족</b>",
              "남는 열이 대기·바다를 통해 고위도로 이동 → 대기 대순환"
            ],
            terms: ["에너지 과잉", "에너지 부족", "열 수송"],
            links: goBtn("3-1", "대기 대순환의 출발"),
            fig: P2F.latBudget }
        ] },
      { id: "land", emoji: "🏔️", name: "수륙 분포", color: "#2f9e5b",
        desc: "육지와 바다의 데워지고 식는 차이",
        topics: [
          { t: "육지와 바다",
            pts: [
              "육지: 빨리 데워지고 빨리 식음",
              "바다: 천천히 데워지고 천천히 식음 — 비열이 큼",
              "→ 바다 가까운 곳은 기온 변화가 작고, 먼 곳은 큼"
            ],
            terms: ["비열", "수륙 분포"],
            fig: P2F.lsHeat },
          { t: "대륙성 기후와 해양성 기후",
            pts: [
              "<b>해양성 기후</b>: 바다의 영향 → 연교차 작음 (밴쿠버 " + U.n1(range(vancouver)) + "℃)",
              "<b>대륙성 기후</b>: 내륙 → 연교차 큼 (울란바토르 " + U.n1(range(ulaan)) + "℃)",
              "대륙 내부는 바다에서 먼 만큼 수증기 공급이 적어 강수도 적음"
            ],
            terms: ["해양성 기후", "대륙성 기후"],
            fig: P2F.lsContinental },
          { t: "대륙 서안과 동안",
            pts: [
              "중위도는 <b>편서풍</b>이 바다 → 육지로 붊",
              "대륙 서안: 바다의 영향 → 겨울 온화, 연교차 작음",
              "대륙 동안: 대륙의 영향 → 겨울 추움, 연교차 큼 (서울 " + U.n1(range(seoul)) + "℃)"
            ],
            terms: ["대륙 서안", "대륙 동안", "편서풍"],
            links: goBtn("5-3"),
            fig: P2F.lsWestEast }
        ] },
      { id: "cur", emoji: "🌊", name: "해류", color: "#2878d8",
        desc: "바닷물의 흐름이 옮기는 열",
        topics: [
          { t: "난류와 한류",
            pts: [
              "<b>난류</b>: 저위도 → 고위도로 흐르는 따뜻한 해류",
              "<b>한류</b>: 고위도 → 저위도로 흐르는 차가운 해류",
              "해류가 옮기는 열 → 주변 지역의 기온·강수에 영향"
            ],
            terms: ["해류", "난류", "한류"],
            fig: P2F.curMap },
          { t: "난류의 영향",
            pts: [
              "북대서양 해류(난류) 위를 지난 <b>편서풍</b> → 서유럽을 따뜻하게",
              "런던(" + U.latTxt(london) + ") 1월 " + U.deg(london.t[0]) + " vs 퀘벡(" + U.latTxt(quebec) + ") 1월 " + U.deg(quebec.t[0]),
              "고위도인데도 겨울이 온화 — 노르웨이 해안의 항구는 겨울에도 얼지 않음"
            ],
            terms: ["북대서양 해류", "부동항"],
            links: goBtn("1-3", "탐구 질문 1"),
            fig: P2F.curWarm },
          { t: "한류의 영향",
            pts: [
              "한류 위의 공기: 아래가 차가워 상승하지 못함 → 비가 적음",
              "리마: 해안 도시인데 연강수량 약 " + U.n0(U.sum(lima.p)) + "mm",
              "한류가 흐르는 대륙 서안 → <b>해안 사막</b> (아타카마·나미브)"
            ],
            terms: ["페루 해류", "벵겔라 해류", "해안 사막"],
            links: goBtn("5-2"),
            fig: P2F.curCold }
        ] },
      { id: "ter", emoji: "⛰️", name: "지형", color: "#9a6a3c",
        desc: "높이와 산맥이 바꾸는 기온·강수",
        topics: [
          { t: "해발 고도",
            pts: [
              "높이 올라갈수록 기온 낮아짐 — 100m마다 약 0.5~0.6℃",
              "적도 부근이라도 고산 지대는 서늘함",
              "키토(해발 약 2,850m) " + U.deg(U.mean(quito.t)) + " vs 이키토스(약 100m) " + U.deg(U.mean(iquitos.t))
            ],
            terms: ["해발 고도", "기온 감률", "고산 기후"],
            links: goBtn("1-3", "탐구 질문 3") + goBtn("5-6", "고산 기후"),
            fig: P2F.terAlt },
          { t: "바람받이와 비 그늘",
            pts: [
              "<b>바람받이 사면</b>: 바람이 산을 타고 오름 → 구름·비 많음",
              "<b>비 그늘</b>: 산을 넘어 내려가는 쪽 → 건조",
              "산을 넘은 바람은 고온 건조해짐 — <b>푄</b> (우리나라의 높새바람)"
            ],
            terms: ["바람받이 사면", "비 그늘", "푄", "높새바람"],
            fig: P2F.terShadow }
        ] },
      { id: "mon", emoji: "🔄", name: "계절풍", color: "#7a5cc8",
        desc: "여름과 겨울에 방향이 바뀌는 바람",
        topics: [
          { t: "계절풍의 원리",
            pts: [
              "여름: 대륙이 더 뜨거움 → 대륙 저기압 → <b>바다 → 대륙</b> (습함)",
              "겨울: 대륙이 더 차가움 → 대륙 고기압 → <b>대륙 → 바다</b> (건조·한랭)",
              "육지와 바다의 데워지는 차이(수륙 분포)가 계절 규모로 나타난 것"
            ],
            terms: ["계절풍", "몬순"],
            fig: P2F.monPrinciple },
          { t: "계절풍의 영향",
            pts: [
              "여름 계절풍 → 비가 여름에 집중",
              "서울 6~8월 강수 약 " + U.pct(seoulSummer, U.sum(seoul.p)) + "%, 뭄바이 6~9월 약 " + U.pct(mumbai.p[5] + mumbai.p[6] + mumbai.p[7] + mumbai.p[8], U.sum(mumbai.p)) + "%",
              "겨울 계절풍 → 춥고 건조한 겨울, 큰 연교차"
            ],
            terms: ["계절풍 기후", "우기", "건기"],
            links: goBtn("1-3", "탐구 질문 2"),
            fig: P2F.monEffect }
        ] },
      { id: "am", emoji: "🌀", name: "기단과 전선", color: "#c0487a",
        desc: "성질이 다른 공기 덩어리의 만남",
        topics: [
          { t: "기단",
            pts: [
              "<b>기단</b>: 기온·습도가 비슷한 큰 공기 덩어리",
              "발원지의 성질을 닮음 — 대륙: 건조 · 해양: 습함 / 고위도: 한랭 · 저위도: 온난",
              "계절마다 우리나라에 영향을 주는 기단이 달라짐"
            ],
            terms: ["기단", "시베리아 기단", "북태평양 기단", "오호츠크해 기단"],
            fig: P2F.amMass },
          { t: "전선",
            pts: [
              "<b>전선</b>: 성질이 다른 두 기단이 만나는 경계",
              "찬 공기는 아래로, 따뜻한 공기는 위로 올라감",
              "따뜻한 공기가 상승 → 구름·비 = 전선성 강수"
            ],
            terms: ["전선", "전선면", "전선성 강수"],
            fig: P2F.amFront },
          { t: "장마 전선",
            pts: [
              "초여름: 오호츠크해 기단(한랭 다습)과 북태평양 기단(고온 다습)이 만남",
              "장마 전선이 남쪽에서 북쪽으로 이동하며 비",
              "서울 7월 강수량 " + U.n0(seoul.p[6]) + "mm — 1년 중 최다"
            ],
            terms: ["장마 전선", "장마"],
            links: goBtn("1-3", "탐구 질문 2"),
            fig: P2F.amBaiu }
        ] }
    ]
  };

  CHAPTER_CONTENT["2-2"] = { blocks: [
    {
      title: "기후 요인",
      html: function () { return Nodes.html("2-2", DEF22); },
      init: function (el) { Nodes.init(el, "2-2", DEF22); }
    },
    {
      title: "어떤 기후 요인일까?", kind: "quiz",
      quiz: { type: "sort",
        q: "각 사례에 가장 큰 영향을 준 기후 요인을 고르시오.",
        bins: ["위도", "수륙 분포", "해류", "지형"],
        items: [
          { t: "적도 부근의 키토 연평균 기온 " + U.deg(U.mean(quito.t)), a: 3 },
          { t: "해안 도시 리마의 연강수량 약 " + U.n0(U.sum(lima.p)) + "mm", a: 2 },
          { t: "울란바토르 연교차 " + U.n1(range(ulaan)) + "℃, 밴쿠버 " + U.n1(range(vancouver)) + "℃", a: 1 },
          { t: "싱가포르 연평균 " + U.deg(U.mean(singapore.t)) + ", 배로 " + U.deg(U.mean(barrow.t)), a: 0 }
        ],
        explain: "키토 → 해발 고도(지형) · 리마 → 페루 해류(한류) · 울란바토르와 밴쿠버 → 내륙과 해안(수륙 분포) · 싱가포르와 배로 → 태양 에너지(위도)" }
    },
    {
      title: "장마 전선을 만드는 기단", kind: "quiz",
      quiz: { type: "mcq",
        q: "초여름 우리나라에 장마 전선을 만드는 두 기단은?",
        options: ["시베리아 기단 · 북태평양 기단", "오호츠크해 기단 · 북태평양 기단", "시베리아 기단 · 오호츠크해 기단", "적도 기단 · 시베리아 기단"],
        answer: 1,
        explain: "한랭 다습한 <b>오호츠크해 기단</b>과 고온 다습한 <b>북태평양 기단</b>이 만나 장마 전선 형성" }
    },
    {
      title: "여름 계절풍", kind: "quiz",
      quiz: { type: "ox",
        q: "여름 계절풍은 대륙에서 바다로 불어 건조함.",
        answer: false,
        explain: "여름에는 대륙이 더 뜨거워 대륙이 저기압 → 바람은 <b>바다에서 대륙으로</b> 불고 습함 → 여름 강수 집중" }
    },
    {
      title: "한류와 해안 사막", kind: "quiz",
      quiz: { type: "mcq",
        q: "지도의 ①~④ 가운데 <b>한류</b>의 영향으로 비가 매우 적어 해안 사막이 나타나는 곳은?",
        visual: coastMap(),
        options: ["서유럽 해안", "남아메리카 서해안", "일본 남부 해안", "남아메리카 동해안"],
        answer: 1,
        explain: "② 페루 해류(한류) → 공기 아래가 차가워 상승하지 않음 → 아타카마 사막 / ① 북대서양 해류 · ③ 쿠로시오 해류 · ④ 브라질 해류는 난류" }
    },
    {
      title: "종합 — 도시로 읽는 기후 요인",
      html: '<div class="rc-pick" role="group" aria-label="도시 고르기">' + READ_CITY.map(function (r, i) {
          return '<button type="button" class="rc-b' + (i === 0 ? " on" : "") + '" data-i="' + i + '">' + escHtml(C(r.id).kr) + '</button>'; }).join("") + '</div>' +
        '<div class="rc-body"></div>',
      init: function (el) {
        /* 도시 하나 → 기후 그래프 + 영향을 준 기후 요인 카드(누르면 그 노드 열기) */
        function show(i) {
          const r = READ_CITY[i], c = C(r.id);
          el.querySelector(".rc-body").innerHTML =
            '<div class="rc-graph">' + ClimGraph.svg(c, { title: escHtml(c.kr) + " (" + U.latTxt(c) + ")", on: r.on }) + '</div>' +
            '<div class="rc-side"><p class="rc-fact">' + fmtKo(r.fact) + '</p>' + r.f.map(function (f) {
              const n = DEF22.nodes.filter(function (x) { return x.id === f[0]; })[0];
              return '<button type="button" class="rc-f" data-open="' + f[0] + ":" + f[1] + '" style="--nc:' + n.color + '">' +
                '<span class="rc-f-emo" aria-hidden="true">' + n.emoji + '</span><span class="rc-f-t"><b>' + escHtml(n.name) + '</b>' + fmtKo(f[2]) + '</span><span class="rc-f-go">→</span></button>';
            }).join("") + '</div>';
          el.querySelectorAll(".rc-b").forEach(function (b) { b.classList.toggle("on", +b.getAttribute("data-i") === i); });
        }
        el.addEventListener("click", function (e) {
          const b = e.target.closest(".rc-b");
          if (b) { show(+b.getAttribute("data-i")); return; }
          const o = e.target.closest("[data-open]");
          if (!o) return;
          const v = o.getAttribute("data-open").split(":");
          const nd = Nodes.get("2-2");
          if (nd) nd.open(v[0], +v[1]);
          Slides.go(1);
        });
        show(0);
      }
    },
    {
      title: "정리", kind: "summary",
      html: sumCards([
        { emo: "🌐", t: "위도", c: "#d98a1c", float: true, d: ["고위도일수록 태양 에너지 ↓ → 기온 ↓", "기후대가 <b>띠 모양</b>으로 분포"] },
        { emo: "🏔️", t: "수륙 분포", c: "#2f9e5b", float: true, d: ["바다 가까움 → 연교차 작음", "대륙 내부 → 연교차 큼 · 강수 적음"] },
        { emo: "🌊", t: "해류", c: "#2878d8", float: true, d: ["<b>난류</b> → 따뜻하고 습함", "<b>한류</b> → 서늘하고 건조(해안 사막)"] },
        { emo: "⛰️", t: "지형", c: "#9a6a3c", float: true, d: ["100m 오를 때마다 약 0.5~0.6℃ ↓", "바람받이 비 · 비 그늘 건조"] },
        { emo: "🔄", t: "계절풍", c: "#7a5cc8", float: true, d: ["여름: 바다 → 대륙, 습함", "겨울: 대륙 → 바다, 건조·한랭"] },
        { emo: "🌀", t: "기단과 전선", c: "#c0487a", float: true, d: ["성질이 다른 기단의 만남 = 전선", "전선성 강수 · <b>장마</b>"] }
      ], "g3") + '<p class="sum-next">지구 전체를 도는 바람 → <b>PART 3 대기 대순환</b></p>'
    }
  ] };
})();
