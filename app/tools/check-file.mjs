/* ============================================================
   지오엑스-세계의 기후 — tools/check-file.mjs  (배포 제외)
   더블클릭 실행(file://) 점검 — 헤드리스 Chrome으로 index.html을 직접 열어
   ① 앱 시작·목차 ② 챕터 이동·주소 ③ PART 3 3D 틀 연결(챕터 ↔ 3D 단계,
   3D 안 ▶로 단계가 바뀌면 앱 챕터도 따라감) ④ PART 1 슬라이드·지도·함께 풀기 ⑤ 해상도별 화면 캡처(tools/shots/) ⑥ 스크립트 오류
   실행: node tools/check-file.mjs   (app 폴더에서, Node 22 이상)
   ============================================================ */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const APP = dirname(dirname(fileURLToPath(import.meta.url)));
const SHOTS = join(APP, "tools", "shots");
const PORT = 9340;
const BROWSERS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
];
const exe = BROWSERS.find(existsSync);
if (!exe) { console.error("Chrome/Edge를 찾지 못했습니다."); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(tmpdir(), "geoclimate-check-" + Date.now());
const url = pathToFileURL(join(APP, "index.html")).href + "#home";
const proc = spawn(exe, [
  "--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + profile,
  "--no-first-run", "--no-default-browser-check", "--enable-unsafe-swiftshader", "--use-angle=swiftshader",
  "--window-size=1366,768", url
], { stdio: "ignore" });

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok });
  console.log((ok ? "  [통과] " : "  [실패] ") + name + (detail ? "  — " + detail : ""));
}

let ws, seq = 0;
const pending = new Map();
const contexts = new Map();       // frameId → executionContextId
const errors = [];
function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => pending.set(id, { res, rej }));
}
async function evalIn(expr, contextId) {
  const r = await send("Runtime.evaluate", Object.assign(
    { expression: expr, awaitPromise: true, returnByValue: true }, contextId ? { contextId } : {}));
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
const evalApp = (expr) => evalIn(expr);
async function waitFor(expr, ms = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (await evalApp(expr)) return true; } catch (e) { /* 아직 준비 전 */ }
    await sleep(200);
  }
  return false;
}
async function atmosContext() {
  const tree = await send("Page.getFrameTree");
  const child = (tree.frameTree.childFrames || []).find((f) => /atmos3d\/index\.html/.test(f.frame.url));
  return child ? contexts.get(child.frame.id) : null;
}
async function shot(name, w, h, mobile) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: !!mobile });
  if (mobile) await send("Emulation.setTouchEmulationEnabled", { enabled: true });
  await sleep(900);
  const r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(SHOTS, name + ".png"), Buffer.from(r.data, "base64"));
}

try {
  let target = null;
  for (let i = 0; i < 50 && !target; i++) {
    try {
      const list = await (await fetch("http://127.0.0.1:" + PORT + "/json")).json();
      target = list.find((t) => t.type === "page" && t.url.startsWith("file:"));
    } catch (e) { /* 아직 시작 전 */ }
    if (!target) await sleep(200);
  }
  if (!target) throw new Error("브라우저 페이지를 찾지 못했습니다.");
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return; }
    if (m.method === "Runtime.executionContextCreated") {
      const c = m.params.context;
      if (c.auxData && c.auxData.isDefault) contexts.set(c.auxData.frameId, c.id);
    }
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error") errors.push(m.params.entry.text + " (" + (m.params.entry.url || "") + ")");
  });
  await send("Page.enable");
  await send("Log.enable");
  await send("Runtime.enable");
  mkdirSync(SHOTS, { recursive: true });

  console.log("대상: " + url);
  console.log("\n① 앱 시작·목차");
  check("앱이 file://에서 시작됨(홈)", await waitFor("typeof app === 'object' && !!app.page && app.page.id === 'home'"));
  check("목차: 파트 6개 · 챕터 25개", await evalApp("document.querySelectorAll('#nav .nav-part').length === 6 && document.querySelectorAll('#nav .ch-row').length === 25"));
  check("지오퍼스·장면 재생기·발표 모드 없음", await evalApp("typeof Geopus === 'undefined' && typeof nextScene === 'undefined' && typeof setPresent === 'undefined' && !document.getElementById('player')"));

  console.log("\n② 챕터 이동·주소");
  await evalApp("document.querySelector('#nav .ch-row[data-page=\"2-2\"]').click(), true");
  check("목차에서 2-2 누르기 → 기후 요인, 주소 #2-2", await waitFor("app.page.id === '2-2' && location.hash === '#2-2'", 2000));
  check("현재 파트(PART 2)만 펼침", await evalApp("[...document.querySelectorAll('#nav .nav-part.open')].map((li) => li.dataset.part).join() === '2'"));
  check("「다음 챕터」 버튼 없음 · PART 3 머리글 없음", await evalApp("!document.querySelector('.next-link') && !document.getElementById('atmos-head')"));
  await evalApp("document.querySelector('#nav .ch-row[data-page=\"3-1\"]').click(), true");
  check("목차에서 3-1 → 3D 화면", await waitFor("app.page.id === '3-1' && !document.getElementById('atmos').hidden", 2000));
  await evalApp("location.hash = '#5-3', true");
  check("주소 #5-3 → 온대 기후", await waitFor("app.page.id === '5-3' && document.title.startsWith('5-3')", 2000));
  await evalApp("location.hash = '#4', true");
  check("주소 #4 → PART 4 첫 챕터(4-1)", await waitFor("app.page.id === '4-1'", 2000));

  console.log("\n③ PART 3 3D 틀 연결 (file://)");
  await evalApp("goPage('3-1'), true");
  const ready = await waitFor("Atmos.ready === true", 30000);
  check("3D 준비 완료 메시지 받음(ready)", ready);
  if (ready) {
    await evalApp("goPage('3-5'), true");
    check("목차로 3-5 → 3D 5단계", await waitFor("Atmos.step === 4 && location.hash === '#3-5'", 5000));
    const ctx = await atmosContext();
    check("3D 틀의 실행 환경 찾음", !!ctx);
    if (ctx) {
      check("3D 사이드바 숨김 · 진행 막대(◀▶) 보임", await evalIn("document.body.classList.contains('embedded') && getComputedStyle(document.getElementById('sidebar')).display === 'none' && getComputedStyle(document.querySelector('.transport')).display !== 'none'", ctx));
      await evalIn("goBeat(4, STEPS[4].beats.length - 1), true", ctx);
      await sleep(300);
      await evalIn("document.getElementById('tp-next').click(), true", ctx);
      check("3D ▶로 다음 단계 → 앱 챕터 3-6·주소·목차 따라감", await waitFor("app.page.id === '3-6' && location.hash === '#3-6' && document.querySelector('#nav .ch-row.on').dataset.page === '3-6'", 5000));
      await evalApp("goPage('1-2'), goPage('3-2'), true");
      check("다른 파트 갔다가 3-2 → 3D 2단계", await waitFor("Atmos.step === 1 && app.page.id === '3-2'", 5000));
    }
  }

  console.log("\n④ PART 1 기후의 이해 (슬라이드형 블록)");
  await evalApp("goPage('1-1'), true");
  check("1-1: 슬라이드형 블록 6장 · 블록 점 6개 · 학습 목표만(파트 목표 없음)", await waitFor("document.querySelectorAll('#page .blk').length === 6 && document.querySelectorAll('#blk-nav .bn-dot').length === 6 && !document.getElementById('blk-nav').hidden && !document.querySelector('.part-goal') && document.querySelector('.blk--cover .goal-tag').textContent === '학습 목표'", 3000));
  await evalApp("(() => { const it = document.querySelectorAll('.qz-item'); it.forEach((x) => x.querySelector('.qz-bin[data-k=\"' + x.dataset.a + '\"]').click()); return true; })()");
  check("1-1 함께 풀기(분류): 모두 맞게 누르면 8문장 정답 · 문제 「날씨와 기후를 구분해 보자」", await evalApp("document.querySelector('.qz-feedback').textContent.includes('8문장 중 8문장') && document.querySelector('.qz--sort .qz-q').textContent.includes('날씨와 기후를 구분해 보자')"));
  const ca = await evalApp("(() => { const b = document.querySelector('.ca-host'); b.querySelector('.anim-step[data-k=\"0\"]').click(); return b.getAttribute('data-step') + '/' + document.querySelectorAll('.ca-svg.day .ca-bar').length + '/' + document.querySelectorAll('.ca-svg.year .ca-bar').length; })()");
  check("1-1 날씨가 모여 기후: 두 그래프(31일 · 30해) · 1단계로 이동", ca === "0/31/30", ca);
  const tin = await evalApp("(() => { const i = document.querySelector('.today-in input'); i.value = '30'; i.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('.mp-b[data-m=\"0\"]').click(); return document.querySelector('.today-cmp').textContent + '|' + document.querySelector('.sm-val').textContent; })()");
  check("1-1 오늘 기온 입력 · 달 바꾸기(1월) → 평년값과 비교", /평년/.test(tin) && /높음/.test(tin) && /−2\.4℃$/.test(tin), tin);
  await evalApp("document.querySelector('.qz-reset').click(), document.querySelector('.qz-reveal').click(), true");
  check("「다시 풀기」 → 「정답 보기」로 해설·정답 표시", await evalApp("!document.querySelector('.qz-explain').hidden && document.querySelectorAll('.qz-bin.answer').length === 8"));
  check("1-1 정리: 그림 카드 4장", await evalApp("document.querySelectorAll('.blk--summary .sum-card').length === 4"));
  await evalApp("goPage('1-2'), true");
  check("1-2: 블록 6장 · 지도 1개(격자 그림 포함) · 위도별 비율 14줄", await waitFor("document.querySelectorAll('.lp-row').length === 14 && document.querySelectorAll('#page .blk').length === 6 && document.querySelectorAll('#page .wm').length === 1 && document.querySelector('.wm-img').getAttribute('href').startsWith('data:image/png')", 5000));
  check("지도 분류: 싱가포르 A · 카이로 B · 런던 C · 모스크바 D · 그린란드 내륙 E", await evalApp("WorldMap.codeAt(103.8,1.35)[0]==='A' && WorldMap.codeAt(31.2,30.0)[0]==='B' && WorldMap.codeAt(-0.1,51.5)[0]==='C' && WorldMap.codeAt(37.6,55.7)[0]==='D' && WorldMap.codeAt(-40,72)[0]==='E'"));
  await evalApp("document.querySelector('.wm-key[data-zone=\"B\"]').click(), true");
  check("범례 B 누르기 → 건조 기후 강조", await evalApp("document.querySelector('.wm').classList.contains('focused') && document.querySelector('.wm-key[data-zone=\"B\"]').classList.contains('on') && !document.querySelector('.wm-all').classList.contains('on')"));
  await evalApp("document.querySelector('.wm-all').click(), true");
  check("범례 「전체」 → 강조 해제", await evalApp("!document.querySelector('.wm').classList.contains('focused') && document.querySelector('.wm-all').classList.contains('on')"));
  await evalApp("document.querySelector('.zcard[data-i=\"3\"]').click(), true");
  check("기후대 한눈에: 카드(D) → 상세 모달 · 큰 그래프 · 설명", await waitFor("Modal.isOpen() && document.querySelector('.md-title').textContent === '냉대 기후' && !!document.querySelector('.md .cg-svg') && document.querySelectorAll('.md .zm-pts li').length === 3 && app.page.id === '1-2'", 2000));
  await evalApp("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })), true");
  check("Esc → 모달 닫힘", await evalApp("!Modal.isOpen()"));
  await evalApp("goPage('1-3'), true");
  check("1-3: 블록 4장 · 탐구 질문 지도 2개 · 강수 그래프 · 머리에 「탐구 질문 1」", await waitFor("document.querySelectorAll('#page .blk').length === 4 && document.querySelectorAll('#page .wm').length === 2 && !!document.querySelector('#page .cc') && document.querySelector('.blk[data-blk=\"1\"] .blk-kind').textContent === '탐구 질문 1' && !document.querySelector('#page .go-chip')", 5000));
  await evalApp("document.querySelector('.blk[data-blk=\"3\"] .q-answer').click(), true");
  check("탐구 질문 3 「정답 보기」 → 상세 모달(해발 고도) · 페이지 그대로", await waitFor("Modal.isOpen() && document.querySelector('.md .ans-key').textContent.includes('해발 고도') && app.page.id === '1-3'", 2000));
  await evalApp("document.querySelector('.md-x').click(), true");

  console.log("\n④-2 PART 4 기후 구분과 기후 그래프");
  await evalApp("goPage('4-1'), true");
  check("4-1: 블록 10장 · 큰 기후 그래프", await waitFor("document.querySelectorAll('#page .blk').length === 10 && document.querySelectorAll('#page .cg').length >= 5", 3000));
  await evalApp("document.querySelector('.blk[data-blk=\"3\"] .cg-btn[data-key=\"range\"]').click(), true");
  check("그래프 표시 버튼(연교차) → 연교차 표시 켜짐", await evalApp("document.querySelector('.blk[data-blk=\"3\"] .cg').classList.contains('cg-on-range')"));
  await evalApp("document.querySelector('.blk[data-blk=\"2\"] .anim-step[data-k=\"1\"]').click(), true");
  check("그래프 그리는 순서: 2단계(강수 막대) → 설명 바뀜", await evalApp("document.querySelector('.cg-build').dataset.st === '1' && document.querySelector('.build-say').textContent.includes('막대')"));
  await evalApp("document.querySelector('.sh-btn').click(), true");
  check("시드니를 7월부터 → 가로축 첫 달 7", await evalApp("document.querySelector('.sh-g.shifted .cg-axis-x text').textContent === '7'"));
  const rd = await evalApp(`(() => {
    document.querySelector('.rd-b[data-id="Mumbai"]').click();
    const hidden = document.querySelector('.rd-out').hidden;
    document.querySelector('.rd-show').click();
    return hidden && !document.querySelector('.rd-out').hidden && document.querySelector('.rd-graph .cg-title').textContent === '뭄바이';
  })()`);
  check("다른 도시로 읽어 보기: 뭄바이 · 값은 버튼으로 공개", rd);
  await evalApp("goPage('4-2'), true");
  check("4-2: 블록 12장 · 판별 순서도 4단계", await waitFor("document.querySelectorAll('#page .blk').length === 12 && document.querySelectorAll('.fl-row').length === 4", 3000));
  await evalApp("document.querySelector('.fl-all').click(), true");
  await evalApp("document.querySelector('.t13-i[data-code=\"Cs\"]').click(), true");
  check("기후 기호 칸(Cs) → 기호 풀이 · 로마 그래프", await evalApp("document.querySelector('.code-read .cr-eq').textContent.includes('지중해성') && document.querySelector('.code-read .cr-eq').textContent.includes('로마')"));
  check("순서도 「모두 보기」 → 4단계 모두 표시", await evalApp("document.querySelectorAll('.fl-row.shown').length === 4"));
  const lab = await evalApp(`(() => {
    const out = [];
    document.querySelector('.lab-pre[data-c="Cairo"]').click(); out.push(document.querySelector('.lab-z').textContent);
    document.querySelector('.lab-pre[data-c="Seoul"]').click(); out.push(document.querySelector('.lab-z').textContent);
    const i = document.querySelector('.lab-sl input[data-k="tmin"]'); i.value = -10; i.dispatchEvent(new Event('input', { bubbles: true })); out.push(document.querySelector('.lab-z').textContent);
    return out.join();
  })()`);
  check("기준 실험하기: 카이로 B · 서울 C · 최한월 −10℃ → D", lab === "B,C,D", lab);
  await evalApp("goPage('4-3'), true");
  check("4-3: 블록 11장 · 판별판 9개", await waitFor("document.querySelectorAll('#page .blk').length === 11 && document.querySelectorAll('.jb').length === 9", 3000));
  const jb = await evalApp(`(() => {
    const b = document.querySelector('.blk[data-blk="5"]');           // 도시 ⑤ = 서울
    b.querySelector('.jb-b[data-lv="1"][data-x="D"]').click();
    const wrongMarked = b.querySelector('.jb-b[data-lv="1"][data-x="D"]').classList.contains('no');
    b.querySelector('.jb-b[data-lv="1"][data-x="C"]').click();
    b.querySelector('.jb-b[data-lv="2"][data-x="w"]').click();
    return JSON.stringify({ wrongMarked, done: b.querySelector('.jb').classList.contains('done'), code: b.querySelector('.jb-code').textContent });
  })()`);
  check("판별판(서울): D 오답 표시 → C → w → 결과 Cw", /"wrongMarked":true/.test(jb) && /"done":true/.test(jb) && /"code":"Cw"/.test(jb), jb);
  check("판별 기준: 대표 9도시 Af·Aw·Cfb·Cs·Cw·Cs·BW·Df·ET", await evalApp("['Singapore','Darwin','London','Perth','Seoul','Rome','Cairo','Moscow','Barrow'].map((id) => Koppen.judge(CITY_BY_ID[id]).code).join() === 'Af,Aw,Cfb,Cs,Cw,Cs,BW,Df,ET'"));

  console.log("\n④-3 PART 5 세계의 기후대");
  for (const [ch, z] of [["5-1", "A"], ["5-2", "B"], ["5-3", "C"], ["5-4", "D"], ["5-5", "E"], ["5-6", "H"]]) {
    await evalApp("goPage('" + ch + "'), true");
    const ok = await waitFor("document.querySelectorAll('#page .blk').length >= 9 && document.querySelectorAll('#page .wm').length === 1 && !!document.querySelector('#page .life-img img') && document.querySelectorAll('#page .qz').length === 3", 4000);
    check(ch + ": 블록 틀(원인·분포 지도·그래프·세부 유형·식생·생활·함께 풀기 3·정리)", ok);
  }
  await evalApp("goPage('5-1'), true");
  await waitFor("!!document.querySelector('.belt-move')", 3000);
  await evalApp("document.querySelector('.belt-ctl .anim-step[data-k=\"6\"]').click(), true");
  await evalApp("document.querySelector('.rep-b[data-id=\"Bangkok\"]').click(), true");
  check("5-1 대표 그래프: 다른 도시(방콕 Aw)로 바꾸기", await evalApp("document.querySelector('.rep-graph .cg-title').textContent.includes('방콕') && document.querySelector('.rep-side .why-t').textContent.includes('Aw')"));
  check("5-1 기압대 이동: 7월 → 다윈 건기(고압대)", await evalApp("document.querySelector('.belt-city').classList.contains('dry') && document.querySelector('.belt-mon').textContent === '7월'"));
  await evalApp("document.querySelector('.belt-ctl .anim-step[data-k=\"0\"]').click(), true");
  check("5-1 기압대 이동: 1월 → 다윈 우기(적도 저압대)", await evalApp("document.querySelector('.belt-city').classList.contains('wet')"));
  check("사진 " + 21 + "장 모두 불러옴 (data/photos.js)", await evalApp("Object.keys(PHOTOS).length === 21 && Promise.all(Object.values(PHOTOS).map((p) => new Promise((r) => { const i = new Image(); i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); i.src = 'assets/photos/' + p.file; }))).then((a) => a.every(Boolean))"));
  check("5-x 삽화 6장 불러옴", await evalApp("Promise.all(['tropical','dry','temperate','subarctic','polar','highland'].map((n) => new Promise((r) => { const i = new Image(); i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); i.src = 'assets/lifestyle/' + n + '.png'; }))).then((a) => a.every(Boolean))"));

  console.log("\n④-4 PART 6 정리와 평가");
  await evalApp("goPage('6-1'), true");
  check("6-1: 블록 6장 · 도시 점 " + 103 + "개", await waitFor("document.querySelectorAll('#page .blk').length === 6 && document.querySelectorAll('.blk[data-blk=\"1\"] .wm-city').length === 103", 4000));
  await evalApp("document.querySelector('.blk[data-blk=\"1\"] .wm-city[data-city=\"Tokyo\"] circle').dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 10, clientY: 10 })), true");
  check("도시 점(도쿄) 누르기 → 오른쪽 그래프·정보", await waitFor("document.querySelector('.city-side .cinfo-name').textContent === '도쿄'", 2000));
  await evalApp("document.querySelector('.cmp-set[data-i=\"2\"]').click(), true");
  check("추천 비교(키토 vs 이키토스) → 표에 H · Af", await waitFor("[...document.querySelectorAll('.cmp-table tbody tr:first-child td')].map((t) => t.textContent).join() === 'H,Af'", 2000));
  await evalApp("goPage('6-2'), true");
  await waitFor("document.querySelectorAll('#page .blk').length === 4", 3000);
  await evalApp("document.querySelector('.pick-rand').click(), true");
  check("6-2: 무작위 도시 → 판별판 다시 그림", await waitFor("!!document.querySelector('.judge-host .jb') && document.querySelectorAll('.blk[data-blk=\"1\"] .wm-city.sel').length === 1", 2000));
  check("6-2: 다른 무작위 도시 버튼", await evalApp(`(() => { const a = document.querySelector('.judge-host .jb-city').textContent; document.querySelector('.jh-next').click(); return document.querySelector('.judge-host .jb-city').textContent !== a; })()`));
  await evalApp("goPage('6-3'), true");
  check("6-3: 교실 퀴즈 — 기후대 선택지 5개", await waitFor("document.querySelectorAll('.cq-opt').length === 5", 3000));
  const cq = await evalApp(`(() => {
    const txt = document.querySelector('.cq-hemi').textContent;
    document.querySelector('.cq-reveal').click();
    const ans = document.querySelector('.cq-opt.answer');
    document.querySelector('.cq-next').click();
    document.querySelector('.cq-mode[data-mode="code"]').click();
    return JSON.stringify({ hemi: txt, answered: !!ans, codeOpts: document.querySelectorAll('.cq-opt').length });
  })()`);
  await evalApp("document.querySelector('.cq-hint').click(), true");
  const team = await evalApp(`(() => {
    document.querySelector('.cq-team[data-team="2"]').click();
    const t0 = document.querySelector('.cq-turn').textContent;
    document.querySelector('.cq-reveal').click(); document.querySelector('.cq-next').click();
    return t0 + '/' + document.querySelector('.cq-turn').textContent;
  })()`);
  check("교실 퀴즈 두 팀 대결: 1팀 → 2팀 차례", team === "지금: 1팀 차례/지금: 2팀 차례", team);
  await evalApp("document.querySelector('.cq-team[data-team=\"0\"]').click(), true");
  await evalApp("document.querySelector('.cq-hint').click(), true");
  check("교실 퀴즈 힌트 → 그래프에 최난월·연강수량 표시", await evalApp("document.querySelector('.cq-graph .cg').classList.contains('cg-on-tmax') && document.querySelector('.cq-graph .cg').classList.contains('cg-on-pann')"));
  check("정답 보기 → 정답 표시 · 기후 기호 모드 선택지 4개", /"answered":true/.test(cq) && /"codeOpts":4/.test(cq), cq);

  console.log("\n⑤ 해상도별 화면 캡처 → tools/shots/");
  rmSync(SHOTS, { recursive: true, force: true });
  mkdirSync(SHOTS, { recursive: true });
  /* 제작한 챕터 블록별 (교실 스크린 1920×1080 전부 · 노트북 1366×768은 PART 1·4) */
  let n1 = 0;
  for (const [sz, w, h] of [["1920x1080", 1920, 1080], ["1366x768", 1366, 768]]) {
    const list = sz === "1920x1080" ? ["1-1", "1-2", "1-3", "4-1", "4-2", "4-3", "5-1", "5-2", "5-3", "5-4", "5-5", "5-6", "6-1", "6-2", "6-3"] : ["1-1", "1-2", "1-3", "4-1", "4-2", "4-3"];
    for (const ch of list) {
      await evalApp("goPage('" + ch + "'), true");
      await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
      await sleep(500);
      const nb = await evalApp("document.querySelectorAll('#page .blk').length");
      for (let k = 0; k < nb; k++) {
        await evalApp("document.querySelector('#page .blk[data-blk=\"" + k + "\"]').scrollIntoView(), true");
        await shot(ch + "-" + (k + 1) + "-" + sz, w, h);
        n1++;
      }
    }
  }
  console.log("  챕터 블록 캡처 " + n1 + "장");
  const sizes = [["1920x1080", 1920, 1080], ["1366x768", 1366, 768], ["1024x768", 1024, 768], ["768x1024", 768, 1024, true], ["375x812", 375, 812, true]];
  const pages = [["홈", "home"], ["1-2", "1-2"], ["4-3", "4-3"], ["5-3", "5-3"], ["6-3", "6-3"], ["3-2(3D)", "3-2"]];
  for (const [sz, w, h, mobile] of sizes) {
    for (const [name, hash] of pages) {
      await evalApp("location.hash = '#" + hash + "', true");
      await sleep(hash.startsWith("3-") ? 1500 : 300);
      await shot(name + "-" + sz, w, h, mobile);
    }
  }
  await send("Emulation.clearDeviceMetricsOverride");
  console.log("  캡처 " + sizes.length * pages.length + "장 저장");

  console.log("\n⑤ 스크립트 오류");
  const real = errors.filter((e) => !/favicon/i.test(e));
  check("오류 없음", real.length === 0, real.slice(0, 5).join(" | "));
} catch (e) {
  console.error("점검 중 문제: " + e.message);
  results.push({ name: "점검 실행", ok: false });
} finally {
  try { ws && ws.close(); } catch (e) {}
  proc.kill();
  await sleep(500);
  try { rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  const fail = results.filter((r) => !r.ok).length;
  console.log("\n결과: " + (results.length - fail) + " / " + results.length + " 통과");
  process.exit(fail ? 1 : 0);
}
