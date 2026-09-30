/* ============================================================
   대기대순환 3D — embed.js  (지오엑스-세계의 기후 PART 3용 추가 파일)
   앱의 틀(iframe) 안에서 열렸을 때만 동작 — 단독 실행에서는 아무 일도 하지 않음
   - 3D 자체 사이드바·하단 시트·발표 모드(버튼·F 키)를 숨김 (목차는 앱이 담당, 발표 모드는 쓰지 않음)
   - 장면 넘기기는 3D 안의 ◀ ▶ 진행 막대가 담당 — 휴대전화 배치에서도 진행 막대를 보여 줌
   - 장면이 바뀔 때마다 앱에 알림: { src:"atmos3d", type:"beat", step, beat, beats }
   - 앱의 명령 받기: go(i, k) · layout(mobile)
   원본(대기대순환 3D/)과 다시 맞출 때: 원본 파일을 덮어쓴 뒤 index.html 맨 끝에
   <script src="js/embed.js"></script> 한 줄만 다시 넣으면 됨
   ============================================================ */
(function () {
  "use strict";
  if (window.parent === window) return;

  document.body.classList.add("embedded");
  let parentMobile = null;     // 앱이 알려 준 화면 형태 (null = 아직 모름 → 3D 자체 판단)
  let ready = false;

  function post(m) {
    m.src = "atmos3d";
    try { window.parent.postMessage(m, "*"); } catch (e) { /* 무시 */ }
  }

  const css = document.createElement("style");
  css.textContent =
    "body.embedded .sidebar, body.embedded .sidebar-handle, body.embedded .present-exit { display: none !important; }" +
    /* 3D 하단 시트가 없으므로 진행 막대(◀ ▶)를 늘 보여 주고, 자막을 화면 아래쪽으로 */
    "body.embedded .transport { display: flex !important; }" +
    "body.embedded .player { bottom: calc(var(--inset-b, 0px) + 12px); }" +
    /* 휴대전화: 진행 막대는 ◀ 점 ▶ ↻만 (자동·속도는 숨김) */
    "@media (max-width: 700px), (orientation: portrait) and (max-width: 1100px) {" +
    "  body.embedded #tp-auto, body.embedded #tp-speed { display: none; }" +
    "  body.embedded .transport { align-self: center; max-width: 100%; }" +
    "}";
  document.head.appendChild(css);

  /* 휴대전화 배치 여부는 앱을 따름 */
  isMobile = function () { return parentMobile == null ? mqMobile.matches : parentMobile; };

  /* 3D 하단 시트 자리를 비워 두지 않음 — 앱이 틀을 자기 하단 시트 바 위에서 끝냄 */
  const baseInsetTarget = insetTarget;
  insetTarget = function () {
    const r = baseInsetTarget();
    r.b -= r.pb; r.pb = 0;
    return r;
  };

  function beatInfo() {
    const i = state.stepIndex, k = state.beatIndex;
    return { step: i, beat: k, beats: i >= 0 ? STEPS[i].beats.length : 0 };
  }

  const baseGoBeat = goBeat;
  goBeat = function (i, k) {
    baseGoBeat(i, k);
    const b = beatInfo(); b.type = "beat"; post(b);
  };

  /* 3D 첫 장면이 열리는 순간(= 준비 완료)을 앱에 알림 */
  function postReady() {
    ready = true;
    const b = beatInfo();
    b.type = "ready";
    b.steps = STEPS.map(function (s) { return { title: s.title, beats: s.beats.length }; });
    post(b);
  }
  const baseOpenFromHash = openFromHash;
  openFromHash = function () {
    const r = baseOpenFromHash();
    postReady();
    return r;
  };

  /* 발표 모드 키(F)는 막음 — 앱은 발표 모드를 쓰지 않음 */
  window.addEventListener("keydown", function (e) {
    if (e.key === "f" || e.key === "F" || e.key === "ㄹ") { e.preventDefault(); e.stopPropagation(); }
  }, true);

  window.addEventListener("message", function (e) {
    if (e.source !== window.parent) return;
    const d = e.data;
    if (!d || d.src !== "geoclimate") return;
    if (d.cmd === "go" && ready) goBeat(d.i, d.k || 0);
    else if (d.cmd === "layout") parentMobile = !!d.mobile;
  });

  post({ type: "hello" });
  /* 글꼴이 이미 준비돼 있으면 3D가 이 파일보다 먼저 첫 장면을 열 수 있음 → 그때는 바로 준비 완료 알림 */
  if (state.stepIndex >= 0) postReady();
})();
