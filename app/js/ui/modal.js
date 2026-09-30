/* ============================================================
   지오엑스-세계의 기후 — ui/modal.js
   상세 모달 (공용 부품) — 페이지를 옮기지 않고 그 자리에서 자세한 내용·정답을 크게 보여 줌
   사용: Modal.open({ title, tag, color, html, init(모달 몸통) })  · Modal.close()
   닫기: ✕ · 바깥 누르기 · Esc
   ============================================================ */
"use strict";

const Modal = (function () {
  let box = null, back = null;
  function build() {
    box = document.createElement("div");
    box.className = "md";
    box.hidden = true;
    box.innerHTML = '<div class="md-back" data-md-close></div>' +
      '<div class="md-win" role="dialog" aria-modal="true" aria-labelledby="md-title">' +
        '<header class="md-head"><span class="md-tag"></span><h3 id="md-title" class="md-title"></h3>' +
          '<button type="button" class="md-x" data-md-close aria-label="닫기">✕</button></header>' +
        '<div class="md-body"></div>' +
      '</div>';
    document.body.appendChild(box);
    box.addEventListener("click", function (e) { if (e.target.closest("[data-md-close]")) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !box.hidden) { e.stopPropagation(); close(); } });
  }
  function open(o) {
    if (!box) build();
    back = document.activeElement;
    const tag = box.querySelector(".md-tag");
    tag.textContent = o.tag || "";
    tag.hidden = !o.tag;
    box.querySelector(".md-title").innerHTML = o.title || "";
    box.querySelector(".md-win").style.setProperty("--mc", o.color || "var(--accent)");
    const body = box.querySelector(".md-body");
    body.innerHTML = o.html || "";
    body.scrollTop = 0;
    box.hidden = false;
    document.body.classList.add("md-open");
    if (o.init) o.init(body);
    box.querySelector(".md-x").focus();
  }
  function close() {
    if (!box || box.hidden) return;
    box.hidden = true;
    document.body.classList.remove("md-open");
    if (back && back.focus) back.focus();
  }
  function isOpen() { return !!box && !box.hidden; }
  return { open: open, close: close, isOpen: isOpen };
})();
