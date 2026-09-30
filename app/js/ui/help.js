/* ============================================================
   지오엑스-세계의 기후 — ui/help.js
   사용 안내 창 — 짧은 사용법 · 자료 출처 · 저작권 (Esc·바깥 누르기로 닫기)
   ============================================================ */
"use strict";

let helpReturnFocus = null;
function isHelpOpen() { return !$("help-modal").hidden; }
function openHelp() {
  helpReturnFocus = document.activeElement;
  $("help-modal").hidden = false;
  $("help-modal").querySelector(".modal-x").focus();
}
function closeHelp() {
  $("help-modal").hidden = true;
  if (helpReturnFocus && helpReturnFocus.focus) helpReturnFocus.focus();
}
function initHelp() {
  /* 사진 출처 목록 (data/photos.js) */
  const pl = $("help-photos");
  if (pl && typeof PHOTOS !== "undefined") pl.innerHTML = Object.keys(PHOTOS).map(function (k) {
    const p = PHOTOS[k];
    return "<li>" + escHtml(p.cap) + " — " + escHtml(p.author) + " · " + escHtml(p.license) + "</li>";
  }).join("");
  $("help-btn").addEventListener("click", openHelp);
  $("help-modal").querySelectorAll("[data-close]").forEach(function (el) { el.addEventListener("click", closeHelp); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isHelpOpen()) { e.preventDefault(); closeHelp(); }
  });
}
