/* ============================================================
   지오엑스-세계의 기후 — chapters/atmos.js
   PART 3 대기대순환 — 3D(atmos3d/)를 내용 영역 전체에 틀(iframe)로 불러옴 (머리글 없음)
   - 챕터 3-1~3-8 = 3D 단계 1~8. 챕터를 고르면 3D가 그 단계 첫 장면으로 이동
   - 장면 넘기기는 3D 안의 ◀ ▶ 버튼이 담당 (앱에는 장면 이동 버튼·키가 없음)
   - 3D 안에서 단계가 바뀌면 앱의 챕터·목차·주소도 따라감
   - 앱 → 3D: postMessage { src:"geoclimate", cmd:"go"(i) | "layout"(mobile) }
   - 3D → 앱: { src:"atmos3d", type:"hello" | "ready" | "beat"(step, beat) }  (atmos3d/js/embed.js)
   - 처음 열 때만 주소(#단계)로 불러오고, 그 뒤에는 메시지로 이동 (다른 파트로 가도 틀은 숨겨 둔 채 유지)
   ============================================================ */
"use strict";

const Atmos = {
  loaded: false,
  ready: false,
  step: -1,
  pending: -1,

  frame: function () { return $("atmos-frame"); },

  post: function (msg) {
    const w = this.frame().contentWindow;
    if (!w) return;
    msg.src = "geoclimate";
    try { w.postMessage(msg, "*"); } catch (e) { /* 무시 */ }
  },

  /* PART 3 챕터 열기 */
  show: function (p) {
    $("atmos").hidden = false;
    const i = p.step;
    if (!this.loaded) {
      this.loaded = true;
      this.step = i;
      this.frame().src = "atmos3d/index.html#" + (i + 1) + "-1";
      return;
    }
    if (!this.ready) { this.pending = i; return; }
    if (i !== this.step) this.post({ cmd: "go", i: i, k: 0 });
  },
  hide: function () { $("atmos").hidden = true; },

  syncLayout: function () { if (this.loaded) this.post({ cmd: "layout", mobile: isMobile() }); },

  onMessage: function (e) {
    if (e.source !== this.frame().contentWindow) return;
    const d = e.data;
    if (!d || d.src !== "atmos3d") return;
    if (d.type === "hello") { this.syncLayout(); return; }
    if (d.type !== "ready" && d.type !== "beat") return;
    if (d.type === "ready") { this.ready = true; this.syncLayout(); }
    if (d.step >= 0) this.step = d.step;
    if (this.pending >= 0) {
      const i = this.pending; this.pending = -1;
      if (i !== this.step) { this.post({ cmd: "go", i: i, k: 0 }); return; }
    }
    if (app.page && app.page.kind === "atmos3d" && this.step >= 0) onAtmosStep(this.step);
  },

  init: function () {
    const self = this;
    window.addEventListener("message", function (e) { self.onMessage(e); });
  }
};
