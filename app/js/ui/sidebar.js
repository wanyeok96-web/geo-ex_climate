/* ============================================================
   지오엑스-세계의 기후 — ui/sidebar.js
   왼쪽 목차 — geo-ex(지오엑스) 사이트 사이드바와 같은 모습 (기획서 v0.6 3-2)
   - 선 아이콘 + 파트 이름(그룹) → 들여 쓴 챕터(이모지·기후대 색 점)
   - 지금 보는 파트만 펼침, 파트 이름을 누르면 접기·펼치기
   데스크톱: 왼쪽 패널(« 접기 / ☰ 펴기)
   휴대전화·세로 태블릿: 하단 시트 — 평소엔 축소 바(현재 챕터)만, 위로 끌어 올리면 목차
   ============================================================ */
"use strict";

const sidebar = $("sidebar");

const ICON_HOME = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11 12 4.5 20 11"/><path d="M6.5 9.5V19.5h11V9.5"/><path d="M10 19.5v-5h4v5"/></svg>';
function partIcon(name) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + PART_ICONS[name] + '</svg>';
}
const partOpen = {};    // 사용자가 직접 펼치거나 접은 파트 (없으면 현재 파트만 펼침)

function chapterMark(c) {
  if (c.zone) return '<i class="zdot" style="background:' + ZONES[c.zone].color + '" title="' + ZONES[c.zone].name + ' 기후"></i>';
  return '<span class="emo" aria-hidden="true">' + c.emoji + '</span>';
}

function buildNav() {
  let html = '<li class="nav-home"><a class="nav-row home-row" href="#home" data-page="home">' +
    '<span class="ic">' + ICON_HOME + '</span><span class="tt">홈</span></a></li>';
  PARTS.forEach(function (part) {
    html += '<li class="nav-part" data-part="' + part.id + '">' +
      '<button class="part-row" type="button" aria-expanded="false">' +
        '<span class="ic">' + partIcon(part.icon) + '</span>' +
        '<span class="tt">' + escHtml(part.title) + (part.is3d ? ' <span class="badge-3d">3D</span>' : "") + '</span>' +
      '</button><ol class="ch-list">';
    part.chapters.forEach(function (c) {
      html += '<li><a class="nav-row ch-row" href="#' + c.id + '" data-page="' + c.id + '">' +
        chapterMark(c) +
        '<span class="tt"><span class="cid">' + c.id + '</span>' + escHtml(c.title) + '</span></a></li>';
    });
    html += '</ol></li>';
  });
  const ol = $("nav");
  ol.innerHTML = html;

  ol.addEventListener("click", function (e) {
    const row = e.target.closest(".part-row");
    if (row) {
      const li = row.parentNode, id = li.getAttribute("data-part");
      partOpen[id] = !li.classList.contains("open");
      li.classList.toggle("open", partOpen[id]);
      row.setAttribute("aria-expanded", String(partOpen[id]));
      return;
    }
    const a = e.target.closest("a[data-page]");
    if (!a) return;
    e.preventDefault();
    goPage(a.getAttribute("data-page"));
    if (isMobile()) sheetExpand(false);
  });
}

/* 지금 보는 챕터 표시 — 현재 파트는 늘 펼치고, 다른 파트는 사용자가 펼친 것만 */
function renderNav(p) {
  const cur = p.part ? p.part.id : null;
  document.querySelectorAll("#nav .nav-part").forEach(function (li) {
    const id = li.getAttribute("data-part");
    if (id === cur) partOpen[id] = true;
    const open = !!partOpen[id];
    li.classList.toggle("open", open);
    li.classList.toggle("current", id === cur);
    li.querySelector(".part-row").setAttribute("aria-expanded", String(open));
  });
  document.querySelectorAll("#nav .nav-row").forEach(function (a) {
    const on = a.getAttribute("data-page") === p.id;
    a.classList.toggle("on", on);
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  const on = document.querySelector("#nav .nav-row.on");
  if (on && on.scrollIntoView && !isMobile()) on.scrollIntoView({ block: "nearest" });
}

/* ------------------------------------------------------------
   접기·펴기 / 하단 시트
   ------------------------------------------------------------ */
function sheetExpand(open) {
  if (open) { sidebar.classList.add("expanded"); sidebar.classList.remove("collapsed"); }
  else { sidebar.classList.remove("expanded"); sidebar.classList.add("collapsed"); }
  Atmos.syncLayout();
}

function initSidebar() {
  buildNav();
  $("sidebar-close").addEventListener("click", function () { sheetExpand(false); });
  $("sidebar-handle").addEventListener("click", function () { sidebar.classList.remove("collapsed"); Atmos.syncLayout(); });
  $("brand").addEventListener("click", function (e) { e.preventDefault(); goPage("home"); if (isMobile()) sheetExpand(false); });
  if (isMobile()) sidebar.classList.add("collapsed");
  if (mqMobile.addEventListener) {
    mqMobile.addEventListener("change", function (e) {
      if (e.matches) sheetExpand(false);
      else { sidebar.classList.remove("collapsed", "expanded"); Atmos.syncLayout(); }
    });
  }

  /* 축소 바: 위/아래로 끌기 = 열고 닫기 · 누르기 = 토글 */
  const bar = $("sheet-bar");
  let sy = 0, st = 0;
  bar.addEventListener("touchstart", function (e) { sy = e.touches[0].clientY; st = Date.now(); }, { passive: true });
  bar.addEventListener("touchend", function (e) {
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dy) > 26) { sheetExpand(dy < 0); return; }
    if (Date.now() - st < 350) sheetExpand(!sidebar.classList.contains("expanded"));
  });
  bar.addEventListener("click", function () {
    if (!("ontouchstart" in window)) sheetExpand(!sidebar.classList.contains("expanded"));
  });
}
