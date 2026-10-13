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
  check("1-1: 슬라이드형 블록 7장 · 블록 점 7개 · 학습 목표만(파트 목표 없음)", await waitFor("document.querySelectorAll('#page .blk').length === 7 && document.querySelectorAll('#blk-nav .bn-dot').length === 7 && !document.getElementById('blk-nav').hidden && !document.querySelector('.part-goal') && document.querySelector('.blk--cover .goal-tag').textContent === '학습 목표'", 3000));
  await evalApp("(() => { const it = document.querySelectorAll('.qz-item'); it.forEach((x) => x.querySelector('.qz-bin[data-k=\"' + x.dataset.a + '\"]').click()); return true; })()");
  check("1-1 함께 풀기(분류): 모두 맞게 누르면 8문장 정답 · 문제 「날씨와 기후를 구분해 보자」", await evalApp("document.querySelector('.qz-feedback').textContent.includes('8문장 중 8문장') && document.querySelector('.qz--sort .qz-q').textContent.includes('날씨와 기후를 구분해 보자')"));
  const ca = await evalApp("(() => { const b = document.querySelector('.ca-host'); b.querySelector('.anim-step[data-k=\"0\"]').click(); return b.getAttribute('data-step') + '/' + document.querySelectorAll('.ca-svg.day .ca-bar').length + '/' + document.querySelectorAll('.ca-svg.year .ca-bar').length; })()");
  check("1-1 날씨가 모여 기후: 두 그래프(31일 · 30해) · 1단계로 이동", ca === "0/31/30", ca);
  const tin = await evalApp("(() => { const i = document.querySelector('.today-in input'); i.value = '30'; i.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('.mp-b[data-m=\"0\"]').click(); return document.querySelector('.today-cmp').textContent + '|' + document.querySelector('.sm-val').textContent; })()");
  check("1-1 오늘 기온 입력 · 달 바꾸기(1월) → 평년값과 비교", /평년/.test(tin) && /높음/.test(tin) && /−2\.4℃$/.test(tin), tin);
  await evalApp("document.querySelector('.qz-reset').click(), document.querySelector('.qz-reveal').click(), true");
  check("「다시 풀기」 → 「정답 보기」로 해설·정답 표시", await evalApp("!document.querySelector('.qz-explain').hidden && document.querySelectorAll('.qz-bin.answer').length === 8"));
  check("1-1 정리: 그림 카드 4장", await evalApp("document.querySelectorAll('.blk--summary .sum-card').length === 4"));
  const av = await evalApp(`(() => {
    const sp = () => parseFloat(document.querySelectorAll('.av-read .p2-big-v')[2].textContent);
    const seg = (i) => document.querySelector('[data-seg="win"] .p4-sb[data-i="' + i + '"]').click();
    seg(0); const a = sp(); seg(3); const b = sp();
    return a + '/' + b + '/' + document.querySelectorAll('.av-bar').length + '/' + document.querySelectorAll('.av-row').length;
  })()`);
  { const [a, b, n, r] = av.split("/").map(Number); check("시뮬레이터 30년 평균: 1년 평균은 크게 흔들림 · 30년 평균은 1℃ 미만 · 막대 60개 · 비교 4줄", a > 4 && b < 1 && n === 60 && r === 4, av); }
  await evalApp("goPage('1-2'), true");
  check("1-2: 블록 7장 · 지도 2개(기후 지도 · 경선 따라 걷기) · 위도별 비율 14줄", await waitFor("document.querySelectorAll('.lp-row').length === 14 && document.querySelectorAll('#page .blk').length === 7 && document.querySelectorAll('#page .wm').length === 2 && document.querySelector('.wm-img').getAttribute('href').startsWith('data:image/png')", 5000));
  check("지도 분류: 싱가포르 A · 카이로 B · 런던 C · 모스크바 D · 그린란드 내륙 E", await evalApp("WorldMap.codeAt(103.8,1.35)[0]==='A' && WorldMap.codeAt(31.2,30.0)[0]==='B' && WorldMap.codeAt(-0.1,51.5)[0]==='C' && WorldMap.codeAt(37.6,55.7)[0]==='D' && WorldMap.codeAt(-40,72)[0]==='E'"));
  await evalApp("document.querySelector('.wm-key[data-zone=\"B\"]').click(), true");
  check("범례 B 누르기 → 건조 기후 강조", await evalApp("document.querySelector('.wm').classList.contains('focused') && document.querySelector('.wm-key[data-zone=\"B\"]').classList.contains('on') && !document.querySelector('.wm-all').classList.contains('on')"));
  await evalApp("document.querySelector('.wm-all').click(), true");
  check("범례 「전체」 → 강조 해제", await evalApp("!document.querySelector('.wm').classList.contains('focused') && document.querySelector('.wm-all').classList.contains('on')"));
  const mw = await evalApp(`(() => {
    const i = document.querySelector('#mw-lat'); i.value = -30; i.dispatchEvent(new Event('input'));
    return document.querySelectorAll('.mw-read .p2-big-v')[1].textContent + '|' + [...document.querySelectorAll('.mw-seq .mw-z b')].map((b) => b.textContent).join('') + '|' + document.querySelectorAll('.mw-bar > i').length;
  })()`);
  check("시뮬레이터 경선 따라 걷기(20°E): 30°S = B · 지나온 순서 E → … → A → B · 띠 141칸", /^B /.test(mw) && /\|E.*A.*B\|141$/.test(mw), mw);
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
  check("4-1: 블록 11장 · 큰 기후 그래프", await waitFor("document.querySelectorAll('#page .blk').length === 11 && document.querySelectorAll('#page .cg').length >= 5", 3000));
  await evalApp("document.querySelector('.blk[data-blk=\"3\"] .cg-btn[data-key=\"range\"]').click(), true");
  check("그래프 표시 버튼(연교차) → 연교차 표시 켜짐", await evalApp("document.querySelector('.blk[data-blk=\"3\"] .cg').classList.contains('cg-on-range')"));
  await evalApp("document.querySelector('.blk[data-blk=\"2\"] .anim-step[data-k=\"2\"]').click(), true");
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
  const ed = await evalApp(`(() => {
    document.querySelectorAll('[data-seg="start"] .p4-sb')[0].click();
    document.querySelectorAll('.ed-svg .ed-p').forEach((p) => { for (let i = 0; i < 20; i++) p.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); });
    return document.querySelector('.ed-code').textContent;
  })()`);
  check("내가 만드는 그래프: 서울 모든 달 −20℃ → 한대(E)로 판별", ed.charAt(0) === 'E', ed);
  await evalApp("goPage('4-2'), true");
  check("4-2: 블록 18장 · 판별 순서도 4단계", await waitFor("document.querySelectorAll('#page .blk').length === 18 && document.querySelectorAll('.fl-row').length === 4", 3000));
  await evalApp("document.querySelector('.fl-all').click(), true");
  await evalApp("document.querySelector('.t13-i[data-code=\"Cs\"]').click(), true");
  check("기후 기호 칸(Cs) → 기호 풀이 · 로마 그래프", await evalApp("document.querySelector('.code-read .cr-eq').textContent.includes('지중해성') && document.querySelector('.code-read .cr-eq').textContent.includes('로마')"));
  await evalApp("document.querySelector('.st-dot[data-i=\"4\"]').click(), document.querySelector('.kt-n.leaf[data-k=\"Dw\"]').dispatchEvent(new MouseEvent('click', { bubbles: true })), true");
  check("쾨펜 이야기(1918 수치 기준) · 분류 체계 나무(Dw 가지 강조) · 1·2·3차 한눈에", await evalApp("document.querySelector('.st-card .st-y').textContent === '1918' && document.querySelector('.kt-t').textContent.includes('냉대 겨울 건조') && document.querySelectorAll('.kt-l.hot').length === 3 && document.querySelectorAll('.ov-r').length === 5"));
  await sleep(300);
  const bl = await evalApp(`(() => { document.querySelector('.bl-pre .p4-sb[data-p="1"]').click(); return document.querySelector('.bl-list').textContent; })()`);
  check("경계 기준 실험실: 온대·냉대 0℃ 기준 → 서울 C→D", bl.includes('서울') && bl.includes('C→D'), bl);
  check("판별 흐름 · 경계 도시: 서울 흐름 7줄 · 경계 도시 목록", await evalApp("document.querySelectorAll('.fw-r').length === 7 && document.querySelectorAll('.nb-c').length > 5"));
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
  check("4-3: 블록 12장(정리 없음, 기호 보고 그래프 고르기 · 그래프 추리) · 판별판 9개", await waitFor("document.querySelectorAll('#page .blk').length === 12 && document.querySelectorAll('.pk-o').length === 4 && document.querySelectorAll('.jb').length === 9", 3000));
  const jb = await evalApp(`(() => {
    const b = document.querySelector('.blk[data-blk="5"]');           // 도시 ⑤ = 서울
    b.querySelector('.jb-b[data-lv="1"][data-x="D"]').click();
    const wrongMarked = b.querySelector('.jb-b[data-lv="1"][data-x="D"]').classList.contains('no');
    b.querySelector('.jb-b[data-lv="1"][data-x="C"]').click();
    b.querySelector('.jb-b[data-lv="2"][data-x="w"]').click();
    return JSON.stringify({ wrongMarked, done: b.querySelector('.jb').classList.contains('done'), code: b.querySelector('.jb-code').textContent });
  })()`);
  check("판별판(서울): D 오답 표시 → C → w → 결과 Cw", /"wrongMarked":true/.test(jb) && /"done":true/.test(jb) && /"code":"Cw"/.test(jb), jb);
  const gs = await evalApp(`(() => {
    const before = document.querySelectorAll('.gs-c.on').length;
    document.querySelector('.gs-more').click();
    const after = document.querySelectorAll('.gs-c.on').length;
    const z = document.querySelectorAll('.gs-c.on').length && [...document.querySelectorAll('.gs-o')].find((b) => { b.click(); return b.classList.contains('ok'); });
    return before + '/' + after + '/' + (z ? z.dataset.z : '-') + '/' + document.querySelector('.gs-score').textContent + '/' + !document.querySelector('.gs-ans').hidden;
  })()`);
  check("그래프 추리: 단서 1 → 2개 · 맞히면 점수와 정답(기호 · 도시) 표시", /^1\/2\/[A-E]\//.test(gs) && !/점수 0/.test(gs) && /true$/.test(gs), gs);
  check("판별 기준: 대표 9도시 Af·Aw·Cfb·Cs·Cw·Cs·BW·Df·ET", await evalApp("['Singapore','Darwin','London','Perth','Seoul','Rome','Cairo','Moscow','Barrow'].map((id) => Koppen.judge(CITY_BY_ID[id]).code).join() === 'Af,Aw,Cfb,Cs,Cw,Cs,BW,Df,ET'"));

  console.log("\n④-3 PART 5 세계의 기후대");
  for (const [ch, z] of [["5-1", "A"], ["5-2", "B"], ["5-3", "C"], ["5-4", "D"], ["5-5", "E"], ["5-6", "H"]]) {
    await evalApp("goPage('" + ch + "'), true");
    const ok = await waitFor("document.querySelectorAll('#page .blk').length >= 9 && document.querySelectorAll('#page .wm').length === " + ({ '5-1': 2, '5-2': 2, '5-3': 3 }[ch] || 1) + " && !!document.querySelector('#page .life-img img') && document.querySelectorAll('#page .qz').length === 3", 4000);
    check(ch + ": 블록 틀(원인·분포 지도·그래프·세부 유형·식생·생활·함께 풀기 3·정리" + ({ "5-1": " · 기압대 지도", "5-2": " · 사막의 원인 지도", "5-3": " · 기압대 지도 · 바람 지도" }[ch] || "") + ")", ok);
  }
  await evalApp("goPage('5-1'), true");
  await waitFor("!!document.querySelector('.pb-move')", 3000);
  await evalApp("document.querySelector('.pb-top .anim-step[data-k=\"6\"]').click(), true");
  await evalApp("document.querySelector('.rep-b[data-id=\"Bangkok\"]').click(), true");
  check("5-1 대표 그래프: 다른 도시(방콕 Aw)로 바꾸기", await evalApp("document.querySelector('.rep-graph .cg-title').textContent.includes('방콕') && document.querySelector('.rep-side .why-t').textContent.includes('Aw')"));
  const pbSt = (k) => "(() => { const b = document.querySelector('.pb').closest('.blk'); return b.getAttribute('data-state') + '|' + b.querySelector('.pb-mon').textContent + '|' + b.querySelector('.pb-verdict').textContent; })()";
  const pb7 = await evalApp(pbSt());
  check("5-1 기압대 이동(평면 지도 · 단면): 7월 → 다윈 아열대 고압대 · 건기", /^sub\|7월\|건기/.test(pb7), pb7);
  await evalApp("document.querySelector('.pb-top .anim-step[data-k=\"0\"]').click(), true");
  const pb1 = await evalApp(pbSt());
  check("5-1 기압대 이동: 1월 → 다윈 적도 저압대 · 우기", /^eq\|1월\|우기/.test(pb1), pb1);
  const pbc = await evalApp(`(() => { const b = document.querySelector('.pb').closest('.blk'); b.querySelector('[data-seg="pbc"] .p4-sb[data-i="1"]').click(); return b.getAttribute('data-state') + '|' + document.querySelectorAll('.pb-band').length + '|' + document.querySelectorAll('.pb-badge').length; })()`);
  check("기압대 이동: 바마코(북반구) 1월 → 아열대 고압대 · 띠 7개 · H/L 배지 7개", pbc === "sub|7|7", pbc);
  check("사진 " + 21 + "장 모두 불러옴 (data/photos.js)", await evalApp("Object.keys(PHOTOS).length === 21 && Promise.all(Object.values(PHOTOS).map((p) => new Promise((r) => { const i = new Image(); i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); i.src = 'assets/photos/' + p.file; }))).then((a) => a.every(Boolean))"));
  const s5 = await evalApp(`(async () => {
    const out = [], wait = () => new Promise((r) => setTimeout(r, 400));
    goPage('5-1'); await wait();
    let i = document.querySelector('#s5-sq'); i.value = 15; i.dispatchEvent(new Event('input')); out.push(document.querySelector('.sq-read').textContent.includes('스콜'));
    goPage('5-2'); await wait();
    i = document.querySelector('#s5-dt'); i.value = 15; i.dispatchEvent(new Event('input')); out.push(document.querySelector('.dt-read').textContent.includes('36℃'));
    goPage('5-3'); await wait(); out.push(document.querySelectorAll('.ck-p').length === 12);
    goPage('5-5'); await wait();
    const m = document.querySelector('#s5-mon'); m.value = 11; m.dispatchEvent(new Event('input')); out.push(document.querySelector('.pn-read').textContent.includes('극야'));
    goPage('5-6'); await wait();
    i = document.querySelector('#s5-alt'); i.value = 4400; i.dispatchEvent(new Event('input')); out.push(document.querySelector('.an-read').textContent.includes('라마'));
    goPage('5-2'); await wait();
    const k = (x) => document.querySelector('.dc-k[data-k="' + x + '"]').click();
    k('hp'); out.push(document.querySelectorAll('.dc-r').length === 7);
    k('in'); k('cc'); k('rs'); out.push(document.querySelectorAll('.dc-r').length === 12 && document.querySelectorAll('.dc-d.hit').length === 12);
    goPage('5-4'); await wait();
    const pf = document.querySelector('.pf-play').closest('.blk');
    pf.querySelector('.anim-step[data-k="7"]').click(); out.push(document.querySelector('.pf-read').textContent.includes('1.3m'));
    pf.querySelector('.anim-step[data-k="0"]').click(); out.push(document.querySelector('.pf-read').textContent.includes('0.0m'));
    pf.querySelector('[data-seg="house"] .p4-sb[data-i="1"]').click(); pf.querySelector('.anim-step[data-k="7"]').click();
    out.push(document.querySelector('.pf-read').textContent.includes('건물 아래') && !!document.querySelector('.pf-ht.warn'));
    return out.join();
  })()`);
  check("PART 5 시뮬레이터: 스콜 · 사막 일교차 · 기후 시계 · 극야 · 안데스 · 사막의 원인(7 → 12곳) · 영구 동토층(8월 1.3m · 1월 0m · 땅에 붙은 집 기울어짐)", s5 === "true,true,true,true,true,true,true,true,true,true", s5);
  const s52 = await evalApp(`(async () => {
    const out = [], wait = () => new Promise((r) => setTimeout(r, 400));
    const blk = (pre) => { const bl = CHAPTER_CONTENT[app.page.id].blocks, i = bl.findIndex((b) => b.title.indexOf(pre) === 0); return document.querySelector('#page .blk[data-blk="' + (i + 1) + '"]'); };
    let scenes = 0;
    for (const ch of ['5-1', '5-2', '5-3', '5-4', '5-5', '5-6']) {
      goPage(ch);
      let b = null;
      for (let t = 0; t < 30 && !(b && b.querySelector('.sx-spot')); t++) { await wait(); b = blk('경관 탐험'); }
      b.querySelector('.sx-spot[data-i="2"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      if (b.querySelectorAll('.sx-spot').length === 7 && b.querySelector('.sx-spot.on') && b.querySelector('.sx-card b').textContent.startsWith('3.')) scenes++;
      if (ch === '5-1') { blk('시뮬레이터 — 화전').querySelector('.anim-step[data-k="3"]').click(); out.push(document.querySelector('.sw-read').textContent.includes('100')); }
      if (ch === '5-2') { blk('시뮬레이터 — 초원').querySelector('.anim-step[data-k="3"]').click(); out.push(document.querySelector('.nm-read').textContent.includes('겨울 목초지')); }
      if (ch === '5-3') { blk('시뮬레이터 — 세 온대').querySelector('.anim-step[data-k="6"]').click(); out.push(document.querySelector('.fm-read').textContent.includes('장마')); }
      if (ch === '5-4') { blk('시뮬레이터 — 시베리아').querySelector('.anim-step[data-k="4"]').click(); out.push(document.querySelector('.rv-read').textContent.includes('위험')); blk('시뮬레이터 — 시베리아').querySelector('.anim-step[data-k="7"]').click(); out.push(document.querySelector('.rv-read').textContent.includes('강 전체가 흐름')); }
      if (ch === '5-5') { blk('시뮬레이터 — 북극').querySelector('.anim-step[data-k="8"]').click(); out.push(document.querySelector('.ic-read').textContent.includes('4.5백만')); }
      if (ch === '5-6') { const i = document.querySelector('#ht-h'); i.value = 3640; i.dispatchEvent(new Event('input')); out.push(document.querySelector('.ht-read').textContent.includes('88℃') && document.querySelector('.ht-read').textContent.includes('고산병')); }
    }
    return scenes + '|' + out.join();
  })()`);
  check("PART 5 경관 탐험 6개(번호 7곳 · 설명 카드) · 시뮬레이터 2차(화전 · 유목 · 농업 달력 · 봄 홍수 · 바다 얼음 · 고도)", s52 === "6|true,true,true,true,true,true,true", s52);
  const s53 = await evalApp(`(async () => {
    const out = [], wait = () => new Promise((r) => setTimeout(r, 400));
    const blk = async (ch, pre) => { goPage(ch); let b = null; for (let t = 0; t < 30 && !b; t++) { await wait(); const bl = CHAPTER_CONTENT[ch].blocks, i = bl.findIndex((x) => x.title.indexOf(pre) === 0); b = document.querySelector('#page .blk[data-blk="' + (i + 1) + '"]'); if (b && !b.querySelector('input, .p4-seg')) b = null; } return b; };
    const inp = (b, id, v) => { const s = b.querySelector('#' + id); s.value = v; s.dispatchEvent(new Event('input')); };
    let b = await blk('5-1', '시뮬레이터 — 열대 우림'); inp(b, 'pl-y', 2020);
    out.push(b.querySelectorAll('.pl-t.conv').length === 10 && b.querySelector('.pl-read').textContent.includes('40%')); b.querySelector('[data-seg="plk"] .p4-sb[data-i="1"]').click(); out.push(b.querySelector('.pl-read').textContent.includes('30%'));
    b = await blk('5-2', '시뮬레이터 — 건조'); b.querySelector('[data-seg="dm"] .p4-sb[data-i="2"]').click(); b.querySelector('[data-seg="dmu"] .p4-sb[data-i="2"]').click(); inp(b, 'dm-y', 30);
    out.push(b.querySelector('.dm-read').textContent.includes('0%') && b.querySelector('.dm-risk').classList.contains('on')); b.querySelector('[data-seg="dmf"] .p4-sb[data-i="1"]').click(); out.push(!b.querySelector('.dm-read').textContent.includes(' 0%') && b.querySelector('.dm-fix').classList.contains('on'));
    b = await blk('5-3', '시뮬레이터 — 서안'); out.push(b.querySelector('.cw-read').textContent.includes('5.2℃') && b.querySelector('.cw-read').textContent.includes('−2.4℃'));
    b = await blk('5-5', '시뮬레이터 — 백야 현상'); out.push(b.querySelector('.ms-read').textContent.includes('백야'));
    b.querySelector('[data-seg="msd"] .p4-sb[data-i="2"]').click(); out.push(b.querySelector('.ms-read').textContent.includes('극야'));
    b.querySelector('[data-seg="msl"] .p4-sb[data-i="3"]').click(); out.push(b.querySelector('.ms-read').textContent.includes('해가 뜨고 짐'));
    b = await blk('5-6', '시뮬레이터 — 적도'); inp(b, 'hd-h', 4); const night = b.querySelector('.hd-read').textContent;
    out.push(/키토[^이]*두꺼운 겉옷/.test(night) && /이키토스[^두]*반소매/.test(night));
    return out.join();
  })()`);
  check("PART 5 시뮬레이터 3차: 플랜테이션(2020년 숲 40% · 보호 구역 30%) · 센터 피벗 고갈 → 해결 방법 적용 · 런던 5.2℃ vs 서울 −2.4℃ · 트롬쇠 백야 · 12월 극야 · 서울은 뜨고 짐 · 새벽 키토 겉옷", s53 === "true,true,true,true,true,true,true,true,true", s53);
  check("5-x 삽화 6장 불러옴", await evalApp("Promise.all(['tropical','dry','temperate','subarctic','polar','highland'].map((n) => new Promise((r) => { const i = new Image(); i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); i.src = 'assets/lifestyle/' + n + '.png'; }))).then((a) => a.every(Boolean))"));

  console.log("\n④-4 PART 6 정리와 평가");
  await evalApp("goPage('6-1'), true");
  check("6-1: 블록 7장 · 도시 점 " + 103 + "개", await waitFor("document.querySelectorAll('#page .blk').length === 7 && document.querySelectorAll('.blk[data-blk=\"1\"] .wm-city').length === 103", 4000));
  await evalApp("document.querySelector('.blk[data-blk=\"1\"] .wm-city[data-city=\"Tokyo\"] circle').dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 10, clientY: 10 })), true");
  check("도시 점(도쿄) 누르기 → 오른쪽 그래프·정보", await waitFor("document.querySelector('.city-side .cinfo-name').textContent === '도쿄'", 2000));
  await evalApp("document.querySelector('.cmp-set[data-i=\"2\"]').click(), true");
  check("추천 비교(키토 vs 이키토스) → 기호 H · Af · 차이 막대 4줄 · 단서(해발 고도)", await waitFor("[...document.querySelectorAll('.cmp-h em')].map((t) => t.textContent).join() === 'H,Af' && document.querySelectorAll('.dv-r').length === 4 && document.querySelector('.cmp-auto').textContent.includes('해발 고도')", 2000));
  const mt = await evalApp(`(() => {
    const b = document.querySelector('.mt').closest('.blk');
    b.querySelector('.mt-g[data-i="0"]').click();
    const wrong = [...b.querySelectorAll('.mt-nm')].find((n) => n.dataset.i !== '0'); wrong.click();
    const miss = b.querySelector('.mt-score').textContent;
    b.querySelector('.mt-nm[data-i="0"]').click();   // 오답 뒤에도 그래프 선택은 유지
    for (const i of [1, 2, 3]) { b.querySelector('.mt-g[data-i="' + i + '"]').click(); b.querySelector('.mt-nm[data-i="' + i + '"]').click(); }
    return miss + '|' + b.querySelectorAll('.mt-g.ok').length + '|' + b.querySelector('.mt-fb').textContent;
  })()`);
  check("그래프 짝 맞추기: 틀리면 횟수 1 · 네 쌍 완성", /틀린 횟수 1/.test(mt) && /\|4\|완성/.test(mt), mt);
  await evalApp("goPage('6-2'), true");
  await waitFor("document.querySelectorAll('#page .blk').length === 4", 3000);
  await evalApp("document.querySelector('.pick-rand').click(), true");
  check("6-2: 무작위 도시 → 판별판 다시 그림", await waitFor("!!document.querySelector('.judge-host .jb') && document.querySelectorAll('.blk[data-blk=\"1\"] .wm-city.sel').length === 1", 2000));
  const jl = await evalApp(`(() => { document.querySelector('.judge-host .jb-reveal').click(); return document.querySelector('.jlog-t').textContent + '|' + document.querySelectorAll('.jlog-i').length; })()`);
  check("6-2: 판별을 마치면 판별 기록에 쌓임", /1곳/.test(jl) && /\|1$/.test(jl), jl);
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
  const rd10 = await evalApp(`(() => {
    document.querySelector('.cq-mode[data-mode="zone"]').click();
    document.querySelector('.cq-round[data-r="10"]').click();
    for (let k = 0; k < 10; k++) { document.querySelector('.cq-reveal').click(); document.querySelector('.cq-next').click(); }
    const r = document.querySelector('.cq-result');
    const out = !r.hidden + '|' + r.querySelector('.cqr-score').textContent;
    r.querySelector('.cq-again').click();
    return out + '|' + document.querySelector('.cq-result').hidden;
  })()`);
  check("교실 퀴즈 10문제 도전: 끝나면 결과 카드(0 / 10) · 다시 도전", rd10 === "true|0 / 10|true", rd10);
  check("6-3: 단원 마무리 개념 지도 — 상자 13개(누르면 챕터 이동)", await evalApp("document.querySelectorAll('.cm-n[data-go]').length === 13"));
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
