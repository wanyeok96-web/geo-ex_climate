/* ============================================================
   지오엑스-세계의 기후 — ui/pages.js
   내용 영역 그리기 — 홈(수업 시작하기) · 챕터 페이지(스크롤 한 페이지)
   챕터 페이지 틀 (기획서 v0.6 3-3):
     머리글(PART · 챕터 · 학습 목표 — 파트 목표는 쓰지 않고 학습 목표로 통일, 2026-09-29) → 본문 (챕터 이동은 사이드바 목차로)
   아직 만들지 않은 챕터는 본문 자리에 「이 챕터에 들어올 내용」을 보여 줌
   PART 3(3D) 챕터는 chapters/atmos.js가 그림
   ============================================================ */
"use strict";

/* 머리글 HTML — 2D 챕터와 3D 챕터가 함께 씀 */
function chapterHeadHtml(p) {
  const c = p.chapter;
  const zone = p.zone ? ZONES[p.zone] : null;
  return '<div class="crumb"><span class="pn">PART ' + p.part.id + '</span>' + escHtml(p.part.title) +
      (p.part.is3d ? ' <span class="badge-3d">3D</span>' : "") + '</div>' +
    '<h2 class="ch-title"><span class="cid">' + c.id + '</span>' + escHtml(c.title) +
      (zone ? ' <span class="zone-chip" style="--zc:' + zone.color + '"><b>' + p.zone + '</b>' + escHtml(c.codes) + '</span>' : "") + '</h2>' +
    '<p class="goal"><span class="goal-tag">학습 목표</span>' + fmtKo(escHtml(p.goal || "")) + '</p>';
}

function renderHomePage() {
  let map = "";
  PARTS.forEach(function (part) {
    let chips = "";
    part.chapters.forEach(function (c) {
      chips += '<a class="chip" href="#' + c.id + '" data-go="' + c.id + '">' +
        (c.zone ? '<i class="zdot" style="background:' + ZONES[c.zone].color + '"></i>' : "") +
        '<span class="cid">' + c.id + '</span>' + escHtml(c.title) + '</a>';
    });
    map += '<li class="part-card">' +
      '<a class="pc-head" href="#' + part.chapters[0].id + '" data-go="' + part.chapters[0].id + '">' +
        '<span class="pc-ic">' + partIcon(part.icon) + '</span>' +
        '<span class="pc-text"><span class="pn">PART ' + part.id + '</span>' +
        '<span class="pc-title">' + escHtml(part.title) + (part.is3d ? ' <span class="badge-3d">3D</span>' : "") + '</span></span>' +
      '</a>' +
      '<p class="pc-goal">' + fmtKo(escHtml(part.goal)) + '</p>' +
      '<div class="chips">' + chips + '</div>' +
    '</li>';
  });
  return '<div class="home">' +
    '<div class="home-hero">' +
      '<div class="kicker">세계지리 기후 디지털 교과서</div>' +
      '<h2 class="home-title">지오엑스-세계의 기후</h2>' +
      '<p class="lead">날씨와 기후에서 시작해 <b>기후 요소·요인</b>, <b>대기 대순환</b>, <b>쾨펜의 기후 구분</b>, <b>세계의 기후대</b>까지 — 교실 스크린에 띄워 기후 수업을 처음부터 끝까지 진행하는 디지털 교과서</p>' +
      '<a class="cta" href="#1-1" data-go="1-1">PART 1부터 시작하기 <span aria-hidden="true">→</span></a>' +
      '<div class="zone-strip" aria-hidden="true"><i style="background:var(--zA)"></i><i style="background:var(--zB)"></i><i style="background:var(--zC)"></i><i style="background:var(--zD)"></i><i style="background:var(--zE)"></i><i style="background:var(--zH)"></i></div>' +
    '</div>' +
    '<h3 class="sec-title">파트 지도</h3>' +
    '<ol class="part-map">' + map + '</ol>' +
    '<div class="howto">' +
      '<h3 class="sec-title">사용 방법</h3>' +
      '<ul>' +
        '<li>왼쪽 목차에서 <b>파트 → 챕터</b>를 골라 챕터 열기 — 챕터 안 내용은 아래로 스크롤하며 진행</li>' +
        '<li>PART 3 대기 대순환은 3D 화면 아래의 <b>◀ ▶</b> 버튼으로 장면 이동</li>' +
        '<li>챕터 안: 스크롤하면 블록(화면) 단위로 멈춤 · 오른쪽 <b>점</b>으로 블록 이동</li>' +
        '<li><b>함께 풀기</b>: 학생 답을 선택지에서 누름 → 맞음·틀림 표시 · <b>「정답 보기」</b> · <b>「다시 풀기」</b></li>' +
        '<li>목차 위쪽 <b>«</b> 버튼으로 목차를 접어 화면을 넓게 사용</li>' +
      '</ul>' +
    '</div>' +
    '<div class="copyright">' +
      '<p>무단 배포·복제·상업적 이용 금지 | ⓒ 어나더 지오엑스(Geo-Ex)</p>' +
      '<p>제작: 경기 이솔고등학교 교사 이왕혁 | 문의: wanyeok96@gmail.com</p>' +
    '</div>' +
  '</div>';
}

function renderChapterPage(p) {
  const zone = p.zone ? ZONES[p.zone] : null;
  let items = "";
  (p.plan || []).forEach(function (t) { items += '<li>' + fmtKo(escHtml(t)) + '</li>'; });
  return '<header class="ch-head">' + chapterHeadHtml(p) + '</header>' +
    '<div class="ch-body">' +
      '<div class="ready-card"' + (zone ? ' style="--zc:' + zone.color + '"' : "") + '>' +
        '<div class="ready-badge">준비 중 · PART ' + p.part.id + ' 제작 단계에서 채울 예정</div>' +
        '<h3>이 챕터에 들어올 내용</h3>' +
        '<ol class="plan-list">' + items + '</ol>' +
      '</div>' +
    '</div>';
}

function renderPage(p) {
  const page = $("page");
  const def = CHAPTER_CONTENT[p.id];
  page.scrollTop = 0;
  if (def) {                                   // 제작한 챕터: 슬라이드형 블록 (ui/slides.js)
    page.className = "page page--slides";
    page.innerHTML = Slides.render(p, def);
    Slides.init(page, p, def);
    return;
  }
  Slides.clear();
  page.className = "page page--" + p.kind;
  page.innerHTML = p.kind === "home" ? renderHomePage() : renderChapterPage(p);
}
