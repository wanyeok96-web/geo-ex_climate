/* ============================================================
   지오엑스-세계의 기후 — chapters/part5.js
   PART 5 세계의 기후대 — 5-1 열대 · 5-2 건조 · 5-3 온대 · 5-4 냉대 · 5-5 한대 · 5-6 고산
   (파트기획/PART5_세계의_기후대.md 기준, 화면 문구는 개조식)
   기후대 챕터 공통 틀(블록): 형성 원인 → 분포 지도 → 대표 기후 그래프 → 세부 유형 비교
                              → 식생·경관 → 주민 생활 → 함께 풀기 → 정리
   수치는 data/cities.js, 판별은 ui/koppen.js, 지도는 ui/worldmap.js(세부 유형 색)
   ============================================================ */
"use strict";

(function () {
  const C = function (id) { return CITY_BY_ID[id]; };
  const deg = Koppen.deg, mm = Koppen.mm;
  const sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
  const maxOf = function (a) { return Math.max.apply(null, a); };
  const minOf = function (a) { return Math.min.apply(null, a); };
  const r0 = function (v) { return Math.round(v).toLocaleString("ko-KR"); };

  function pts(list, cls) {
    return '<ul class="pts' + (cls ? " " + cls : "") + '">' + list.map(function (t) { return "<li>" + fmtKo(t) + "</li>"; }).join("") + "</ul>";
  }
  function goBtn(id, label, node) { return chapterChip(id, label, node); }   // core/app.js
  function statsLine(c) {
    return "최난월 " + deg(maxOf(c.t)) + " · 최한월 " + deg(minOf(c.t)) + " · 연강수량 " + mm(sum(c.p));
  }

  /* ---------- 기후대별 내용 ---------- */
  const Z = {
    A: {
      terms: ["적도 저압대","스콜","Af · Am · Aw","열대 우림 · 사바나","고상 가옥","플랜테이션"],
      id: "5-1", img: "tropical", view: [-110, 32, 170, -32], rep: "Singapore",
      causes: [
        { emo: "☀️", t: "적도 저압대", d: ["태양 에너지를 가장 많이 받아 공기 상승", "상승 기류 → 대류성 강수(스콜)"], go: [["3-5"], ["3-2"]] },
        { emo: "🔄", t: "기압대의 계절 이동", d: ["적도 저압대가 오면 우기, 아열대 고압대가 오면 건기", "사바나 기후(Aw)의 우기·건기"], go: [["3-8"]] },
        { emo: "🌬️", t: "계절풍", d: ["여름 계절풍이 많은 비 → 짧은 건기", "열대 몬순 기후(Am)"], go: [["2-2", "기후 요인 — 계절풍"]] }
      ],
      dist: ["적도를 중심으로 남·북위 약 10°~20° 사이", "아마존 분지 · 콩고 분지 · 동남아시아 섬 지역 — 열대 우림", "그 바깥쪽(아프리카 · 남아메리카 · 오스트레일리아 북부) — 사바나"],
      subs: [
        { code: "Af", city: "Singapore", t: "연중 고온 다습, 건기 없음 — 거의 매일 스콜" },
        { code: "Am", city: "Yangon", t: "계절풍으로 많은 비, 짧은 건기" },
        { code: "Aw", city: "Darwin", t: "우기와 건기 뚜렷 — 여름 우기, 겨울 건기" }
      ],
      veg: [
        { ph: "rainforest", emo: "🌳", t: "열대 우림", d: ["키 큰 상록 활엽수가 여러 층으로 빽빽함", "아마존의 셀바스, 동남아시아의 정글"] },
        { ph: "savanna", emo: "🦒", t: "사바나 초원", d: ["키 큰 풀 사이에 나무가 드문드문", "건기에 풀이 마름 · 야생 동물 서식"] },
        { emo: "🧱", t: "토양", d: ["많은 비에 영양분이 씻겨 척박한 붉은 흙", "라테라이트(적색토)"] }
      ],
      life: [
        { k: "가옥", d: "고상 가옥(바닥을 띄움 — 습기·해충 차단), 경사 급한 지붕" },
        { k: "의복", d: "얇고 바람이 잘 통하는 옷" },
        { k: "음식", d: "열대 과일 · 쌀(동남아시아 벼농사) · 향신료" },
        { k: "농업", d: "이동식 화전 농업, 플랜테이션(카카오 · 커피 · 천연고무 · 기름야자)" }
      ],
      quiz: [
        { type: "mcq", q: "열대 우림 기후(Af)와 사바나 기후(Aw)를 나누는 기준은?",
          options: ["최난월 평균 기온", "최한월 평균 기온", "최소우월 강수량(건기 유무)", "기온의 연교차"], answer: 2,
          explain: "최소우월 강수량 60mm 이상 → f(건기 없음) / 건기 뚜렷 → w — 둘 다 최한월 18℃ 이상인 열대 기후" },
        { type: "ox", q: "열대 지역의 고상 가옥은 습기와 해충을 막기 위해 바닥을 땅에서 띄움", answer: true,
          explain: "고온 다습한 기후 → 바닥을 띄워 통풍을 좋게 하고 습기·해충·침수를 피함" }
      ],
      sum: ["형성 원인: <b>적도 저압대</b>(상승 기류 · 대류성 강수), 기압대의 계절 이동, 계절풍",
            "Af 연중 다우 · Am 짧은 건기 · Aw 우기·건기 뚜렷",
            "열대 우림 · 사바나 / 고상 가옥 · 플랜테이션"]
    },
    B: {
      terms: ["아열대 고압대","BW · BS","오아시스","유목","흙벽돌집"],
      id: "5-2", img: "dry", view: [-180, 60, 180, -50], rep: "Cairo",
      causes: [
        { emo: "⬇️", t: "아열대 고압대", d: ["위도 20°~30° 부근 하강 기류 → 구름이 생기기 어려움", "사하라 · 아라비아 · 오스트레일리아 사막"], go: [["3-4"], ["3-5"]] },
        { emo: "🏜️", t: "대륙 내부", d: ["바다에서 멀어 수증기 공급이 적음", "고비 사막 · 중앙아시아"], go: [["2-2", "기후 요인 — 수륙 분포"]] },
        { emo: "🌊", t: "한류 · 비 그늘", d: ["한류 연안: 대기가 안정 → 해안 사막(아타카마 · 나미브)", "산맥의 비 그늘: 파타고니아"], go: [["2-2", "기후 요인 — 해류 · 지형"]] }
      ],
      dist: ["남·북회귀선(위도 20°~30°) 부근에 띠 모양", "대륙 내부 · 한류가 흐르는 대륙 서안 · 산맥의 비 그늘", "사막 주변에 스텝이 둘러쌈"],
      subs: [
        { code: "BW", city: "Cairo", t: "연강수량 250mm 미만 — 사막" },
        { code: "BS", city: "Ulaanbaatar", t: "연강수량 250~500mm — 짧은 풀의 초원" }
      ],
      veg: [
        { ph: "sahara", emo: "🌵", t: "사막", d: ["식생이 거의 없음 · 모래·자갈 사막", "물이 솟는 오아시스 주변에만 대추야자"] },
        { ph: "steppe", emo: "🌾", t: "스텝", d: ["비가 조금 오는 시기에 자라는 짧은 풀 초원", "나무는 거의 자라지 못함"] },
        { emo: "🌡️", t: "기후 특징", d: ["구름이 적어 일교차가 매우 큼", "바람에 모래 먼지"] }
      ],
      life: [
        { k: "가옥", d: "흙벽돌집 — 두꺼운 벽 · 작은 창 · 평평한 지붕 / 스텝의 이동식 가옥(몽골 게르)" },
        { k: "의복", d: "온몸을 가리는 헐렁한 옷 — 강한 햇볕·모래바람 차단" },
        { k: "음식", d: "대추야자 · 가축의 젖과 고기(양 · 염소 · 낙타)" },
        { k: "농업", d: "오아시스 농업 · 관개 농업 / 유목, 스텝의 밀 재배 · 목축" }
      ],
      quiz: [
        { type: "mcq", q: "사막 기후(BW)와 스텝 기후(BS)를 나누는 연강수량 기준은?",
          options: ["100mm", "250mm", "500mm", "1,000mm"], answer: 1,
          explain: "연강수량 500mm 미만 → 건조 기후(B), 그중 250mm 미만 → 사막(BW) · 250~500mm → 스텝(BS)" },
        { type: "ox", q: "아타카마 사막처럼 한류가 흐르는 해안에도 사막이 나타남", answer: true,
          explain: "한류 → 바다 위 공기가 차가워 대기가 안정 → 상승 기류가 약해 비가 거의 내리지 않음(해안 사막)" }
      ],
      sum: ["형성 원인: <b>아열대 고압대</b>(하강 기류), 대륙 내부, 한류, 비 그늘",
            "BW 250mm 미만 · BS 250~500mm",
            "흙벽돌집 · 헐렁한 옷 · 오아시스 농업 · 유목"]
    },
    C: {
      terms: ["편서풍","Cfa · Cfb · Cs · Cw","수목 농업","혼합 농업 · 낙농업","벼농사"],
      id: "5-3", img: "temperate", view: [-180, 70, 180, -50], rep: "Tokyo",
      causes: [
        { emo: "🌊", t: "편서풍과 난류", d: ["대륙 서안: 난류 위를 지난 편서풍 → 겨울 온화 · 연중 고른 비", "서안 해양성 기후(Cfb)"], go: [["2-2", "기후 요인 — 해류"], ["3-6"]] },
        { emo: "☀️", t: "기압대의 계절 이동", d: ["여름에 아열대 고압대 → 건조 / 겨울에 편서풍 → 비", "지중해성 기후(Cs)"], go: [["3-8"]] },
        { emo: "🔄", t: "계절풍", d: ["대륙 동안: 여름 계절풍 → 여름에 비 집중", "온난 습윤(Cfa) · 온대 겨울 건조(Cw)"], go: [["2-2", "기후 요인 — 계절풍"]] }
      ],
      dist: ["중위도(위도 약 30°~50°) 대륙의 서안과 동안", "서안: 서유럽(Cfb) · 지중해 연안(Cs) / 동안: 동아시아 · 미국 남동부(Cfa · Cw)", "남반구: 칠레 · 남아프리카 · 오스트레일리아 남부 · 뉴질랜드"],
      subs: [
        { code: "Cfa", city: "Tokyo", t: "여름 무덥고 연중 습윤 — 대륙 동안" },
        { code: "Cfb", city: "London", t: "여름 서늘, 겨울 온화, 연중 고른 비 — 대륙 서안" },
        { code: "Cs", city: "Rome", t: "여름 고온 건조, 겨울 온난 습윤 — 지중해 연안" },
        { code: "Cw", city: "Seoul", t: "여름에 비 집중, 겨울 건조 — 계절풍" }
      ],
      veg: [
        { ph: "deciduous", emo: "🍂", t: "낙엽 활엽수림 · 혼합림", d: ["사계절 변화 뚜렷 — 가을 단풍", "서안 해양성 · 온난 습윤 지역"] },
        { ph: "olive", emo: "🫒", t: "경엽수림", d: ["여름 가뭄에 견디는 작고 단단한 잎", "올리브 · 코르크참나무 (지중해성)"] },
        { emo: "🌿", t: "상록 활엽수림", d: ["겨울이 따뜻한 저위도 쪽", "동백나무 · 녹나무 (조엽수림)"] }
      ],
      life: [
        { k: "가옥", d: "지중해: 흰 벽 · 작은 창(강한 여름 햇볕) / 동아시아: 여름 대비 대청마루, 겨울 대비 온돌" },
        { k: "의복", d: "사계절에 맞춘 옷 — 계절에 따라 두께가 달라짐" },
        { k: "음식", d: "지중해: 올리브유 · 포도주 / 서유럽: 빵 · 유제품 / 동아시아: 쌀" },
        { k: "농업", d: "지중해: 수목 농업(올리브 · 포도 · 오렌지) / 서유럽: 혼합 농업 · 낙농업 / 동아시아: 벼농사" }
      ],
      quiz: [
        { type: "mcq", q: "여름에 건조하여 올리브 · 포도 같은 수목 농업이 발달한 기후는?",
          options: ["Cfa 온난 습윤 기후", "Cfb 서안 해양성 기후", "Cs 지중해성 기후", "Cw 온대 겨울 건조 기후"], answer: 2,
          explain: "Cs(여름 건조) — 여름 가뭄에 강한 올리브 · 포도 · 코르크참나무 재배" },
        { type: "graphs", q: "서안 해양성 기후(Cfb) 그래프는?",
          options: ["Rome", "London", "Seoul", "Tokyo"].map(function (id) { return ClimateChart.svg(C(id), {}); }), answer: 1,
          explain: "② 런던 — 여름 서늘(최난월 22℃ 미만) · 겨울 온화 · 연중 고른 비 (① 로마 Cs · ③ 서울 Cw · ④ 도쿄 Cfa)" }
      ],
      sum: ["형성 원인: 편서풍과 난류(서안), 기압대의 계절 이동(지중해), 계절풍(동안)",
            "Cfa 온난 습윤 · Cfb 서안 해양성 · Cs 지중해성 · Cw 온대 겨울 건조",
            "수목 농업(Cs) · 혼합 농업·낙농업(Cfb) · 벼농사(동아시아)"]
    },
    D: {
      terms: ["타이가","Df · Dw","연교차","시베리아 고기압","통나무집"],
      id: "5-4", img: "subarctic", view: [-180, 80, 180, 15], rep: "Moscow",
      causes: [
        { emo: "🏔️", t: "넓은 대륙 · 고위도", d: ["북반구 대륙 내부 — 겨울에 빨리 식어 매우 추움", "기온의 연교차가 매우 큼"], go: [["2-2", "기후 요인 — 수륙 분포"]] },
        { emo: "❄️", t: "시베리아 고기압", d: ["겨울에 차갑고 건조한 대륙 고기압 발달", "냉대 겨울 건조 기후(Dw) — 동부 시베리아 · 중국 북동부"], go: [["2-2", "기후 요인 — 기단"]] },
        { emo: "🌍", t: "남반구에는 거의 없음", d: ["위도 40°~70°에 넓은 대륙이 없음", "바다의 영향으로 겨울이 덜 추움"], go: [["1-2"]] }
      ],
      dist: ["북반구 위도 약 40°~70°의 대륙 내부와 동안", "러시아 · 캐나다 · 북유럽 · 중국 북동부 · 한반도 북부", "남반구에는 거의 없음"],
      subs: [
        { code: "Df", city: "Moscow", t: "연중 강수 — 겨울에 눈이 많음" },
        { code: "Dw", city: "Harbin", t: "겨울 건조 — 시베리아 고기압의 영향" }
      ],
      veg: [
        { ph: "taiga", emo: "🌲", t: "타이가", d: ["전나무 · 가문비나무 · 소나무 등 침엽수림", "세계적인 목재 · 펄프 생산 지역"] },
        { emo: "🪨", t: "토양", d: ["산성의 회백색 토양", "포드졸"] },
        { emo: "🧊", t: "기후 특징", d: ["겨울이 길고 매우 추움 · 여름은 짧지만 따뜻함", "연교차 매우 큼 (하얼빈 약 " + r0(maxOf(C("Harbin").t) - minOf(C("Harbin").t)) + "℃)"] }
      ],
      life: [
        { k: "가옥", d: "통나무집 · 두꺼운 벽과 이중창 · 난방 시설" },
        { k: "의복", d: "털모자 · 털옷 · 두꺼운 외투" },
        { k: "음식", d: "호밀빵 · 감자 · 절인 음식과 훈제 생선(긴 겨울 대비 저장)" },
        { k: "농업·산업", d: "봄밀 · 감자 재배, 임업(목재 · 펄프)" }
      ],
      quiz: [
        { type: "ox", q: "냉대 기후는 넓은 대륙이 있는 북반구에 주로 나타남", answer: true,
          explain: "남반구에는 냉대 기후가 나타날 위도(40°~70°)에 넓은 대륙이 거의 없음" },
        { type: "mcq", q: "냉대 기후 지역에 넓게 나타나는 침엽수림은?",
          options: ["셀바스", "사바나", "타이가", "툰드라"], answer: 2,
          explain: "타이가 — 냉대 기후의 침엽수림 (셀바스: 열대 우림, 사바나: 열대 초원, 툰드라: 한대)" }
      ],
      sum: ["형성 원인: 북반구의 넓은 대륙 · 고위도, 시베리아 고기압(Dw)",
            "Df 냉대 습윤 · Dw 냉대 겨울 건조 — 연교차 매우 큼",
            "타이가(침엽수림) · 통나무집 · 임업"]
    },
    E: {
      terms: ["툰드라","빙설","영구 동토층","백야 · 극야","순록 유목"],
      id: "5-5", img: "polar", view: [-180, 88, 180, -90], rep: "Barrow",
      causes: [
        { emo: "🧭", t: "극 지방 · 고위도", d: ["태양 고도가 낮아 받는 에너지가 매우 적음", "여름에도 최난월 10℃ 미만"], go: [["2-2", "기후 요인 — 위도"]] },
        { emo: "⬇️", t: "극 고압대", d: ["차가운 공기가 하강 → 강수 매우 적음", "눈과 얼음이 녹지 않고 쌓임"], go: [["3-3"]] },
        { emo: "🌙", t: "백야와 극야", d: ["여름: 해가 지지 않는 백야", "겨울: 해가 뜨지 않는 극야"], go: [] }
      ],
      dist: ["북극해 연안 · 그린란드 · 남극 대륙", "툰드라: 북극해 연안의 좁은 띠", "빙설: 그린란드 내륙 · 남극 대륙"],
      subs: [
        { code: "ET", city: "Barrow", t: "최난월 0~10℃ — 짧은 여름에 땅 표면이 녹음" },
        { code: "EF", city: "Vostok", t: "최난월 0℃ 미만 — 일 년 내내 눈과 얼음" }
      ],
      veg: [
        { ph: "tundra", emo: "🌱", t: "툰드라", d: ["짧은 여름에 이끼 · 지의류 · 키 작은 풀", "나무가 자라지 못함"] },
        { emo: "🧊", t: "영구 동토층", d: ["땅속이 일 년 내내 얼어 있음", "여름에는 표면만 녹아 습지가 됨"] },
        { ph: "ice-sheet", emo: "🏔️", t: "빙설", d: ["두꺼운 빙하(대륙 빙하)", "식생 없음"] }
      ],
      life: [
        { k: "가옥", d: "이글루(사냥할 때의 임시 거처) · 오늘날 고상 가옥(영구 동토층이 녹지 않게)" },
        { k: "의복", d: "순록 · 바다표범 가죽과 털로 만든 옷" },
        { k: "음식", d: "사냥 · 어로 — 날고기로 비타민 보충" },
        { k: "생업", d: "순록 유목 · 사냥 · 어로 / 오늘날 자원 개발 · 남극 과학 기지" }
      ],
      quiz: [
        { type: "mcq", q: "툰드라 기후(ET)와 빙설 기후(EF)를 나누는 기준은?",
          options: ["최난월 0℃", "최한월 −3℃", "최한월 18℃", "연강수량 250mm"], answer: 0,
          explain: "최난월 10℃ 미만 → 한대(E), 그중 최난월 0℃ 이상 → 툰드라(ET) · 0℃ 미만 → 빙설(EF)" },
        { type: "ox", q: "툰드라 지역의 건물은 영구 동토층이 녹지 않도록 바닥을 띄워 짓기도 함", answer: true,
          explain: "건물의 열이 땅을 녹이면 지반이 내려앉음 → 고상 가옥으로 열 차단" }
      ],
      sum: ["형성 원인: 극 지방(태양 에너지 부족), 극 고압대",
            "ET 툰드라(최난월 0~10℃) · EF 빙설(최난월 0℃ 미만)",
            "이끼 · 지의류, 영구 동토층 / 순록 유목 · 사냥"]
    },
    H: {
      terms: ["해발 고도","상춘 기후","일교차","계단식 경작","라마 · 알파카"],
      id: "5-6", img: "highland", view: [-96, 22, -30, -36], rep: "Quito",
      causes: [
        { emo: "⛰️", t: "해발 고도", d: ["높이 올라갈수록 기온 하강 — 100m마다 약 0.5~0.6℃", "적도 부근 고산 지역도 서늘함"], go: [["2-2", "기후 요인 — 지형"]] },
        { emo: "🌤️", t: "상춘 기후", d: ["적도 부근 고산: 일 년 내내 봄 같은 날씨", "연교차 작고 일교차 큼"], go: [] },
        { emo: "📐", t: "쾨펜의 원래 구분에는 없음", d: ["해발 고도가 높은 지역을 따로 구분", "위도로 보면 열대지만 기온이 낮음"], go: [["4-2"]] }
      ],
      dist: ["안데스 산지(키토 · 보고타 · 라파스 · 쿠스코)", "에티오피아 고원(아디스아바바) · 멕시코 고원(멕시코시티)", "티베트고원 · 알프스 등 높은 산지"],
      subs: [
        { code: "H", city: "Quito", t: "해발 약 2,850m — 연평균 약 " + r0(sum(C("Quito").t) / 12) + "℃" },
        { code: "Af", city: "Iquitos", t: "아마존 저지대 — 연평균 약 " + r0(sum(C("Iquitos").t) / 12) + "℃" }
      ],
      veg: [
        { ph: "andes", emo: "🏞️", t: "고도에 따른 식생 변화", d: ["산 아래 열대 우림 → 올라갈수록 활엽수림 · 침엽수림 · 초원", "식생의 수직 분포"] },
        { ph: "alpaca", emo: "🦙", t: "고산 초원", d: ["나무가 자라지 않는 높은 곳의 초원", "라마 · 알파카 방목"] },
        { emo: "🏙️", t: "고산 도시", d: ["저지대보다 서늘하고 쾌적 → 도시 발달", "잉카 문명(쿠스코)"] }
      ],
      life: [
        { k: "가옥", d: "돌 · 흙벽돌로 지은 집 — 큰 일교차에 대비" },
        { k: "의복", d: "판초 · 털모자(알파카 털) — 일교차가 커서 겹쳐 입고 벗기 쉬운 옷" },
        { k: "음식", d: "감자 · 옥수수 · 퀴노아" },
        { k: "농업", d: "계단식 경작 · 라마와 알파카 방목" }
      ],
      quiz: [
        { type: "mcq", q: "키토가 이키토스보다 연평균 기온이 약 13℃ 낮은 가장 큰 까닭은?",
          options: ["위도 차이", "해발 고도 차이", "해류의 영향", "계절풍의 영향"], answer: 1,
          explain: "두 도시 모두 적도 부근 — 키토는 해발 약 2,850m의 고산 도시 → 기온이 낮음" },
        { type: "ox", q: "적도 부근 고산 도시는 기온의 연교차가 작음", answer: true,
          explain: "적도 부근 → 계절에 따른 태양 에너지 차이 작음 → 연교차 작음 (키토 약 " + (maxOf(C("Quito").t) - minOf(C("Quito").t)).toFixed(1) + "℃), 대신 일교차 큼" }
      ],
      sum: ["형성 원인: <b>해발 고도</b> — 높을수록 기온 하강",
            "적도 부근 고산: 연중 봄 같은 상춘 기후 · 연교차 작고 일교차 큼",
            "고산 도시 발달 · 계단식 경작 · 라마와 알파카 방목"]
    }
  };

  /* ---------- 기압대의 계절 이동 — 달마다 기압대가 남북으로 오르내림 (모식도) ----------
     적도 저압대 중심 위도 ≈ 10° × cos(2π(월 − 7.5)/12) (7~8월 북쪽 끝, 1~2월 남쪽 끝)
     아열대 고압대 = 중심 ± 28°, 한대 전선(편서풍 비) = 중심 ± 45° */
  const BELT = {
    A: { city: "Darwin", title: "우기와 건기가 생기는 까닭",
         say: ["적도 저압대(상승 기류 · 비)가 다윈 위로 오면 <b>우기</b>", "아열대 고압대(하강 기류)가 오면 <b>건기</b>", "기압대는 태양을 따라 여름 반구 쪽으로 이동"] },
    C: { city: "Rome", title: "여름이 건조한 까닭 — 지중해성 기후",
         say: ["여름: 아열대 고압대가 북쪽으로 올라와 로마를 덮음 → <b>건조</b>", "겨울: 고압대가 남쪽으로 내려가고 편서풍·전선이 옴 → <b>비</b>", "기압대의 계절 이동 → 3-8에서 3D로"] }
  };
  const MON = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  function beltCenter(m) { return 10 * Math.cos(2 * Math.PI * (m - 6.5) / 12); }
  function beltSvg(zone) {
    const b = BELT[zone], c = C(b.city);
    const W = 620, H = 400, yL = function (lat) { return 200 - lat * 3.6; };
    let s = '<svg class="belt-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="기압대의 계절 이동 모식도">' +
      '<rect class="belt-sea" x="60" y="0" width="' + (W - 60) + '" height="' + H + '"/>';
    [-50, -30, 0, 30, 50].forEach(function (lat) {
      s += '<line class="belt-lat' + (lat === 0 ? " eq" : "") + '" x1="60" x2="' + W + '" y1="' + yL(lat) + '" y2="' + yL(lat) + '"/>' +
        '<text class="belt-ax" x="52" y="' + (yL(lat) + 5) + '" text-anchor="end">' + (lat === 0 ? "적도" : Math.abs(lat) + "°" + (lat > 0 ? "N" : "S")) + '</text>';
    });
    /* 기압대 묶음 — 중심 위도 0일 때 그리고 translateY로 이동 */
    const band = function (lat, half, cls, t) {
      return '<rect class="belt-b ' + cls + '" x="60" y="' + yL(lat + half) + '" width="' + (W - 60) + '" height="' + (half * 2 * 3.6) + '"/>' +
        '<text class="belt-t ' + cls + '" x="' + (W - 12) + '" y="' + (yL(lat) + 6) + '" text-anchor="end">' + t + '</text>';
    };
    s += '<g class="belt-move">' +
      band(45, 8, "rain", "한대 전선 · 편서풍 — 비") + band(28, 7, "dry", "아열대 고압대 — 건조") +
      band(0, 6, "rain", "적도 저압대 — 비") +
      band(-28, 7, "dry", "아열대 고압대 — 건조") + band(-45, 8, "rain", "한대 전선 · 편서풍 — 비") + '</g>';
    s += '<g class="belt-city"><circle cx="190" cy="' + yL(c.lat) + '" r="11"/><text x="208" y="' + (yL(c.lat) + 7) + '">' + escHtml(c.kr) + '</text></g>' +
      '<text class="belt-mon" x="80" y="36">1월</text></svg>';
    return s;
  }
  function beltBars(zone, m) {
    const c = C(BELT[zone].city), mx = maxOf(c.p);
    return '<div class="belt-bars">' + c.p.map(function (v, i) {
      return '<div class="bb' + (i === m ? " on" : "") + '"><i style="height:' + Math.max(2, v / mx * 100).toFixed(1) + '%"></i><span>' + (i + 1) + '</span></div>';
    }).join("") + '</div><div class="belt-cap">' + escHtml(c.kr) + ' 월 강수량 (' + mm(sum(c.p)) + ')</div>';
  }
  function beltBlock(zone) {
    const b = BELT[zone];
    return {
      title: b.title,
      html: '<div class="split belt"><div class="split-main"><div class="belt-ctl"></div><div class="belt-fig">' + beltSvg(zone) + '</div></div>' +
        '<div class="split-side"><div class="belt-side">' + beltBars(zone, 0) + '</div>' + pts(b.say, "sm") +
        '<p class="keyline sm">기압대 위치는 설명을 위한 모식도</p></div></div>',
      init: function (el) {
        const mv = el.querySelector(".belt-move"), c = C(b.city);
        Anim.player(el.querySelector(".belt-ctl"), { steps: MON, interval: 1100, loop: true, onStep: function (m) {
          mv.style.transform = "translateY(" + (-beltCenter(m) * 3.6).toFixed(1) + "px)";
          el.querySelector(".belt-mon").textContent = MON[m];
          el.querySelector(".belt-side").innerHTML = beltBars(zone, m);
          /* 도시가 어느 기압대에 있는지 → 점 색 */
          const d = c.lat - beltCenter(m);
          const wet = Math.abs(d) <= 6 || Math.abs(Math.abs(d) - 45) <= 8;
          el.querySelector(".belt-city").setAttribute("class", "belt-city " + (wet ? "wet" : Math.abs(Math.abs(d) - 28) <= 7 ? "dry" : ""));
        } });
      }
    };
  }

  /* 고산 도시 해발 고도 (m, 개략값) — 5-6 고도와 기온 그림 */
  const ALT = [["Iquitos", 106], ["Mexico_City", 2240], ["Addis_Ababa", 2355], ["Bogota", 2640], ["Quito", 2850], ["Cusco", 3400], ["La_Paz", 3640]];
  function altChart() {
    const W = 760, H = 420, L = 70, R = 20, T = 30, B = 70;
    const x = function (i) { return L + (i + 0.5) * (W - L - R) / ALT.length; };
    const yA = function (a) { return H - B - a / 4000 * (H - T - B); };
    let s = '<svg class="alt-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="해발 고도와 연평균 기온">';
    for (let a = 0; a <= 4000; a += 1000) {
      s += '<line class="alt-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + yA(a) + '" y2="' + yA(a) + '"/><text class="alt-ax" x="' + (L - 8) + '" y="' + (yA(a) + 5) + '" text-anchor="end">' + r0(a) + '</text>';
    }
    s += '<text class="alt-ax" x="' + (L - 8) + '" y="' + (T - 10) + '" text-anchor="end">해발(m)</text>';
    ALT.forEach(function (d, i) {
      const c = C(d[0]), tm = sum(c.t) / 12, bw = (W - L - R) / ALT.length * 0.56;
      const hue = Math.max(0, Math.min(1, (tm - 5) / 22));
      s += '<rect class="alt-bar" x="' + (x(i) - bw / 2) + '" y="' + yA(d[1]) + '" width="' + bw + '" height="' + (H - B - yA(d[1])) + '" rx="6" style="fill:hsl(' + (220 - hue * 205) + ',70%,' + (58 - hue * 6) + '%)"/>' +
        '<text class="alt-t" x="' + x(i) + '" y="' + (yA(d[1]) - 10) + '" text-anchor="middle">' + deg(tm) + '</text>' +
        '<text class="alt-n" x="' + x(i) + '" y="' + (H - B + 24) + '" text-anchor="middle">' + escHtml(c.kr) + '</text>' +
        '<text class="alt-m" x="' + x(i) + '" y="' + (H - B + 46) + '" text-anchor="middle">' + r0(d[1]) + 'm</text>';
    });
    return s + '</svg>';
  }

  /* 대표 기후 그래프 블록: 같은 기후대 다른 도시 · 판별 근거 */
  const OTHERS = { A: ["Manaus", "Bangkok", "Lagos"], B: ["Riyadh", "Las_Vegas", "Ulaanbaatar"], C: ["London", "Rome", "Sydney", "Seoul"],
    D: ["Harbin", "Chicago", "Helsinki"], E: ["Nuuk", "Longyearbyen", "Vostok"] };
  function whyHtml(c, zone) {
    const j = Koppen.judge(c);
    return '<div class="why-box"><div class="why-t">판별 근거 — ' + escHtml(c.kr) + ' ' + j.code + '</div><ol class="why-list">' +
      j.steps.filter(function (s) { return s.letter; }).map(function (s) {
        return '<li><span class="why-l" style="--zc:' + ZONES[zone].color + '">' + s.letter + '</span><span>' + fmtKo(s.q.replace(/\?.*$/, "")) + ' — ' + fmtKo(s.v) + '</span></li>';
      }).join("") + '</ol></div>' + pts([statsLine(c)], "sm");
  }
  /* 함께 풀기 3: 기후대 그래프 고르기 */
  const GQ = { A: [["Rome", "Bangkok", "Moscow", "Riyadh"], 1], B: [["Paris", "Havana", "Riyadh", "Nuuk"], 2], C: [["Buenos_Aires", "Helsinki", "Baghdad", "Colombo"], 0],
    D: [["Lisbon", "Chicago", "Jakarta", "Iqaluit"], 1], E: [["Oslo", "Kathmandu", "Las_Vegas", "Nuuk"], 3], H: [["Lima", "Bogota", "Manaus", "Tokyo"], 1] };
  function graphQuiz(zone) {
    const g = GQ[zone], ids = g[0];
    return { type: "graphs",
      q: zone === "H" ? "모두 위도 40° 이하의 도시 — 적도 부근 고산 도시의 그래프는?" : ZONES[zone].name + " 기후(" + zone + ")의 그래프는?",
      options: ids.map(function (id) { return ClimateChart.svg(C(id), {}); }), answer: g[1],
      explain: ids.map(function (id, i) { const c = C(id); return "①②③④"[i] + " " + escHtml(c.kr) + " " + c.type; }).join(" · ") +
        " → 정답 <b>" + escHtml(C(ids[g[1]]).kr) + "</b>" };
  }

  /* ---------- 공통 틀로 챕터 만들기 ---------- */
  function build(zone) {
    const d = Z[zone];
    const rep = C(d.rep);
    const jr = Koppen.judge(rep);
    const isH = zone === "H";
    const subCities = d.subs.map(function (s) { return { id: s.city, emph: true }; });
    const blocks = [];

    blocks.push({
      title: "형성 원인",
      html: '<div class="causes n' + d.causes.length + '">' + d.causes.map(function (c) {
        return '<div class="cause" style="--zc:' + ZONES[zone].color + '"><div class="cause-emo" aria-hidden="true">' + c.emo + '</div>' +
          '<h4>' + c.t + '</h4>' + pts(c.d) +
          '<div class="cause-go">' + c.go.map(function (g) { return goBtn(g[0], g[1]); }).join("") + '</div></div>';
      }).join("") + '</div>'
    });

    if (BELT[zone]) blocks.push(beltBlock(zone));

    blocks.push({
      title: "분포",
      html: pts(d.dist, "inline") + '<div class="map-host" data-map="dist-' + zone + '"></div>',
      init: function (el) {
        WorldMap.create(el.querySelector(".map-host"), isH
          ? { view: d.view, highland: true, focus: "H", legend: false, latLines: true, cities: [{ id: "Quito", emph: true }, { id: "La_Paz", emph: true }, { id: "Bogota", emph: true }, { id: "Iquitos", emph: true }] }
          : { view: d.view, focus: zone, subtypes: true, latToggle: true, latLines: true, regions: true, cities: subCities });
      }
    });

    if (isH) {
      blocks.push({
        title: "높이 올라갈수록 기온 하강",
        html: '<div class="split"><div class="split-main"><div class="chart-card big alt-card">' + altChart() + '</div></div>' +
          '<div class="split-side">' + pts(["막대 높이 = 해발 고도, 숫자 = 연평균 기온",
            "이키토스(106m) " + deg(sum(C("Iquitos").t) / 12) + " → 키토(2,850m) " + deg(sum(C("Quito").t) / 12),
            "해발 고도가 높을수록 연평균 기온이 낮음 — 100m마다 약 0.5~0.6℃"], "lg") + '</div></div>'
      });
    } else {
      const more = OTHERS[zone] || [];
      blocks.push({
        title: "대표 기후 그래프 — " + rep.kr + " (" + jr.code + ")",
        html: '<div class="rep-pick" role="group" aria-label="같은 기후대 다른 도시"><span>같은 기후대 다른 도시</span>' + [d.rep].concat(more).map(function (id, i) {
            return '<button type="button" class="rep-b' + (i === 0 ? " on" : "") + '" data-id="' + id + '">' + escHtml(C(id).kr) + ' <small>' + Koppen.judge(C(id)).code + '</small></button>'; }).join("") + '</div>' +
          '<div class="split"><div class="split-main graph-main">' +
            '<div class="rep-graph">' + ClimGraph.svg(rep, { title: escHtml(rep.kr) + " · " + jr.code + " " + jr.name }) + '</div>' +
            '<div class="cg-btns">' + [["tmax", "최난월", "t"], ["tmin", "최한월", "t"], ["range", "연교차", "r"], ["pann", "연강수량", "p"], ["pmin", "최소우월", "p"]].map(function (k) {
              return '<button type="button" class="cg-btn ' + k[2] + '" data-key="' + k[0] + '">' + k[1] + '</button>'; }).join("") + '</div></div>' +
          '<div class="split-side rep-side">' + whyHtml(rep, zone) + '</div></div>',
        init: function (el) {
          el.addEventListener("click", function (e) {
            const p = e.target.closest(".rep-b");
            if (p) {
              const c = C(p.getAttribute("data-id")), j = Koppen.judge(c);
              el.querySelectorAll(".rep-b").forEach(function (x) { x.classList.toggle("on", x === p); });
              const on = [].map.call(el.querySelectorAll(".cg-btn.on"), function (x) { return x.getAttribute("data-key"); });
              el.querySelector(".rep-graph").innerHTML = ClimGraph.svg(c, { title: escHtml(c.kr) + " · " + j.code + " " + j.name, on: on });
              el.querySelector(".rep-side").innerHTML = whyHtml(c, zone);
              return;
            }
            const b = e.target.closest(".cg-btn");
            if (!b) return;
            b.classList.toggle("on");
            ClimGraph.set(el, b.getAttribute("data-key"), b.classList.contains("on"));
          });
        }
      });
    }

    blocks.push({
      title: isH ? "같은 위도, 다른 높이" : "세부 유형 비교",
      html: '<div class="subgrid n' + d.subs.length + '">' + d.subs.map(function (s) {
        const c = C(s.city);
        const zc = ZONES[s.code.charAt(0)] ? ZONES[s.code.charAt(0)].color : ZONES[zone].color;
        return '<div class="subc" style="--zc:' + zc + '"><div class="subc-top"><span class="subc-code">' + s.code + '</span>' +
          '<span class="subc-name">' + (Koppen.NAMES[s.code] || "") + '</span></div>' +
          '<div class="subc-city">' + escHtml(c.kr) + ' <small>' + (c.lat >= 0 ? c.lat.toFixed(1) + "°N" : (-c.lat).toFixed(1) + "°S") + '</small></div>' +
          '<div class="subc-chart">' + ClimateChart.svg(c, {}) + '</div>' +
          '<div class="subc-t">' + fmtKo(s.t) + '</div><div class="subc-s">' + statsLine(c) + '</div></div>';
      }).join("") + '</div>'
    });

    blocks.push({
      title: "식생 · 경관",
      html: '<div class="vegs n' + d.veg.length + '">' + d.veg.map(function (v) {
        return '<div class="veg' + (v.ph && Photo.has(v.ph) ? " has-ph" : "") + '" style="--zc:' + ZONES[zone].color + '">' +
          (v.ph && Photo.has(v.ph) ? Photo.html(v.ph, { cls: "veg-ph" }) : '<div class="veg-emo" aria-hidden="true">' + v.emo + '</div>') + '<h4>' + v.t + '</h4>' + pts(v.d) + '</div>';
      }).join("") + '</div>'
    });

    blocks.push({
      title: "주민 생활",
      html: '<div class="life"><figure class="life-img"><img src="assets/lifestyle/' + d.img + '.png" alt="' + ZONES[zone].name + ' 기후 지역의 주민 생활 삽화"></figure>' +
        '<div class="life-cards">' + d.life.map(function (l) {
          return '<div class="lc" style="--zc:' + ZONES[zone].color + '"><span class="lc-k">' + l.k + '</span><span class="lc-d">' + fmtKo(l.d) + '</span></div>';
        }).join("") + '</div></div>'
    });

    d.quiz.concat([graphQuiz(zone)]).forEach(function (q, i) {
      blocks.push({ title: "함께 풀기 " + (i + 1), kind: "quiz", quiz: q });
    });
    blocks.push({ title: "정리", kind: "summary", terms: d.terms, html: pts(d.sum, "lg") });
    CHAPTER_CONTENT[d.id] = { blocks: blocks };
  }

  ["A", "B", "C", "D", "E", "H"].forEach(build);
})();
