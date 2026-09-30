/* ============================================================
   지오엑스-세계의 기후 — ui/slides.js
   슬라이드형 블록 틀 (기획서 3-3) — 한 챕터 = 화면 크기 블록 여러 장
   - 블록 높이 = 화면 높이, 스크롤하면 블록 단위로 멈춤(스크롤 스냅)
   - 오른쪽 블록 점: 지금 블록 표시, 누르면 그 블록으로
   - 첫 블록 = 표지(파트·챕터·목표·이번 챕터 차례) · 챕터 이동은 사이드바 목차로 (「다음 챕터」 버튼 없음)
   챕터 내용 등록: CHAPTER_CONTENT["1-1"] = { blocks: [ { title, kind, html, quiz, init } … ] }
     kind: "content"(기본) · "think"(생각해 보기) · "quiz"(함께 풀기, quiz 필드) · "summary"(정리)
     html: 문자열 또는 function(p) → 문자열 / init(블록 요소, p): 그린 뒤 동작 연결
   ============================================================ */
"use strict";

const CHAPTER_CONTENT = {};

/* 2-2 기후 요인으로 가는 링크 이름 → 열 노드 (PART 1·5·6 링크 공용) */
function factorNode(label) {
  const L = String(label || "");
  const map = [["해류", "cur:0"], ["수륙", "land:0"], ["계절풍", "mon:0"], ["기단", "am:0"], ["지형", "ter:0"], ["위도", "lat:0"]];
  for (let i = 0; i < map.length; i++) if (L.indexOf(map[i][0]) >= 0) return map[i][1];
  return "";
}
/* 챕터 링크 칩 (PART 1·5·6 공용) — 2-2로 가는 링크는 이름에 맞는 노드까지 엶 */
function chapterChip(id, label, node) {
  const p = PAGE_BY_ID[id];
  const nd = node || (id === "2-2" ? factorNode(label) : "");
  return '<a class="go-chip" href="#' + id + '" data-go="' + id + '"' + (nd ? ' data-node="' + nd + '"' : "") + '><span class="cid">' + id + '</span>' +
    escHtml(label || (p ? p.title : id)) + ' <span aria-hidden="true">→</span></a>';
}


const Slides = (function () {
  const KIND_TAG = { think: "생각해 보기", quiz: "함께 풀기", summary: "정리" };

  function coverHtml(p, def) {
    let toc = "";
    def.blocks.forEach(function (b, i) {
      toc += '<li><button type="button" class="toc-go" data-blk="' + (i + 1) + '">' +
        '<span class="toc-n">' + (i + 2) + '</span>' + escHtml(b.title) + '</button></li>';
    });
    const zone = p.zone ? ZONES[p.zone] : null;
    return '<section class="blk blk--cover" data-blk="0">' +
      '<div class="cover-in">' +
        '<div class="crumb"><span class="pn">PART ' + p.part.id + '</span>' + escHtml(p.part.title) + '</div>' +
        '<h2 class="cover-title"><span class="cid">' + p.id + '</span>' + escHtml(p.title) +
          (zone ? ' <span class="zone-chip" style="--zc:' + zone.color + '"><b>' + p.zone + '</b>' + escHtml(p.chapter.codes) + '</span>' : "") + '</h2>' +
        '<p class="goal"><span class="goal-tag">학습 목표</span>' + fmtKo(escHtml(p.goal)) + '</p>' +
        '<ol class="cover-toc">' + toc + '</ol>' +
      '</div>' +
      '<div class="scroll-hint" aria-hidden="true">아래로 스크롤 <span>↓</span></div>' +
    '</section>';
  }

  function blockHtml(p, b, i, n) {
    const kind = b.kind || "content";
    let body = kind === "quiz" ? Quiz.html(b.quiz) : (typeof b.html === "function" ? b.html(p) : (b.html || ""));
    /* 정리 블록: terms(핵심 용어)가 있으면 아래에 용어 칩 — 교사가 하나씩 짚으며 확인 */
    if (kind === "summary" && b.terms) {
      body += '<div class="sum-check"><span class="sum-check-l">핵심 용어</span>' +
        b.terms.map(function (t) { return '<span class="sum-term">' + escHtml(t) + '</span>'; }).join("") + '</div>';
    }
    return '<section class="blk blk--' + kind + '" data-blk="' + (i + 1) + '">' +
      '<header class="blk-head">' +
        '<div class="blk-meta">' + ((b.tag || KIND_TAG[kind]) ? '<span class="blk-kind' + (b.tag ? ' tag' : '') + '">' + (b.tag || KIND_TAG[kind]) + '</span>' : "") +
          '<span class="blk-where">' + p.id + ' ' + escHtml(p.title) + '</span><span class="blk-no">' + (i + 2) + ' / ' + n + '</span></div>' +
        '<h3 class="blk-title">' + escHtml(b.title) + '</h3>' +
      '</header>' +
      '<div class="blk-body">' + body + '</div>' +
    '</section>';
  }

  function render(p, def) {
    const n = def.blocks.length + 1;
    let html = coverHtml(p, def);
    def.blocks.forEach(function (b, i) { html += blockHtml(p, b, i, n); });
    return html;
  }

  /* 그린 뒤: 블록별 동작 · 함께 풀기 · 블록 점 */
  let observer = null;
  function init(pageEl, p, def) {
    def.blocks.forEach(function (b, i) {
      const el = pageEl.querySelector('.blk[data-blk="' + (i + 1) + '"]');
      if (b.kind === "quiz") Quiz.init(el, b.quiz);
      if (b.init) b.init(el, p);
    });

    const nav = $("blk-nav");
    const n = def.blocks.length + 1;
    let dots = "";
    for (let i = 0; i < n; i++) {
      const t = i === 0 ? "표지" : def.blocks[i - 1].title;
      dots += '<button type="button" class="bn-dot" data-blk="' + i + '" title="' + escHtml(t) + '" aria-label="' + (i + 1) + '번 블록: ' + escHtml(t) + '"></button>';
    }
    nav.innerHTML = dots;
    nav.hidden = false;

    if (observer) observer.disconnect();
    const blocks = pageEl.querySelectorAll(".blk");
    const setOn = function (k) {
      nav.querySelectorAll(".bn-dot").forEach(function (d) { d.classList.toggle("on", +d.getAttribute("data-blk") === k); });
    };
    setOn(0);
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (en.isIntersecting) setOn(+en.target.getAttribute("data-blk")); });
      }, { root: pageEl, threshold: 0.55 });
      blocks.forEach(function (b) { observer.observe(b); });
    }
  }

  function go(k) {
    const el = $("page").querySelector('.blk[data-blk="' + k + '"]');
    if (el) el.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
  }

  function clear() {
    if (observer) { observer.disconnect(); observer = null; }
    const nav = $("blk-nav");
    nav.hidden = true;
    nav.innerHTML = "";
  }

  function initNav() {
    document.addEventListener("click", function (e) {
      const b = e.target.closest(".bn-dot, .toc-go");
      if (b) go(+b.getAttribute("data-blk"));
    });
  }

  return { render: render, init: init, clear: clear, go: go, initNav: initNav };
})();

/* 정리 그림 카드 — 이모지(픽토그램) + 핵심어 + 설명(문장 하나 또는 개조식 목록)
   sumCards([{ emo, t, d: 문장 | [문장…], c(색), float(아이콘 둥실) }], 추가 클래스(g3: 3칸 격자)) → 정리 블록 html */
function sumCards(list, cls) {
  return '<div class="sum-cards n' + list.length + (cls ? ' ' + cls : '') + '">' + list.map(function (x, i) {
    return '<div class="sum-card' + (Array.isArray(x.d) ? ' has-l' : '') + '" style="--sc:' + (x.c || 'var(--accent)') + ';--i:' + i + '">' +
      '<span class="sum-emo' + (x.float ? ' float' : '') + '" aria-hidden="true">' + x.emo + '</span>' +
      '<span class="sum-t">' + x.t + '</span>' +
      (Array.isArray(x.d) ? '<ul class="sum-l">' + x.d.map(function (t) { return '<li>' + fmtKo(t) + '</li>'; }).join('') + '</ul>'
        : '<span class="sum-d">' + fmtKo(x.d) + '</span>') + '</div>';
  }).join('') + '</div>';
}
