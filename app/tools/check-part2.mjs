/* ============================================================
   지오엑스-세계의 기후 — tools/check-part2.mjs  (배포 제외)
   PART 2 점검 — 헤드리스 Chrome으로 file:// index.html을 열어
   ① 2-1·2-2 블록 수 ② 노드 카드 → 노드 화면, 소주제 전부 열어 그림 그려짐 확인
   ③ 그림 안 조작(버튼·슬라이더) ④ 수륙 분포 · 지형 시뮬레이터 ⑤ 함께 풀기 · 종합 · 정리
   ⑥ 화면 캡처(tools/shots-p2/) ⑦ 스크립트 오류
   실행: node tools/check-part2.mjs   (app 폴더에서, Node 22 이상)
   ============================================================ */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const APP = dirname(dirname(fileURLToPath(import.meta.url)));
const SHOTS = join(APP, "tools", "shots-p2");
const PORT = 9342;
const BROWSERS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
];
const exe = BROWSERS.find(existsSync);
if (!exe) { console.error("Chrome/Edge를 찾지 못했습니다."); process.exit(1); }
const FULL = process.argv.includes("--all");      // 모든 소주제를 두 해상도로 캡처

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(tmpdir(), "geoclimate-p2-" + Date.now());
const url = pathToFileURL(join(APP, "index.html")).href + "#2-1";
const proc = spawn(exe, [
  "--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + profile,
  "--no-first-run", "--no-default-browser-check", "--window-size=1920,1080", url
], { stdio: "ignore" });

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok });
  console.log((ok ? "  [통과] " : "  [실패] ") + name + (detail ? "  — " + detail : ""));
}

let ws, seq = 0;
const pending = new Map();
const errors = [];
function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => pending.set(id, { res, rej }));
}
async function ev(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
async function waitFor(expr, ms = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (await ev(expr)) return true; } catch (e) { /* 준비 전 */ }
    await sleep(150);
  }
  return false;
}
async function size(w, h, mobile) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: !!mobile });
  await sleep(250);
}
async function shot(name) {
  await sleep(450);
  const r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(SHOTS, name + ".png"), Buffer.from(r.data, "base64"));
}
const blk = (k) => "document.querySelector('#page .blk[data-blk=\"" + k + "\"]')";
async function toBlock(k) { await ev(blk(k) + ".scrollIntoView(), true"); await sleep(200); }

/* 노드 블록 한 개: 노드마다 소주제 전부 */
async function walkNodes(ch, shotSizes) {
  const nodes = await ev("[...document.querySelectorAll('.nd-hub .nd-card[data-nd]')].map((b) => b.dataset.nd)");
  let okAll = true, detail = [];
  for (const id of nodes) {
    const eCard = errors.length;
    await ev("document.querySelector('.nd-hub .nd-card[data-nd=\"" + id + "\"]') ? document.querySelector('.nd-hub .nd-card[data-nd=\"" + id + "\"]').click() : document.querySelector('.nd-bar .nd-tab[data-nd=\"" + id + "\"]').click(), true");
    const nt = await ev("document.querySelectorAll('.nd-topics .nd-topic').length");
    for (let t = 0; t < nt; t++) {
      const e0 = t === 0 ? eCard : errors.length;
      await ev("document.querySelectorAll('.nd-topics .nd-topic')[" + t + "].click(), true");
      await sleep(120);
      if (errors.length > e0) detail.push("오류 발생: " + ch + " " + id + "#" + (t + 1));
      const st = await ev(`(() => {
        const f = document.querySelector('.nd-fig'); const tx = document.querySelector('.nd-text');
        const svg = f.querySelector('svg'); const r = f.getBoundingClientRect(); const sr = svg ? svg.getBoundingClientRect() : null;
        const over = tx.scrollHeight > tx.clientHeight + 2;
        return { svg: !!svg, fw: Math.round(r.width), fh: Math.round(r.height), sw: sr ? Math.round(sr.width) : 0, sh: sr ? Math.round(sr.height) : 0, li: tx.querySelectorAll('li').length, over };
      })()`);
      const ok = st.svg && st.sw > 150 && st.sh > 100 && st.li >= 2 && errors.length === e0;
      if (!ok) { okAll = false; detail.push(ch + " " + id + "#" + (t + 1) + " " + JSON.stringify(st)); }
      if (st.over) detail.push("설명 넘침: " + ch + " " + id + "#" + (t + 1));
      for (const [sz, w, h] of shotSizes) {
        if (sz !== "cur") await size(w, h);
        await toBlock(1);
        await shot(ch + "-" + id + "-" + (t + 1) + (sz === "cur" ? "" : "-" + sz));
      }
      if (shotSizes.length > 1 || shotSizes[0][0] !== "cur") await size(1920, 1080);
    }
  }
  await ev("document.querySelector('.nd-home').click(), true");
  return { okAll, detail, count: nodes.length };
}

try {
  let target = null;
  for (let i = 0; i < 50 && !target; i++) {
    try {
      const list = await (await fetch("http://127.0.0.1:" + PORT + "/json")).json();
      target = list.find((t) => t.type === "page" && t.url.startsWith("file:"));
    } catch (e) { /* 시작 전 */ }
    if (!target) await sleep(200);
  }
  if (!target) throw new Error("브라우저 페이지를 찾지 못했습니다.");
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return; }
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error") errors.push(m.params.entry.text + " (" + (m.params.entry.url || "") + ")");
  });
  await send("Page.enable"); await send("Log.enable"); await send("Runtime.enable");
  rmSync(SHOTS, { recursive: true, force: true });
  mkdirSync(SHOTS, { recursive: true });
  await size(1920, 1080);

  console.log("대상: " + url);
  console.log("\n① 2-1 기후 요소");
  check("2-1 열림 · 블록 6장(표지 포함) · 노드 카드에 소주제 목록 없음", await waitFor("typeof app === 'object' && app.page && app.page.id === '2-1' && document.querySelectorAll('#page .blk').length === 6 && !document.querySelector('.nd-hub .nd-card[data-nd] .nd-card-go')"));
  check("노드 카드 3개(기온·강수·바람)", await ev("[...document.querySelectorAll('.nd-hub .nd-card')].map((b) => b.dataset.nd).join() === 'temp,prec,wind'"));
  await toBlock(1); await shot("2-1-hub");
  const sizes = FULL ? [["1920", 1920, 1080], ["1366", 1366, 768]] : [["cur"]];
  const r21 = await walkNodes("2-1", sizes);
  check("2-1 노드 3개 × 소주제 전부: 설명·그림 그려짐", r21.okAll, r21.detail.join(" | "));

  console.log("\n② 그림 조작");
  await ev("Nodes.get('2-1').open('temp', 2), true");
  await ev("document.querySelectorAll('.nd-fig .p2-sb')[2].click(), true");
  check("연교차: 울란바토르 선택 → 40.7℃", await ev("document.querySelector('.nd-fig .p2-big.key .p2-big-v').textContent.includes('40.7')"));
  await ev("Nodes.get('2-1').open('temp', 1), document.querySelector('.tmn-ctl .anim-step[data-k=\"7\"]').click(), true");
  check("평균 기온: 8월까지 모으기 → 읽기 표시", await ev("document.querySelector('.tmn-t').textContent.includes('8월')"));
  await ev("Nodes.get('2-1').open('wind', 1), true");
  await ev("document.querySelectorAll('.nd-fig .p2-sb')[0].click(), true");
  check("풍향: 북풍 선택 → 이름 표시", await ev("document.querySelector('.nd-fig .p2-dirname').textContent === '북풍'"));
  await ev("Nodes.get('2-1').open('wind', 0), true");
  await ev("(() => { const a = document.querySelector('#p2-pa'), b = document.querySelector('#p2-pb'); a.value = 1022; a.dispatchEvent(new Event('input')); b.value = 998; b.dispatchEvent(new Event('input')); return true; })()");
  check("기압과 바람: 두 기압 조절 → 기압 차 24hPa · 왼쪽 → 오른쪽", await ev("document.querySelector('.wp-read .p2-big.key .p2-big-v').textContent === '24hPa' && document.querySelector('.wp-read').textContent.includes('왼쪽 → 오른쪽')"));
  await ev("Nodes.get('2-1').open('prec', 0), document.querySelector('.pm-play').click(), true");
  await sleep(1500);
  check("우량계 시뮬레이터: 비가 내리며 강수량 늘어남", await ev("parseFloat(document.querySelector('.pm-read .p2-big.key .p2-big-v').textContent) > 0"));
  await ev("Nodes.get('2-1').open('prec', 2), (() => { const s = document.querySelector('.tr-pick select'); s.value = 'Rome'; s.dispatchEvent(new Event('change')); })(), true");
  check("강수 계절: 로마 → 여름 건조", await ev("document.querySelector('.ps-read').textContent.includes('여름 건조')"));
  await ev("Nodes.get('2-1').open('temp', 2), (() => { const s = document.querySelector('.tr-pick select'); s.value = 'Khabarovsk'; s.dispatchEvent(new Event('change')); })(), true");
  check("연교차 산점도: 다른 도시(하바롭스크) → 42.0℃", await ev("document.querySelector('.tr-read .p2-big.key .p2-big-v').textContent === '42.0℃' && document.querySelectorAll('.tr-dot').length > 90"));
  await ev("Nodes.get('2-1').open('prec', 1), true");
  await ev("document.querySelector('.nd-fig .anim-step[data-k=\"0\"]').click(), true");
  check("비가 내리는 원리: 1단계(공기 상승) → 구름·비 숨김", await ev("document.querySelector('.nd-fig .p2-scene').dataset.st === '0'"));
check("「다음 소주제」 버튼 없음 · 소주제 이름 「의미」", await ev("!document.querySelector('.nd-next') && (Nodes.get('2-1').open('temp', 0), document.querySelector('.nd-topic.on').textContent.includes('의미'))"));
  await ev("Nodes.get('2-1').open('temp', 1), document.querySelector('.tmn-ctl .anim-step[data-k=\"12\"]').click(), true");
  check("평균 기온: 12달 모아 연평균 12.1℃", await ev("document.querySelector('.tmn-t').textContent.includes('연평균 기온 12.1℃')"));
  await ev("Nodes.get('2-1').open('temp', 0), true");
  check("기온의 의미: 하루 기온 — 백엽상 기온 · 지면 온도 읽기", await ev("document.querySelectorAll('.tm-read .p2-big').length === 2"));
  await ev("Nodes.get('2-1').home(), true");

  console.log("\n③ 2-1 함께 풀기 · 정리");
  await toBlock(2);
  await ev(blk(2) + ".querySelector('.qz-opt[data-v=\"2\"]').click(), true");
  check("연교차 문제: 정답(28.1℃)", await ev("/정답/.test(" + blk(2) + ".querySelector('.qz-feedback').textContent) && " + blk(2) + ".querySelector('.qz-opt[data-v=\"2\"]').textContent.includes('28.1')"));
  await ev(blk(3) + ".querySelector('.qz-opt[data-v=\"1\"]').click(), true");
  check("풍향 문제: 정답(북서풍)", await ev("/정답/.test(" + blk(3) + ".querySelector('.qz-feedback').textContent)"));
  await ev(blk(4) + ".querySelector('.qz-opt[data-v=\"2\"]').click(), true");
  check("연교차 그래프 문제: 정답(하바롭스크)", await ev("/정답/.test(" + blk(4) + ".querySelector('.qz-feedback').textContent)"));
  check("2-1 정리: 3칸(기온 · 강수 · 바람)", await ev(blk(5) + ".querySelectorAll('.sum-card').length === 3"));
  for (let k = 2; k <= 5; k++) { await toBlock(k); await shot("2-1-blk" + (k + 1)); }

  console.log("\n④ 2-2 기후 요인");
  await ev("goPage('2-2'), true");
  check("2-2 열림 · 블록 8장(표지 포함)", await waitFor("app.page.id === '2-2' && document.querySelectorAll('#page .blk').length === 8"));
  check("노드 카드 6개 + 대기 대순환 연결 카드", await ev("document.querySelectorAll('.nd-hub .nd-card[data-nd]').length === 6 && !!document.querySelector('.nd-hub .nd-card--link[data-go=\"3-1\"]')"));
  await toBlock(1); await shot("2-2-hub");
  const r22 = await walkNodes("2-2", sizes);
  await ev("Nodes.get('2-2').open('mon', 2), true");
  const mm = await ev(`(() => {
    const r = () => document.querySelector('.mm-read').textContent;
    const a = r();
    const l = document.querySelector('#mm-l'); l.value = -15; l.dispatchEvent(new Event('input'));
    return (a.includes('바다 → 대륙') ? 'S' : '-') + (r().includes('대륙 → 바다') ? 'W' : '-') + (document.querySelector('.mm-col.l').classList.contains('high') ? 'H' : '-');
  })()`);
  check("계절풍 만들기: 여름 바다 → 대륙 · 대륙 −15℃ → 대륙 → 바다 · 대륙 고기압", mm === "SWH", mm);
  await ev("Nodes.get('2-2').open('cur', 3), true");
  check("해류 바다 위의 공기: 난류 · 한류 공기 알갱이 14개씩", await ev("document.querySelectorAll('.ca2.w .ca2-parts circle').length === 14 && document.querySelectorAll('.ca2.c .ca2-parts circle').length === 14"));
  check("2-2 노드 6개 × 소주제 전부: 설명·그림 그려짐", r22.okAll, r22.detail.join(" | "));
  await ev("Nodes.get('2-2').open('cur', 0), true");
  check("해류 지도: 화살표 15개 이상", await ev("document.querySelectorAll('.nd-fig .p2-cur').length >= 15"));
  check("해류 화살표 흐름(점선 애니메이션)", await ev("getComputedStyle(document.querySelector('.nd-fig .ga-l.flow')).animationName === 'p2-flow'"));
  await ev("document.querySelectorAll('.nd-fig .p2-sb')[1].click(), true");
  check("해류 지도: 난류만 보기", await ev("document.querySelectorAll('.nd-fig .p2-cur.cold').length === 0 && document.querySelectorAll('.nd-fig .p2-cur.warm').length > 0"));
  await ev("Nodes.get('2-2').open('am', 0), true");
  await ev("document.querySelectorAll('.nd-fig .p2-mass')[2].dispatchEvent(new MouseEvent('click', { bubbles: true })), true");
  check("기단 누르기 → 북태평양 기단 · 고온 다습 칸 강조", await ev("document.querySelector('.nd-fig .am-t').textContent.includes('북태평양') && document.querySelector('.p2-amtab .cell.on').textContent === '고온 다습'"));
  await ev("Nodes.get('2-2').open('am', 2), true");
  await ev("document.querySelector('.nd-fig .anim-step[data-k=\"2\"]').click(), true");
  check("장마 전선: 8월 → 북쪽으로 이동", await ev("document.querySelector('.nd-fig .p2-baiu-g').style.transform === 'translateY(-11px)' && document.querySelector('.baiu-t').textContent.includes('8월')"));
  await ev("Nodes.get('2-2').open('lat', 0), true");
  await ev("(() => { const i = document.querySelector('.nd-fig input'); i.value = 60; i.dispatchEvent(new Event('input')); return true; })()");
  check("위도 60° → 단위 면적당 에너지 50%", await ev("document.querySelector('.nd-fig .lat-read .p2-big.key .p2-big-v').textContent === '50%'"));
  await toBlock(1); await shot("2-2-lat-1-at60");
  await ev("Nodes.get('2-2').open('lat', 1), (() => { const i = document.querySelector('#p2-lt'); i.value = 60; i.dispatchEvent(new Event('input')); })(), true");
  check("위도대 탐색기: 60° → 평균 연평균 기온 8℃ 미만", await ev("parseFloat(document.querySelector('.lt-read .p2-big:nth-child(2) .p2-big-v').textContent.replace('−', '-')) < 8"), await ev("document.querySelector('.lt-read').textContent"));
  await ev("Nodes.get('2-2').open('land', 1), document.querySelector('.trip-ctl .anim-step[data-k=\"4\"]').click(), true");
  check("서→동 여행: 울란바토르 → 연교차 40.7℃", await ev("document.querySelector('.trip-t').textContent.includes('40.7℃')"));
  await ev("Nodes.get('2-2').open('land', 2), document.querySelectorAll('.nd-fig [data-seg=\"pair\"] .p2-sb')[3].click(), true");
  check("서안·동안: 밴쿠버(서안) 14.6℃ · 퀘벡(동안) 31.7℃", await ev("document.querySelector('.we-read').textContent.includes('14.6℃') && document.querySelector('.we-read').textContent.includes('31.7℃')"));
  await ev("Nodes.get('2-2').open('lat', 2), (() => { const i = document.querySelector('#p2-bud'); i.value = 0; i.dispatchEvent(new Event('input')); })(), true");
  check("에너지 수지: 적도 → 에너지 과잉", await ev("document.querySelector('.bud-read').textContent.includes('에너지 과잉')"));
  await ev("document.querySelector('.nd-zoom').click(), true");
  check("「그림 크게」 → 설명 칸 접힘", await ev("getComputedStyle(document.querySelector('.nd-text')).display === 'none'"));
  await ev("document.querySelector('.nd-zoom').click(), true");
  await ev("Nodes.get('2-2').open('land', 0), true");
  await sleep(1500);
  check("육지와 바다 시뮬레이터: 시간이 흐르며 곡선이 그려짐", await ev("document.querySelector('.hs-l.land').getAttribute('points').split(' ').length > 5"));
  await ev("Nodes.get('2-2').open('ter', 1), true");
  await ev("(() => { const i = document.querySelector('#p2-tsh'); i.value = 97; i.dispatchEvent(new Event('input')); return true; })()");
  check("비 그늘 시뮬레이터: 산을 넘은 공기 → 고온 건조(30℃ 가까이)", await ev("/(2[89]|30)\\.\\d℃/.test(document.querySelector('.tsh-read').textContent) && document.querySelector('.tsh-read').textContent.includes('고온 건조')"));
  await ev("Nodes.get('2-2').open('ter', 0), true");
  await ev("(() => { const i = document.querySelector('.nd-fig input'); i.value = 2800; i.dispatchEvent(new Event('input')); return true; })()");
  check("해발 고도 2,800m → 예상 기온 약 13℃", await ev("/1[2-4]\\.\\d℃/.test(document.querySelector('.nd-fig .alt-read').textContent)"));
  await ev("Nodes.get('2-2').home(), true");

  console.log("\n⑤ 함께 풀기 · 종합 · 정리");
  await toBlock(2);
  await ev("(() => { " + blk(2) + ".querySelectorAll('.qz-item').forEach((x) => x.querySelector('.qz-bin[data-k=\"' + x.dataset.a + '\"]').click()); return true; })()");
  check("분류 문제: 모두 맞게 → 정답", await ev("/4.*4/.test(" + blk(2) + ".querySelector('.qz-feedback').textContent)"), await ev(blk(2) + ".querySelector('.qz-feedback').textContent"));
  await ev(blk(3) + ".querySelector('.qz-opt[data-v=\"1\"]').click(), true");
  check("기단 문제: 정답", await ev("/정답/.test(" + blk(3) + ".querySelector('.qz-feedback').textContent)"));
  await ev(blk(4) + ".querySelector('.qz-opt[data-v=\"0\"]').click(), true");
  check("OX 문제: X 정답", await ev("/정답/.test(" + blk(4) + ".querySelector('.qz-feedback').textContent)"));
  await ev(blk(5) + ".querySelector('.qz-opt[data-v=\"1\"]').click(), true");
  check("해안 사막 문제: 정답(남아메리카 서해안)", await ev("/정답/.test(" + blk(5) + ".querySelector('.qz-feedback').textContent)"));
  check("2-2 정리: 6칸(기후 요인)", await ev(blk(7) + ".querySelectorAll('.sum-card').length === 6"));
  await ev(blk(6) + ".querySelector('.rc-b[data-i=\"2\"]').click(), true");
  check("도시로 읽는 기후 요인: 리마 → 해류 카드", await ev(blk(6) + ".querySelector('.rc-f').dataset.open === 'cur:2'"));
  await ev(blk(6) + ".querySelector('.rc-f').click(), true");
  await sleep(600);
  check("요인 카드 누르기 → 해류 ③ 한류의 영향 열림", await ev("document.querySelector('.nd-tab.on').dataset.nd === 'cur' && document.querySelector('.nd-topic.on').dataset.t === '2'"));
  await ev("Nodes.get('2-2').home(), true");
  for (let k = 2; k <= 7; k++) { await toBlock(k); await shot("2-2-blk" + (k + 1)); }

  console.log("\n⑥ 해상도별 캡처");
  for (const [sz, w, h, mob] of [["1366x768", 1366, 768], ["1024x768", 1024, 768], ["375x812", 375, 812, true]]) {
    await size(w, h, mob);
    for (const ch of ["2-1", "2-2"]) {
      await ev("goPage('" + ch + "'), true"); await sleep(300);
      await toBlock(1); await shot(ch + "-hub-" + sz);
      await ev("Nodes.get('" + ch + "').open('" + (ch === "2-1" ? "temp" : "cur") + "', 1), true");
      await toBlock(1); await shot(ch + "-node-" + sz);
      if (mob) {
        const wide = await ev(`(() => { const W = document.getElementById('page').clientWidth; const out = [];
          document.querySelectorAll('#page .blk[data-blk="1"] *').forEach((e) => { const r = e.getBoundingClientRect(); if (r.width && r.right > W + 1 && !e.closest('svg')) out.push((e.className && e.className.baseVal === undefined ? e.className : e.tagName) + ':' + Math.round(r.right)); });
          return out.slice(0, 6).join(', '); })()`);
        check(ch + " " + sz + ": 가로 넘침 없음", !wide, wide);
      }
    }
  }
  await send("Emulation.clearDeviceMetricsOverride");

  console.log("\n⑦ 스크립트 오류");
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
