/* ============================================================
   지오엑스-세계의 기후 — ui/photo.js
   사진 카드 (공용 부품) — 실제 경관·관측 장비 사진 + 출처·라이선스 표기, 누르면 화면 가득 확대
   - 사진 목록은 data/photos.js의 PHOTOS (파일은 assets/photos/)
   - 목록에 없는 사진은 아무것도 그리지 않음 → 사진을 추가하면 그 자리에 자동으로 나타남
   사용: Photo.html("rain-gauge", { cap: "덧붙일 설명", cls: "tall" })
   ============================================================ */
"use strict";

const Photo = (function () {
  function has(key) { return typeof PHOTOS !== "undefined" && !!PHOTOS[key]; }

  function credit(p) {
    return escHtml(p.author || "작자 미상") + " · " + escHtml(p.license) + " · 위키미디어 공용";
  }

  function html(key, opts) {
    if (!has(key)) return "";
    opts = opts || {};
    const p = PHOTOS[key];
    return '<figure class="photo' + (opts.cls ? " " + opts.cls : "") + '" data-photo="' + key + '" tabindex="0" role="button" aria-label="사진 크게 보기: ' + escHtml(p.cap) + '">' +
      '<img src="assets/photos/' + p.file + '" alt="' + escHtml(p.cap) + '" loading="lazy">' +
      '<figcaption><span class="ph-cap">' + fmtKo(opts.cap || p.cap) + '</span><span class="ph-credit">' + credit(p) + '</span></figcaption>' +
    '</figure>';
  }

  /* 확대 보기 */
  function open(key) {
    const p = PHOTOS[key];
    let box = $("photo-box");
    if (!box) {
      box = document.createElement("div");
      box.id = "photo-box";
      box.className = "photo-box";
      box.innerHTML = '<div class="pb-back" data-pb-close></div><figure class="pb-fig"><img alt=""><figcaption></figcaption></figure>' +
        '<button type="button" class="pb-x" data-pb-close aria-label="닫기">✕</button>';
      document.body.appendChild(box);
      box.addEventListener("click", function (e) { if (e.target.closest("[data-pb-close]")) box.hidden = true; });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") box.hidden = true; });
    }
    box.querySelector("img").src = "assets/photos/" + p.file;
    box.querySelector("img").alt = p.cap;
    box.querySelector("figcaption").innerHTML = '<b>' + fmtKo(p.cap) + '</b><span>' + credit(p) + '</span>';
    box.hidden = false;
  }

  document.addEventListener("click", function (e) {
    const f = e.target.closest(".photo[data-photo]");
    if (f) open(f.getAttribute("data-photo"));
  });
  document.addEventListener("keydown", function (e) {
    const f = e.target.closest && e.target.closest(".photo[data-photo]");
    if (f && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(f.getAttribute("data-photo")); }
  });

  return { html: html, has: has, open: open };
})();
