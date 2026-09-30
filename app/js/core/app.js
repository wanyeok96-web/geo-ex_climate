/* ============================================================
   지오엑스-세계의 기후 — core/app.js
   페이지 이동 — 앱 상태는 지금 보는 페이지 하나(app.page)뿐
   - 2D 챕터·홈: ui/pages.js가 그림
   - PART 3 챕터: chapters/atmos.js가 3D 틀(iframe)을 보여 주고 그 단계로 이동
   - 이동할 때마다 목차·하단 시트·주소·창 제목을 함께 갱신
   (장면 재생기·키보드·발표 모드는 v0.6에서 없앰 — 기획서 6절)
   ============================================================ */
"use strict";

const app = { page: null };

function goPage(id) {
  const p = PAGE_BY_ID[id] || PAGE_BY_ID["home"];
  const changed = app.page !== p;
  app.page = p;
  if (p.kind === "atmos3d") {
    $("page").hidden = true;
    Slides.clear();
    Atmos.show(p);
  } else {
    Atmos.hide();
    $("page").hidden = false;
    if (changed) renderPage(p);
  }
  renderChrome();
}

/* 3D 안의 ◀▶로 단계가 바뀌면 앱의 챕터·목차·주소를 맞춤 */
function onAtmosStep(step) {
  const p = PAGES.filter(function (x) { return x.kind === "atmos3d" && x.step === step; })[0];
  if (!p || p === app.page) return;
  app.page = p;
  renderChrome();
}

function renderChrome() {
  const p = app.page;
  renderNav(p);
  $("sheet-step").textContent = p.kind === "home" ? "홈" : pageLabel(p);
  $("sheet-title").innerHTML = p.kind === "home" ? "위로 끌어 올려 목차 열기" : fmtKo(escHtml(p.title));
  writeHash(p);
  document.title = (p.kind === "home" ? "" : p.id + " " + p.title + " — ") + "지오엑스-세계의 기후";
}

function initApp() {
  window.addEventListener("hashchange", function () {
    const id = parseHash(location.hash);
    if (id && (!app.page || id !== app.page.id)) goPage(id);
  });
  /* 페이지 안 [data-go] 링크(파트 지도, 관련 챕터 칩 등) */
  document.addEventListener("click", function (e) {
    const a = e.target.closest("[data-go]");
    if (!a) return;
    e.preventDefault();
    goPage(a.getAttribute("data-go"));
    /* data-node="노드id:소주제" — 노드형 블록(ui/nodes.js)이 있는 챕터면 그 노드를 바로 엶 */
    const nd = a.getAttribute("data-node");
    if (nd && typeof Nodes !== "undefined" && Nodes.get(app.page.id)) {
      const v = nd.split(":");
      Nodes.get(app.page.id).open(v[0], +v[1] || 0);
      Slides.go(1);
    }
    if (isMobile()) sheetExpand(false);
  });
}

