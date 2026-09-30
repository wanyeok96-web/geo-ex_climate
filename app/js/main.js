/* ============================================================
   지오엑스-세계의 기후 — main.js
   시작 — 목차·사용 안내·3D 연결 준비 후 주소(#)의 챕터 열기
   ============================================================ */
"use strict";

(function start() {
  initSidebar();
  initHelp();
  Atmos.init();
  initApp();
  Slides.initNav();
  goPage(parseHash(location.hash) || "home");
})();
