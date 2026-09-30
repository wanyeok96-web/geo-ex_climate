/* ============================================================
   지오엑스-세계의 기후 — core/util.js
   공용 도구 — 요소 찾기 · 한국어 표기 다듬기(fmtKo) · 화면 조건 · 브라우저 저장
   ============================================================ */
"use strict";

const $ = function (id) { return document.getElementById(id); };

function escHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function stripTags(h) { return String(h == null ? "" : h).replace(/<[^>]+>/g, ""); }

/* 한국어 표기 다듬기 — 화면에 넣는 문장(HTML)에 적용 (대기대순환 3D core.js와 같은 규칙 + ℃·mm)
   · 숫자+단위(23.5°N, 10°~20°, −3℃, 60mm)는 줄 끝에서 떨어지지 않게 <span class="nw">로 감쌈
   · "위도 30°"처럼 앞말과 숫자, "바람 — 무역풍"의 줄표는 앞말에 붙여 줄 맨 앞에 오지 않게
   (태그 안쪽은 건드리지 않음) */
function fmtKo(html) {
  const unit = "(?:°[NS]?|℃|mm|%)";
  const num = "[−-]?\\d+(?:[.,]\\d+)*";
  const re = new RegExp("(" + num + "\\s?" + unit + "(?:\\s*~\\s*" + num + "\\s?" + unit + ")?)", "g");
  return String(html == null ? "" : html).split(/(<[^>]+>)/).map(function (part) {
    if (part.charAt(0) === "<") return part;
    return part
      .replace(re, '<span class="nw">$1</span>')
      .replace(/(위도|북위|남위|약|최한월|최난월)\s+(?=[−-]?\d)/g, "$1\u00a0")
      .replace(/ (—|–) /g, "\u00a0$1 ");
  }).join("");
}

/* 휴대전화 + 세로 태블릿 → 하단 시트 (style.css의 같은 조건과 짝, 대기대순환 3D와 동일) */
const mqMobile = window.matchMedia("(max-width: 700px), (orientation: portrait) and (max-width: 1100px)");
function isMobile() { return mqMobile.matches; }
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* 브라우저 저장 — 막혀 있어도(시크릿 창·file:// 제한) 앱은 그대로 동작 */
const store = {
  get: function (k, session) {
    try { return (session ? sessionStorage : localStorage).getItem("geoclimate-" + k); } catch (e) { return null; }
  },
  set: function (k, v, session) {
    try { (session ? sessionStorage : localStorage).setItem("geoclimate-" + k, String(v)); } catch (e) { /* 무시 */ }
  }
};
