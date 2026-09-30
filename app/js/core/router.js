/* ============================================================
   지오엑스-세계의 기후 — core/router.js
   주소 끝 #파트-챕터 ↔ 페이지 (기획서 v0.6 3-5)
     #home     홈 · 수업 시작하기
     #2-2      PART 2 · 챕터 2-2 기후 요인
     #3        PART 3 첫 챕터(3-1)
   새로고침하거나 즐겨찾기로 바로 그 챕터를 열 수 있음 (페이지 안 스크롤 위치는 넣지 않음)
   ============================================================ */
"use strict";

function parseHash(hash) {
  let h = String(hash || "").replace(/^#/, "");
  try { h = decodeURIComponent(h); } catch (e) { /* 그대로 */ }
  if (!h || h === "home" || h === "start") return "home";
  const t = h.split("-");
  const part = PARTS.filter(function (x) { return x.id === t[0]; })[0];
  if (!part) return null;
  const id = t[0] + "-" + (t[1] || "1");
  return PAGE_BY_ID[id] ? id : part.chapters[0].id;
}

function writeHash(p) {
  const h = "#" + p.id;
  if (location.hash === h) return;
  try { history.replaceState(null, "", h); } catch (e) { /* file:// 등에서 막히면 무시 */ }
}
