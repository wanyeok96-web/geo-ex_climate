/* ============================================================
   지오엑스-세계의 기후 — chapters/part5-sims.js
   PART 5 시뮬레이터 (2026-09-30) — chapters/part5.js 다음에 불러와 「분포」 블록 뒤에 끼워 넣음
   5-1 스콜의 하루 · 5-2 사막의 일교차 · 5-3/5-4 기후 시계 · 5-5 백야와 극야 · 5-6 안데스 토지 이용
   수치 모형(하루 기온 등)은 설명용 예시 값 — 화면에 표시, 월별 값은 data/cities.js 평년값
   ============================================================ */
"use strict";

(function () {
  const C = function (id) { return CITY_BY_ID[id]; };
  const K = P2F.kit;
  const clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  const lerp = function (a, b, t) { return a + (b - a) * t; };
  const r1 = function (v) { return Math.round(v * 10) / 10; };
  const deg = function (v) { return (v < 0 ? "−" : "") + Math.abs(r1(v)).toFixed(1) + "℃"; };
  const degI = function (v) { const r = Math.round(v); return (r < 0 ? "−" : "") + Math.abs(r) + "℃"; };
  const sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
  const MON = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  const hhmm = function (h) { const H = Math.floor(h) % 24, M = Math.round((h % 1) * 60); return H + ":" + (M < 10 ? "0" : "") + M; };
  function big(l, v, s, tone) { return '<div class="p2-big' + (tone ? " " + tone : "") + '"><span class="p2-big-l">' + l + '</span><span class="p2-big-v">' + v + '</span>' + (s ? '<span class="p2-big-s">' + s + '</span>' : "") + '</div>'; }
  function seg(name, items, on) {
    return '<div class="p4-seg" role="group" data-seg="' + name + '">' + items.map(function (it, i) { return '<button type="button" class="p4-sb' + (i === on ? " on" : "") + '" data-i="' + i + '">' + it + '</button>'; }).join("") + '</div>';
  }
  function bindSeg(el, name, fn) {
    el.querySelector('[data-seg="' + name + '"]').addEventListener("click", function (e) {
      const b = e.target.closest(".p4-sb"); if (!b) return;
      this.querySelectorAll(".p4-sb").forEach(function (x) { x.classList.toggle("on", x === b); });
      fn(+b.getAttribute("data-i"));
    });
  }
  function slider(id, label, min, max, step, val) {
    return '<div class="p2-slider"><label for="' + id + '">' + label + '</label><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><span class="p2-sl-v"></span></div>';
  }
  function loop(host, fn) {
    if (REDUCED) return function () {};
    let id = 0, last = performance.now(), on = true;
    (function tick(now) {
      if (!on || !host.isConnected) return;
      fn(Math.min(0.1, (now - last) / 1000)); last = now;
      id = requestAnimationFrame(tick);
    })(last);
    return function () { on = false; cancelAnimationFrame(id); };
  }
  function insertAfter(ch, title, block) {
    const bl = CHAPTER_CONTENT[ch].blocks, i = bl.findIndex(function (b) { return b.title === title; });
    bl.splice(i < 0 ? 2 : i + 1, 0, block);
  }
  /* 시간 조절 줄: 시각 막대 + ▶ 재생 + 속도 */
  function timeCtl(id, label, min, max, val) {
    return '<div class="s5-time">' + slider(id, label, min, max, 0.25, val) +
      '<button type="button" class="anim-btn s5-play">▶ 재생</button>' + seg("spd", ["×½", "×1", "×2"], 1) + '</div>';
  }
  function bindTime(el, sel, min, max, perSec, set, get) {
    const inp = el.querySelector(sel), btn = el.querySelector(".s5-play");
    let run = false, spd = 1;
    function sync() { btn.classList.toggle("on", run); btn.textContent = run ? "⏸ 멈춤" : "▶ 재생"; }
    btn.addEventListener("click", function () { run = !run; sync(); });
    bindSeg(el, "spd", function (i) { spd = [0.5, 1, 2][i]; });
    inp.addEventListener("input", function () { run = false; sync(); set(+inp.value); });
    return loop(inp, function (dt) { if (run) { let v = get() + dt * perSec * spd; if (v > max) v = min; set(v); } });
  }

  /* ==========================================================
     5-1 열대 — 스콜의 하루
     ========================================================== */
  function squallModel(h) {
    const cloud = clamp((h - 9) / 4, 0, 1);                           // 9시부터 적운이 자람
    const storm = h >= 13.5 && h < 16.5 ? Math.min(1, (h - 13.5) / .6, (16.5 - h) / .6) : 0;
    let t = 24.5 + 7.5 * Math.sin(Math.PI * clamp((h - 6) / 14, 0, 1));
    if (h >= 13.5) t -= 6 * Math.min(1, (h - 13.5) / .8) * (h < 17.5 ? 1 : Math.max(0, 1 - (h - 17.5) / 2));
    const rh = clamp(95 - (t - 24) * 5 + storm * 20, 55, 100);
    const st = h < 9 ? "맑음 — 햇볕에 지면이 데워짐" : h < 12 ? "적운 발달 — 데워진 공기가 올라감" : h < 13.5 ? "적란운 — 구름이 높이 솟음" : h < 16.5 ? "스콜 — 짧고 강한 소나기, 천둥 번개" : h < 18.5 ? "비 그침 — 기온 내려감" : "저녁 — 맑게 갬";
    return { cloud: cloud, storm: storm, t: t, rh: rh, st: st, tower: clamp((h - 11) / 2.5, 0, 1) * (h < 17 ? 1 : Math.max(0, 1 - (h - 17) / 1.5)) };
  }
  function squallBlock() {
    const g = 300;
    let rain = "";
    for (let i = 0; i < 26; i++) rain += '<line x1="' + (240 + i * 7) + '" y1="0" x2="' + (234 + i * 7) + '" y2="16" style="animation-delay:' + (-(i * .13) % .7).toFixed(2) + 's"/>';
    const s = K.svgOpen(640, 360, "스콜의 하루", "sq-svg") +
      '<rect class="sq-sky" x="0" y="0" width="640" height="' + g + '"/>' +
      '<g class="sq-sun"><circle r="46" fill="url(#p2g-glow)"/><circle r="22" fill="url(#p2g-sun)"/></g>' +
      '<g class="sq-cu" transform="translate(330 150)">' + K.cloud(0, 0, 1, "p2-cloud") + '</g>' +
      '<g class="sq-cb"><path d="M230 170 Q210 120 250 96 Q260 40 320 38 Q390 30 400 90 Q450 100 430 170 Z"/><path class="anvil" d="M200 60 Q320 10 460 52 Q330 44 200 60 Z"/></g>' +
      '<g class="sq-rain" transform="translate(0 175)">' + rain + '</g>' +
      '<path class="sq-bolt" d="M345 170 L330 215 L346 215 L332 262"/>' +
      '<rect class="p2-grass" x="0" y="' + g + '" width="640" height="60"/>' +
      '<g class="sq-trees">' + [40, 110, 520, 590].map(function (x) { return '<g transform="translate(' + x + ' ' + g + ')"><rect x="-4" y="-40" width="8" height="40" fill="#6d4c2f"/><circle cy="-52" r="26" fill="#2f8f3a"/><circle cx="-16" cy="-40" r="16" fill="#3aa04a"/><circle cx="16" cy="-42" r="18" fill="#2f8f3a"/></g>'; }).join("") + '</g>' +
      '<g class="sq-up">' + [180, 460].map(function (x) { return K.ar(x, 280, x, 190, "p2-arrow up warm", 5); }).join("") + '</g>' +
      '<text class="sq-clock" x="20" y="40"></text>' +
    '</svg>';
    return {
      title: "시뮬레이터 — 스콜의 하루",
      html: timeCtl("s5-sq", "시각", 6, 20, 7) +
        '<div class="p2-row sq-read"></div>' +
        '<div class="s5-main"><div class="p2-figwrap">' + s + '</div>' +
          '<div class="s5-side"><div class="s5-chart sq-ch"></div>' +
          '<ul class="pts sm"><li>아침: 강한 햇볕 → 지면 가열</li><li>한낮: 공기 상승 → 적운 → 적란운</li><li>오후: <b>스콜</b> — 짧고 강한 소나기</li><li>거의 매일 되풀이 → 연강수량 많음</li></ul></div></div>' +
        K.cap("열대 우림 기후의 맑은 날 하루 (예시 모형) — 적도 저압대의 상승 기류가 매일 오후 소나기를 만듦"),
      init: function (el) {
        const svg = el.querySelector(".sq-svg");
        let h = 7;
        const W = 300, H = 170, L = 34, R = 8, T = 12, B = 22;
        const xh = function (x) { return L + (x - 6) / 14 * (W - L - R); }, yt = function (v) { return T + (36 - v) / 16 * (H - T - B); };
        let pl = "", rs = "";
        for (let x = 6; x <= 20.01; x += .25) { const m = squallModel(x); pl += (x === 6 ? "" : " ") + xh(x).toFixed(1) + "," + yt(m.t).toFixed(1); if (m.storm > .3) rs += '<rect x="' + xh(x).toFixed(1) + '" y="' + T + '" width="' + (W - L - R) / 56 + '" height="' + (H - T - B) + '"/>'; }
        el.querySelector(".sq-ch").innerHTML = '<svg class="p2-svg" viewBox="0 0 ' + W + ' ' + H + '"><g class="s5-rainband">' + rs + '</g>' +
          [20, 25, 30, 35].map(function (v) { return '<line class="p2-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + yt(v) + '" y2="' + yt(v) + '"/><text class="p2-ax sm5" x="' + (L - 4) + '" y="' + (yt(v) + 4) + '" text-anchor="end">' + v + '</text>'; }).join("") +
          [6, 9, 12, 15, 18].map(function (x) { return '<text class="p2-ax sm5" x="' + xh(x) + '" y="' + (H - 6) + '" text-anchor="middle">' + x + '시</text>'; }).join("") +
          '<polyline class="s5-tl" points="' + pl + '"/><line class="s5-now" y1="' + T + '" y2="' + (H - B) + '"/><circle class="s5-nd" r="5"/></svg><div class="s5-ct">기온 변화 · 파란 칸 = 스콜</div>';
        function set(v) {
          h = v; el.querySelector("#s5-sq").value = v; el.querySelector(".p2-sl-v").textContent = hhmm(v);
          const m = squallModel(v), k = (v - 6) / 14;
          svg.querySelector(".sq-sun").setAttribute("transform", "translate(" + lerp(40, 600, k).toFixed(1) + " " + (290 - Math.sin(Math.PI * clamp(k, 0, 1)) * 250).toFixed(1) + ")");
          svg.querySelector(".sq-cu").setAttribute("transform", "translate(330 150) scale(" + (0.4 + m.cloud * 1.1).toFixed(2) + ")");
          svg.querySelector(".sq-cu").style.opacity = (m.cloud * (1 - m.tower)).toFixed(2);
          svg.querySelector(".sq-cb").style.opacity = m.tower.toFixed(2);
          svg.querySelector(".sq-cb").style.transform = "scaleY(" + (0.4 + .6 * m.tower).toFixed(2) + ")";
          svg.querySelector(".sq-rain").style.opacity = m.storm.toFixed(2);
          svg.querySelector(".sq-bolt").style.opacity = m.storm > .5 ? 1 : 0;
          svg.querySelector(".sq-up").style.opacity = v > 8.5 && v < 13.5 ? 1 : 0;
          svg.classList.toggle("dark", m.storm > .2);
          svg.classList.toggle("dusk", v > 18.5 || v < 6.5);
          svg.querySelector(".sq-clock").textContent = hhmm(v);
          el.querySelector(".sq-read").innerHTML = big("기온", deg(m.t), "", "warm") + big("상대 습도", Math.round(m.rh) + "%", "", "rain") + big("하늘", m.st.split(" — ")[0], m.st.split(" — ")[1] || "", "key");
          const X = xh(v); el.querySelector(".s5-now").setAttribute("x1", X); el.querySelector(".s5-now").setAttribute("x2", X);
          el.querySelector(".s5-nd").setAttribute("cx", X); el.querySelector(".s5-nd").setAttribute("cy", yt(m.t));
        }
        set(h);
        return bindTime(el, "#s5-sq", 6, 20, 1.2, set, function () { return h; });
      }
    };
  }

  /* ==========================================================
     5-2 건조 — 사막의 일교차
     ========================================================== */
  function dayT(h, mn, mx) { const x = ((h - 5 + 24) % 24); return x <= 10 ? mn + (mx - mn) * (1 - Math.cos(Math.PI * x / 10)) / 2 : mn + (mx - mn) * (1 + Math.cos(Math.PI * (x - 10) / 14)) / 2; }
  const DESERT = [8, 36], FOREST = [23, 31];
  function desertBlock() {
    const s = '<svg class="p2-svg dt-svg" viewBox="0 0 640 330" role="img" aria-label="사막과 열대 우림의 하루">' +
      ["d", "f"].map(function (k, i) {
        const x0 = i * 320;
        return '<g class="dt-pan ' + k + '" transform="translate(' + x0 + ' 0)"><rect class="dt-sky" x="4" y="4" width="312" height="226" rx="14"/>' +
          '<circle class="dt-sun" r="18" fill="url(#p2g-sun)"/><circle class="dt-moon" r="14"/>' +
          (k === "f" ? '<g class="dt-clouds">' + K.cloud(90, 70, .75, "p2-cloud") + K.cloud(220, 56, .9, "p2-cloud") + '</g>' : "") +
          '<g class="dt-in">' + [80, 160, 240].map(function (x) { return K.ar(x, 40, x, 200, "p2-arrow warm", 4); }).join("") + '</g>' +
          '<g class="dt-out">' + [80, 160, 240].map(function (x) { return K.ar(x, 210, x, k === "f" ? 110 : 30, "p2-arrow", 4) + (k === "f" ? K.ar(x + 14, 100, x + 14, 190, "p2-arrow faint", 3) : ""); }).join("") + '</g>' +
          '<rect class="dt-ground ' + k + '" x="4" y="230" width="312" height="60"/>' +
          (k === "d" ? '<path class="dt-dune" d="M4 236 Q80 214 160 234 T316 230 L316 290 L4 290 Z"/>' : '<g>' + [40, 120, 200, 280].map(function (x) { return '<circle cx="' + x + '" cy="222" r="26" fill="#2f8f3a"/>'; }).join("") + '</g>') +
          '<text class="dt-num" x="160" y="276" text-anchor="middle"></text>' +
          '<text class="p2-lbl sm dt-t" x="160" y="312" text-anchor="middle">' + (k === "d" ? "사막 — 구름 · 수증기 적음" : "열대 우림 — 구름 · 수증기 많음") + '</text></g>';
      }).join("") + '</svg>';
    return {
      title: "시뮬레이터 — 사막의 일교차",
      html: timeCtl("s5-dt", "시각", 0, 24, 14) +
        '<div class="p2-row dt-read"></div>' +
        '<div class="s5-main"><div class="p2-figwrap">' + s + '</div><div class="s5-side"><div class="s5-chart dt-ch"></div>' +
          '<ul class="pts sm"><li>낮: 구름이 없어 햇볕이 그대로 → 빨리 뜨거워짐</li><li>밤: 열을 붙잡아 둘 구름·수증기가 없음 → 빨리 식음</li><li>사막의 <b>일교차</b>는 20℃ 안팎까지</li></ul></div></div>' +
        K.cap("같은 날 사막과 열대 우림의 하루 기온 (예시 모형) — 빨간 화살표 = 들어오는 햇볕, 파란 화살표 = 빠져나가는 열"),
      init: function (el) {
        const svg = el.querySelector(".dt-svg");
        let h = 14;
        const W = 300, H = 170, L = 30, R = 8, T = 10, B = 22;
        const xh = function (x) { return L + x / 24 * (W - L - R); }, yt = function (v) { return T + (40 - v) / 36 * (H - T - B); };
        const line = function (r) { let p = ""; for (let x = 0; x <= 24; x += .25) p += xh(x).toFixed(1) + "," + yt(dayT(x, r[0], r[1])).toFixed(1) + " "; return p; };
        el.querySelector(".dt-ch").innerHTML = '<svg class="p2-svg" viewBox="0 0 ' + W + ' ' + H + '">' +
          [10, 20, 30, 40].map(function (v) { return '<line class="p2-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + yt(v) + '" y2="' + yt(v) + '"/><text class="p2-ax sm5" x="' + (L - 4) + '" y="' + (yt(v) + 4) + '" text-anchor="end">' + v + '</text>'; }).join("") +
          [0, 6, 12, 18, 24].map(function (x) { return '<text class="p2-ax sm5" x="' + xh(x) + '" y="' + (H - 6) + '" text-anchor="middle">' + x + '시</text>'; }).join("") +
          '<polyline class="s5-tl d" points="' + line(DESERT) + '"/><polyline class="s5-tl f" points="' + line(FOREST) + '"/><line class="s5-now" y1="' + T + '" y2="' + (H - B) + '"/></svg>' +
          '<div class="s5-ct"><i class="d"></i>사막 <i class="f"></i>열대 우림</div>';
        function set(v) {
          h = v; el.querySelector("#s5-dt").value = v; el.querySelector(".p2-sl-v").textContent = hhmm(v);
          const day = v > 6 && v < 18.5, k = clamp((v - 6) / 12.5, 0, 1);
          svg.classList.toggle("night", !day);
          svg.querySelectorAll(".dt-sun").forEach(function (s) { s.setAttribute("cx", lerp(30, 290, k)); s.setAttribute("cy", 210 - Math.sin(Math.PI * k) * 170); });
          svg.querySelectorAll(".dt-moon").forEach(function (s) { const q = ((v + 6) % 24) / 12; s.setAttribute("cx", lerp(30, 290, clamp(q, 0, 1))); s.setAttribute("cy", 190 - Math.sin(Math.PI * clamp(q, 0, 1)) * 150); });
          const td = dayT(v, DESERT[0], DESERT[1]), tf = dayT(v, FOREST[0], FOREST[1]);
          svg.querySelector(".dt-pan.d .dt-num").textContent = degI(td);
          svg.querySelector(".dt-pan.f .dt-num").textContent = degI(tf);
          svg.querySelectorAll(".dt-ground.d").forEach(function (g) { const k2 = clamp((td - 8) / 28, 0, 1); g.style.fill = "hsl(" + lerp(38, 18, k2).toFixed(0) + "," + lerp(45, 80, k2).toFixed(0) + "%," + lerp(72, 58, k2).toFixed(0) + "%)"; });
          el.querySelector(".dt-read").innerHTML = big("사막", degI(td), "일교차 약 " + (DESERT[1] - DESERT[0]) + "℃", "warm") + big("열대 우림", degI(tf), "일교차 약 " + (FOREST[1] - FOREST[0]) + "℃", "rain") +
            big("지금", day ? "☀️ 낮 — 가열" : "🌙 밤 — 냉각", day ? "사막이 더 빨리 뜨거워짐" : "사막이 더 빨리 식음", "key");
          const X = xh(v); el.querySelector(".s5-now").setAttribute("x1", X); el.querySelector(".s5-now").setAttribute("x2", X);
        }
        set(h);
        return bindTime(el, "#s5-dt", 0, 24, 1.5, set, function () { return h; });
      }
    };
  }

  /* ==========================================================
     5-3 · 5-4 — 기후 시계 (12달 다이얼)
     ========================================================== */
  function clockBlock(ids, zoneNote) {
    function scene(c, m) {
      const t = c.t[m], p = c.p[m], out = [];
      if (t < -10) out.push(["🥶", "혹한 — 두꺼운 외투 · 난방"]);
      else if (t < 0) out.push(["❄️", "영하 — 눈 · 얼음"]);
      else if (t < 10) out.push(["🧥", "쌀쌀함"]);
      else if (t < 22) out.push(["🌤️", "온화함"]);
      else out.push(["☀️", "더움"]);
      if (p >= 150) out.push(["🌧️", "비가 많은 달"]);
      else if (p < 30) out.push(["🏜️", "건조한 달"]);
      if (t < 0 && p < 30) out.push(["🌬️", "차고 건조한 바람"]);
      if (t > 18 && p < 40) out.push(["🫒", "여름 가뭄 — 수목 농업"]);
      if (t > 20 && p >= 150) out.push(["🌾", "고온 다습 — 벼 생육"]);
      if (t < -5) out.push(["🧊", "호수 · 강이 얼어붙음"]);
      return out;
    }
    function dial(c, m) {
      const R0 = 70, R1 = 110, R2 = 190, cx = 210, cy = 210, pm = Math.max(200, Math.max.apply(null, c.p));
      let s = '<svg class="p2-svg ck-svg" viewBox="0 0 420 420" role="img" aria-label="기후 시계">';
      for (let i = 0; i < 12; i++) {
        const a0 = (i / 12 - .25) * Math.PI * 2 + .02, a1 = ((i + 1) / 12 - .25) * Math.PI * 2 - .02, rr = R1 + 8 + c.p[i] / pm * (R2 - R1 - 8);
        const P = function (r, a) { return (cx + r * Math.cos(a)).toFixed(1) + " " + (cy + r * Math.sin(a)).toFixed(1); };
        s += '<path class="ck-p' + (i === m ? " on" : "") + '" d="M' + P(R1 + 6, a0) + ' L' + P(rr, a0) + ' A' + rr + ' ' + rr + ' 0 0 1 ' + P(rr, a1) + ' L' + P(R1 + 6, a1) + ' A' + (R1 + 6) + ' ' + (R1 + 6) + ' 0 0 0 ' + P(R1 + 6, a0) + ' Z"/>';
        s += '<path class="ck-t" style="fill:' + tColor5(c.t[i]) + '" d="M' + P(R0, a0) + ' L' + P(R1, a0) + ' A' + R1 + ' ' + R1 + ' 0 0 1 ' + P(R1, a1) + ' L' + P(R0, a1) + ' A' + R0 + ' ' + R0 + ' 0 0 0 ' + P(R0, a0) + ' Z"/>';
        const am = (a0 + a1) / 2;
        s += '<text class="ck-m' + (i === m ? " on" : "") + '" x="' + (cx + (R2 + 16) * Math.cos(am)).toFixed(1) + '" y="' + (cy + (R2 + 16) * Math.sin(am) + 5).toFixed(1) + '" text-anchor="middle">' + (i + 1) + '</text>';
      }
      const ah = ((m + .5) / 12 - .25) * Math.PI * 2;
      s += '<line class="ck-hand" x1="' + cx + '" y1="' + cy + '" x2="' + (cx + (R2 + 2) * Math.cos(ah)).toFixed(1) + '" y2="' + (cy + (R2 + 2) * Math.sin(ah)).toFixed(1) + '"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R0 - 6) + '" class="ck-c"/>' +
        '<text class="ck-cm" x="' + cx + '" y="' + (cy - 14) + '" text-anchor="middle">' + (m + 1) + '월</text>' +
        '<text class="ck-ct" x="' + cx + '" y="' + (cy + 12) + '" text-anchor="middle">' + degI(c.t[m]) + '</text>' +
        '<text class="ck-cp" x="' + cx + '" y="' + (cy + 34) + '" text-anchor="middle">' + Math.round(c.p[m]) + 'mm</text>';
      return s + '</svg>';
    }
    return {
      title: "시뮬레이터 — 기후 시계",
      html: '<div class="ed-ctl">' + seg("city", ids.map(function (id) { const c = C(id); return escHtml(c.kr) + " <small>" + Koppen.judge(c).code + "</small>"; }), 0) + '</div>' +
        '<div class="ck-play"></div>' +
        '<div class="s5-main ck"><div class="ck-dial"></div><div class="s5-side"><div class="ck-scene"></div><div class="ck-cmp"></div>' +
          '<p class="s5-note">바깥 막대 = 월 강수량 · 안쪽 고리 색 = 월평균 기온(파랑 추움 → 빨강 더움) · ' + zoneNote + '</p></div></div>',
      init: function (el) {
        let ci = 0, m = 0;
        function show() {
          const c = C(ids[ci]);
          el.querySelector(".ck-dial").innerHTML = dial(c, m);
          el.querySelector(".ck-scene").innerHTML = '<div class="ck-h"><b>' + escHtml(c.kr) + '</b> ' + (m + 1) + '월</div>' + scene(c, m).map(function (x) { return '<div class="ck-s"><span>' + x[0] + '</span>' + x[1] + '</div>'; }).join("");
          el.querySelector(".ck-cmp").innerHTML = ids.map(function (id) {
            const d = C(id);
            return '<div class="ck-r' + (id === ids[ci] ? " on" : "") + '"><span>' + escHtml(d.kr) + '</span><b style="color:' + tColor5(d.t[m]) + '">' + degI(d.t[m]) + '</b><em>' + Math.round(d.p[m]) + 'mm</em></div>';
          }).join("");
        }
        bindSeg(el, "city", function (i) { ci = i; show(); });
        const pl = Anim.player(el.querySelector(".ck-play"), { steps: MON, interval: 1400, loop: true, onStep: function (k) { m = k; show(); } });
        return function () { pl.pause(); };
      }
    };
  }
  function tColor5(t) {
    const s = [[-25, [70, 60, 190]], [-10, [60, 110, 220]], [0, [110, 170, 240]], [10, [120, 200, 150]], [20, [245, 190, 70]], [30, [230, 70, 50]]];
    for (let i = 0; i < s.length - 1; i++) if (t <= s[i + 1][0]) { const k = clamp((t - s[i][0]) / (s[i + 1][0] - s[i][0]), 0, 1); return "rgb(" + [0, 1, 2].map(function (j) { return Math.round(lerp(s[i][1][j], s[i + 1][1][j], k)); }).join(",") + ")"; }
    return t < -25 ? "rgb(70,60,190)" : "rgb(230,70,50)";
  }

  /* ==========================================================
     5-5 한대 — 백야와 극야
     ========================================================== */
  const DOY = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349];
  function decl(n) { return 23.44 * Math.sin(2 * Math.PI * (284 + n) / 365) * Math.PI / 180; }
  function dayLen(lat, n) { const f = lat * Math.PI / 180, d = decl(n), x = -Math.tan(f) * Math.tan(d); return x <= -1 ? 24 : x >= 1 ? 0 : 2 * Math.acos(x) * 180 / Math.PI / 15; }
  function alt(lat, n, h) { const f = lat * Math.PI / 180, d = decl(n), ha = (h - 12) * 15 * Math.PI / 180; return Math.asin(Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(ha)) * 180 / Math.PI; }
  const POLAR_PRE = [["적도", 0], ["서울", 37.6], ["배로", 71.3], ["롱위에아르뷔엔", 78.2], ["북극점", 90]];
  function polarBlock() {
    return {
      title: "시뮬레이터 — 백야와 극야",
      html: '<div class="pn-ctl">' + slider("s5-lat", "위도(북위)", 0, 90, 0.1, 71.3) + slider("s5-mon", "날짜", 0, 11, 1, 5) + '</div>' +
        '<div class="ed-ctl">' + seg("pre", POLAR_PRE.map(function (p) { return p[0] + " " + p[1] + "°"; }), 2) + '</div>' +
        '<div class="p2-row pn-read"></div>' +
        '<div class="s5-main pn"><div class="p2-figwrap pn-sky"></div><div class="s5-side"><div class="s5-chart pn-year"></div>' +
          '<ul class="pts sm"><li><b>백야</b>: 여름에 해가 지지 않음 — 북극권(66.5°N) 너머</li><li><b>극야</b>: 겨울에 해가 뜨지 않음</li><li>여름에도 태양 고도가 낮아 받는 에너지가 적음 → 최난월 10℃ 미만</li></ul></div></div>' +
        K.cap("하루 동안의 태양 고도(0° 아래 = 해가 진 시간) · 날짜는 달마다 15일 무렵 · 대기 굴절은 무시한 계산"),
      init: function (el) {
        const li = el.querySelector("#s5-lat"), mi = el.querySelector("#s5-mon");
        function set() {
          const lat = +li.value, m = +mi.value, n = DOY[m], L0 = dayLen(lat, n);
          el.querySelectorAll(".p2-sl-v")[0].textContent = lat.toFixed(1) + "°N";
          el.querySelectorAll(".p2-sl-v")[1].textContent = (m + 1) + "월 15일";
          const W = 640, H = 330, L = 50, R = 16, T = 20, B = 40, lo = -40, hi = 90;
          const x = function (h) { return L + h / 24 * (W - L - R); }, y = function (a) { return T + (hi - a) / (hi - lo) * (H - T - B); };
          let p = "", night = "";
          for (let h = 0; h <= 24.01; h += .1) p += x(h).toFixed(1) + "," + y(alt(lat, n, h)).toFixed(1) + " ";
          let s = '<svg class="p2-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="하루 동안의 태양 고도">' +
            '<rect class="pn-day" x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (y(0) - T) + '"/><rect class="pn-night" x="' + L + '" y="' + y(0) + '" width="' + (W - L - R) + '" height="' + (H - B - y(0)) + '"/>';
          [-30, 0, 30, 60, 90].forEach(function (a) { s += '<line class="p2-grid' + (a === 0 ? " pn-hz" : "") + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(a) + '" y2="' + y(a) + '"/><text class="p2-ax" x="' + (L - 6) + '" y="' + (y(a) + 5) + '" text-anchor="end">' + a + '°</text>'; });
          [0, 6, 12, 18, 24].forEach(function (h) { s += '<text class="p2-ax" x="' + x(h) + '" y="' + (H - B + 22) + '" text-anchor="middle">' + h + '시</text>'; });
          s += '<text class="pn-hzt" x="' + (L + 10) + '" y="' + (y(0) + 22) + '">지평선 — 위 = 낮, 아래 = 밤</text><polyline class="pn-sun" points="' + p + '"/>';
          const noon = alt(lat, n, 12);
          s += '<circle class="pn-noon" cx="' + x(12) + '" cy="' + y(noon) + '" r="12" fill="url(#p2g-sun)"/><text class="pn-nt" x="' + (x(12) + 18) + '" y="' + (y(noon) + 5) + '">정오 ' + Math.round(noon) + '°</text></svg>';
          el.querySelector(".pn-sky").innerHTML = s;
          const state = L0 >= 23.99 ? ["백야", "해가 지지 않음 — 하루 종일 낮", "warm"] : L0 <= 0.01 ? ["극야", "해가 뜨지 않음 — 하루 종일 밤", "cold"] : ["보통", "낮과 밤이 번갈아 나타남", ""];
          el.querySelector(".pn-read").innerHTML = big("낮의 길이", Math.floor(L0) + "시간 " + Math.round((L0 % 1) * 60) + "분", "") + big("정오 태양 고도", Math.round(Math.max(noon, -90)) + "°", noon < 0 ? "지평선 아래" : "") + big("상태", state[0], state[1], state[2] || "key");
          const YW = 300, YH = 170, YL = 30, YR = 8, YT = 10, YB = 22;
          const yx = function (i) { return YL + (i + .5) / 12 * (YW - YL - YR); }, yy = function (v) { return YT + (24 - v) / 24 * (YH - YT - YB); };
          let ys = '<svg class="p2-svg" viewBox="0 0 ' + YW + ' ' + YH + '">' + [0, 12, 24].map(function (v) { return '<line class="p2-grid" x1="' + YL + '" x2="' + (YW - YR) + '" y1="' + yy(v) + '" y2="' + yy(v) + '"/><text class="p2-ax sm5" x="' + (YL - 4) + '" y="' + (yy(v) + 4) + '" text-anchor="end">' + v + '</text>'; }).join("");
          DOY.forEach(function (d, i) { const v = dayLen(lat, d), bw = (YW - YL - YR) / 12 * .7; ys += '<rect class="pn-b' + (i === m ? " on" : "") + (v >= 23.99 ? " w" : v <= .01 ? " p" : "") + '" x="' + (yx(i) - bw / 2).toFixed(1) + '" y="' + Math.min(yy(v), yy(0) - 4).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(4, yy(0) - yy(v)).toFixed(1) + '" rx="2"/><text class="p2-ax sm5" x="' + yx(i) + '" y="' + (YH - 6) + '" text-anchor="middle">' + (i + 1) + '</text>'; });
          el.querySelector(".pn-year").innerHTML = ys + '</svg><div class="s5-ct">달마다 낮의 길이(시간) · 노랑 = 백야 · 남색 = 극야</div>';
        }
        li.addEventListener("input", function () { el.querySelectorAll('[data-seg="pre"] .p4-sb').forEach(function (b) { b.classList.remove("on"); }); set(); });
        mi.addEventListener("input", set);
        bindSeg(el, "pre", function (i) { li.value = POLAR_PRE[i][1]; set(); });
        set();
      }
    };
  }

  /* ==========================================================
     5-6 고산 — 안데스 토지 이용
     ========================================================== */
  const ANDES = [
    [0, 1000, "열대 저지", "🍌🍫", "바나나 · 카카오 · 열대 과일", "#2f8f3a"],
    [1000, 2000, "온난한 산지", "☕🌿", "커피 · 사탕수수", "#58a55a"],
    [2000, 3200, "서늘한 고원", "🌽🏙️", "옥수수 · 밀 — 고산 도시(보고타 · 키토)", "#a4c46a"],
    [3200, 4100, "추운 고원", "🥔", "감자 · 보리 · 퀴노아 (계단식 경작)", "#cdb96d"],
    [4100, 4800, "고산 초원(푸나)", "🦙", "라마 · 알파카 방목", "#b8a488"],
    [4800, 6400, "만년설", "🏔️", "눈과 얼음 — 경작 불가", "#f2f6fb"]
  ];
  function andesBlock() {
    const g = 330, top = 40, maxH = 6000;
    const yOf = function (h) { return g - h / maxH * (g - top); };
    const xL = function (h) { return 60 + h / maxH * 260; };
    const mtn = "40," + g + " 320," + top + " 600," + g;
    const s = K.svgOpen(660, 370, "안데스의 고도별 토지 이용", "an-svg") +
      '<rect class="p2-sky" x="0" y="0" width="660" height="' + g + '"/>' +
      '<clipPath id="an-clip"><polygon points="' + mtn + '"/></clipPath><g clip-path="url(#an-clip)">' +
        ANDES.map(function (b, i) { return '<rect class="an-band" data-i="' + i + '" x="0" y="' + yOf(Math.min(b[1], maxH)) + '" width="660" height="' + (yOf(b[0]) - yOf(Math.min(b[1], maxH))) + '" fill="' + b[5] + '"/>'; }).join("") + '</g>' +
      '<polygon class="ta-mtn" points="' + mtn + '"/>' +
      ANDES.map(function (b, i) { const ym = yOf((b[0] + Math.min(b[1], maxH)) / 2); return '<text class="an-emo" data-i="' + i + '" x="' + (320 + (g - ym) * 0.55 + 70) + '" y="' + (ym + 8) + '">' + b[3] + '</text>'; }).join("") +
      [0, 1000, 2000, 3000, 4000, 5000, 6000].map(function (h) { return '<text class="p2-ax" x="636" y="' + (yOf(h) + 5) + '" text-anchor="end">' + h.toLocaleString("ko-KR") + '</text>'; }).join("") +
      '<rect class="p2-ground" x="0" y="' + g + '" width="660" height="40"/>' +
      '<g class="ta-hiker"><circle r="11"/></g>' +
    '</svg>';
    return {
      title: "시뮬레이터 — 안데스 토지 이용",
      html: slider("s5-alt", "해발 고도", 0, maxH, 50, 2850) + '<div class="an-play"></div>' +
        '<div class="p2-row an-read"></div>' +
        '<div class="s5-main"><div class="p2-figwrap">' + s + '</div><div class="s5-side an-list">' +
          ANDES.map(function (b, i) { return '<div class="an-r" data-i="' + i + '" style="--ac:' + b[5] + '"><span class="an-e">' + b[3] + '</span><span><b>' + b[2] + '</b><small>' + b[0].toLocaleString("ko-KR") + "~" + (b[1] > maxH ? "" : b[1].toLocaleString("ko-KR")) + 'm · ' + b[4] + '</small></span></div>'; }).join("") + '</div></div>' +
        K.cap("적도 부근 안데스의 고도별 토지 이용 (대략적인 범위) · 예상 기온 = 해발 약 100m 연평균 26.5℃에서 100m마다 약 0.5℃ 하강"),
      init: function (el) {
        const inp = el.querySelector("#s5-alt"), svg = el.querySelector(".an-svg");
        let cur = 2850, stop = function () {};
        function zone(h) { for (let i = 0; i < ANDES.length; i++) if (h < ANDES[i][1]) return i; return ANDES.length - 1; }
        function set(h) {
          cur = h; inp.value = h;
          const zi = zone(h), b = ANDES[zi], t = 26.5 - (h - 100) / 100 * 0.5;
          el.querySelector(".p2-sl-v").textContent = Math.round(h).toLocaleString("ko-KR") + "m";
          svg.querySelector(".ta-hiker").setAttribute("transform", "translate(" + xL(h).toFixed(1) + " " + yOf(h).toFixed(1) + ")");
          svg.querySelectorAll(".an-band, .an-emo").forEach(function (x) { x.classList.toggle("on", +x.dataset.i === zi); });
          el.querySelectorAll(".an-r").forEach(function (x) { x.classList.toggle("on", +x.dataset.i === zi); });
          el.querySelector(".an-read").innerHTML = big("해발 고도", Math.round(h).toLocaleString("ko-KR") + "m", "") + big("예상 연평균 기온", deg(t), "", t < 10 ? "cold" : "warm") + big(b[2], b[3], b[4], "key");
        }
        inp.addEventListener("input", function () { stop(); pl.pause(); set(+inp.value); });
        const HS = [300, 1500, 2800, 3700, 4400, 5200];
        const pl = Anim.player(el.querySelector(".an-play"), { steps: ANDES.map(function (b) { return b[2]; }), interval: 2200, start: 2, onStep: function (k) { stop(); stop = K.tween(cur, HS[k], 900, function (v) { set(Math.round(v / 10) * 10); }); } });
        set(2850);
        return function () { stop(); pl.pause(); };
      }
    };
  }

  /* ---------- 끼워 넣기 (각 챕터 「분포」 다음) ---------- */
  insertAfter("5-1", "분포", squallBlock());
  insertAfter("5-2", "분포", desertBlock());
  insertAfter("5-3", "분포", clockBlock(["Tokyo", "London", "Rome", "Seoul"], "온대: 겨울이 비교적 온화, 강수 계절이 도시마다 다름"));
  insertAfter("5-4", "분포", clockBlock(["Moscow", "Harbin", "Helsinki", "Chicago"], "냉대: 겨울이 길고 매우 추움, 연교차 큼"));
  insertAfter("5-5", "분포", polarBlock());
  insertAfter("5-6", "분포", andesBlock());

  /* ==========================================================
     2차 (2026-09-30) — 5-2 사막은 어디에 생길까 · 5-4 영구 동토층 단면
     ========================================================== */
  const CAUSE = [
    { k: "hp", n: "아열대 고압대", c: "#e6a700", d: "위도 20°~30° 부근 하강 기류 → 구름이 생기기 어려움" },
    { k: "in", n: "대륙 내부", c: "#b07a3c", d: "바다에서 멀어 수증기가 닿지 않음" },
    { k: "cc", n: "한류 연안", c: "#2878d8", d: "차가운 바다 위 공기가 안정 → 비 적음" },
    { k: "rs", n: "비 그늘", c: "#8a5cc8", d: "산맥이 습한 바람을 막음 → 산 뒤쪽 건조" }
  ];
  const DESERTS = [
    ["사하라", 12, 23, ["hp"], "t"], ["아라비아", 47, 22, ["hp"], "r"], ["오스트레일리아", 130, -25, ["hp"], "b"], ["칼라하리", 23, -24, ["hp"], "r"],
    ["아타카마", -70, -23, ["cc", "hp"], "r"], ["나미브", 14, -20, ["cc", "hp"], "t"], ["소노라 · 모하비", -113, 31, ["hp", "cc"], "r"],
    ["타클라마칸", 83, 39, ["in", "rs"], "t"], ["고비", 104, 43, ["in"], "r"], ["카라쿰 · 키질쿰", 61, 41, ["in"], "t"],
    ["파타고니아", -69, -45, ["rs"], "r"], ["그레이트베이슨", -116, 40, ["rs"], "t"]
  ];
  function desertCauseBlock() {
    return {
      title: "시뮬레이터 — 사막은 어디에 생길까",
      html: '<div class="dc-keys">' + CAUSE.map(function (c) { return '<button type="button" class="dc-k" data-k="' + c.k + '" style="--cc:' + c.c + '"><i></i><b>' + c.n + '</b><small>' + c.d + '</small></button>'; }).join("") + '</div>' +
        '<div class="dc-main"><div class="p2-mapbox dc-map" data-map="dc"></div><div class="s5-side dc-side"></div></div>' +
        K.cap("노란 바탕 = 건조 기후(B) 분포 · 원인 버튼을 켜면 그 원인이 작용하는 곳과 해당 사막이 강조 · 여러 원인이 겹치는 사막도 있음"),
      init: function (el) {
        const on = {};
        const m = K.makeMap(el.querySelector('[data-map="dc"]'), { legend: false, info: false, focus: "B", view: [-180, 62, 180, -58], latLines: true }, draw);
        m.highlight && m.highlight("B");
        function draw(u) {
          let s = "";
          const small = u > 3;                            // 좁은 화면: 지도 글자는 빼고 옆 목록으로 읽기
          const T = function (lon, lat, t, cls, a, z) { return small ? "" : K.geoText(lon, lat, t, u, cls, a, z); };
          if (on.hp) s += [[15, 35], [-35, -15]].map(function (b) { return '<rect class="dc-hp" x="-180" y="' + (-b[1]) + '" width="360" height="' + (b[1] - b[0]) + '"/>'; }).join("") +
            T(-176, 18, "아열대 고압대", "dc-t hp", "start", 3.4) + T(-176, -22, "아열대 고압대", "dc-t hp", "start", 3.4);
          if (on.in) s += [[62, 43, 14, 8], [86, 40, 9, 5], [104, 44, 11, 5]].map(function (e) { return '<ellipse class="dc-in" cx="' + e[0] + '" cy="' + (-e[1]) + '" rx="' + e[2] + '" ry="' + e[3] + '"/>'; }).join("") +
            T(86, 53, "바다에서 먼 대륙 내부", "dc-t in", "middle", 3.4);
          if (on.cc) s += small ? K.currentsSvg(u, "c").replace(/<text[^>]*>[^<]*<\/text>/g, "") : K.currentsSvg(u, "c", null, 3);
          if (on.rs) s += [[[-73, -36], [-72, -44], [-73, -52]], [[-121, 44], [-119, 38], [-117, 34]], [[74, 35], [84, 29], [95, 28]]].map(function (P) {
            return '<path class="dc-mtn" d="M' + P.map(function (p) { return p[0] + " " + (-p[1]); }).join("L") + '" stroke-width="' + (1.4 * u).toFixed(2) + '"/>';
          }).join("") + T(-100, -50, "안데스 → 파타고니아", "dc-t rs", "middle", 3.2) + T(-128, 49, "시에라네바다 → 그레이트베이슨", "dc-t rs", "middle", 3.2) +
            T(84, 24, "히말라야 · 티베트", "dc-t rs", "middle", 3.2);
          const any = Object.keys(on).some(function (k) { return on[k]; });
          s += DESERTS.map(function (d) {
            const hit = d[3].some(function (k) { return on[k]; });
            return '<g class="dc-d' + (hit ? " hit" : any ? " dim" : "") + '"><circle cx="' + d[1] + '" cy="' + (-d[2]) + '" r="' + ((hit ? 1.9 : 1.3) * u).toFixed(2) + '" stroke-width="' + (0.5 * u).toFixed(2) + '"/>' +
              (!small && (hit || !any) ? (function () { const P = { t: [0, 2.3, "middle"], b: [0, -4.3, "middle"], l: [-2.6, -1, "end"], r: [2.6, -1, "start"] }[d[4]]; return K.geoText(d[1] + P[0] * u, d[2] + P[1] * u, d[0], u, "dc-dt", P[2], hit ? 3.4 : 2.8); })() : "") + '</g>';
          }).join("");
          return s;
        }
        function side() {
          const act = CAUSE.filter(function (c) { return on[c.k]; });
          const list = DESERTS.filter(function (d) { return d[3].some(function (k) { return on[k]; }); });
          el.querySelector(".dc-side").innerHTML = act.length
            ? '<div class="dc-h">켠 원인 ' + act.length + '개 · 설명되는 사막 <b>' + list.length + '</b>/' + DESERTS.length + '</div>' +
              list.map(function (d) { return '<div class="dc-r"><b>' + d[0] + '</b><span>' + d[3].map(function (k) { const c = CAUSE.filter(function (x) { return x.k === k; })[0]; return '<i style="--cc:' + c.c + '">' + c.n + '</i>'; }).join("") + '</span></div>'; }).join("")
            : '<div class="dc-h">원인 버튼을 눌러 켜기</div><ul class="pts sm"><li>건조 기후는 위도 20°~30° 부근에 가장 넓음</li><li>그 밖에 대륙 내부 · 한류 연안 · 비 그늘에도 나타남</li><li>네 원인을 모두 켜면 → 사막 ' + DESERTS.length + '곳이 모두 설명됨</li></ul>';
        }
        el.querySelector(".dc-keys").addEventListener("click", function (e) {
          const b = e.target.closest(".dc-k"); if (!b) return;
          on[b.dataset.k] = !on[b.dataset.k]; b.classList.toggle("on", on[b.dataset.k]);
          m.draw(draw); side();
        });
        side();
      }
    };
  }

  /* 5-4 영구 동토층 단면 — 달마다 녹는 층(활동층)의 깊이, 건물 바닥 띄우기 */
  const YAK = [-38.6, -33.8, -20.1, -4.8, 7.5, 16.4, 19.5, 15.2, 6.1, -7.8, -27, -37.6];   // 야쿠츠크 부근 월평균 기온 (근사값)
  function permaState(m, house) {
    let tdd = 0, fdd = 0, thaw = 0;
    for (let i = 3; i <= m; i++) if (YAK[i] > 0) tdd += YAK[i] * 30;
    for (let i = 3; i <= m; i++) if (YAK[i] < 0 && i > 5) fdd += -YAK[i] * 30;
    const k = house === 1 ? 0.047 : 0.03;                       // 바닥이 땅에 붙은 집: 건물의 열로 더 깊이 녹음
    thaw = k * Math.sqrt(tdd);
    const refr = m > 5 ? Math.min(thaw, 0.035 * Math.sqrt(fdd)) : 0;
    return { thaw: thaw, refr: refr, t: YAK[m] };
  }
  function permafrostBlock() {
    const W = 640, H = 360, g = 130, sc = 70;                  // 1m = 70px
    const s = K.svgOpen(W, H, "영구 동토층 단면", "pf-svg") +
      '<rect class="p2-sky pf-sky" x="0" y="0" width="' + W + '" height="' + g + '"/>' +
      '<rect class="pf-perma" x="0" y="' + g + '" width="' + W + '" height="' + (H - g) + '"/>' +
      '<rect class="pf-thaw" x="0" y="' + g + '" width="' + W + '" height="0"/><rect class="pf-refr" x="0" y="' + g + '" width="' + W + '" height="0"/>' +
      '<rect class="pf-thaw2" x="392" y="' + g + '" width="176" height="0"/>' +
      '<g class="pf-snow"><rect x="0" y="' + (g - 10) + '" width="' + W + '" height="10"/></g>' +
      '<g class="pf-grass">' + [90, 140, 200, 300, 340].map(function (x) { return '<path d="M' + x + ' ' + g + ' l4 -12 l4 12 l4 -9 l4 9"/>'; }).join("") + '</g>' +
      '<g class="pf-trees">' + [50, 150, 250].map(function (x) { return '<g transform="translate(' + x + ' ' + g + ')"><rect x="-3" y="-30" width="6" height="30" fill="#6d4c2f"/><polygon points="0,-78 -16,-30 16,-30" fill="#2d6b3c"/><polygon points="0,-92 -11,-58 11,-58" fill="#357a45"/></g>'; }).join("") + '</g>' +
      '<g class="pf-house"></g>' +
      [0, 1, 2, 3].map(function (d) { return '<line class="pf-tick" x1="0" x2="16" y1="' + (g + d * sc) + '" y2="' + (g + d * sc) + '"/><text class="p2-ax" x="20" y="' + (g + d * sc + (d ? 5 : 20)) + '">' + d + 'm</text>'; }).join("") +
      '<text class="pf-lb th" x="620" y="' + (g + 22) + '" text-anchor="end">활동층 — 여름에 녹는 층</text><text class="pf-lb pm" x="620" y="' + (H - 16) + '" text-anchor="end">영구 동토층 — 일 년 내내 얼어 있음</text>' +
    '</svg>';
    return {
      title: "시뮬레이터 — 영구 동토층",
      html: '<div class="av-ctl"><div class="pf-play"></div><div class="ed-grp"><span>건물</span>' + seg("house", ["🏠 바닥을 띄운 집(고상 가옥)", "🏚️ 땅에 붙은 집"], 0) + '</div></div>' +
        '<div class="p2-row pf-read"></div>' +
        '<div class="p2-figwrap">' + s + '</div>' +
        K.cap("동부 시베리아(야쿠츠크 부근) 월평균 기온 근사값으로 만든 예시 모형 — 녹는 깊이는 영상 기온이 쌓일수록 깊어짐 · 땅에 붙은 집은 건물의 열이 땅을 녹여 기울어짐"),
      init: function (el) {
        const svg = el.querySelector(".pf-svg");
        let m = 7, house = 0;
        function set() {
          const st = permaState(m, 0), sh = permaState(m, 1);
          svg.querySelector(".pf-thaw").setAttribute("height", (st.thaw * sc).toFixed(1));
          svg.querySelector(".pf-refr").setAttribute("height", (st.refr * sc).toFixed(1));
          svg.querySelector(".pf-thaw2").setAttribute("height", house === 1 ? (sh.thaw * sc).toFixed(1) : 0);
          const cold = st.t < 0;
          svg.classList.toggle("winter", cold);
          const sink = house === 1 ? Math.max(0, (m >= 3 && m <= 7 ? sh.thaw : permaState(8, 1).thaw) - 0.6) * 18 : 0;   // 한 번 내려앉은 땅은 겨울에도 그대로
          svg.querySelector(".pf-house").innerHTML = house === 0
            ? '<g transform="translate(480 ' + g + ')"><rect x="-70" y="-34" width="10" height="34" fill="#6d4c2f"/><rect x="60" y="-34" width="10" height="34" fill="#6d4c2f"/><rect x="-5" y="-34" width="10" height="34" fill="#6d4c2f"/>' +
              '<rect x="-80" y="-94" width="160" height="60" fill="#c9b08a" stroke="#6d4c2f" stroke-width="3"/><polygon points="-90,-94 0,-134 90,-94" fill="#8b5a3c"/><text x="0" y="-146" text-anchor="middle" class="pf-ht">바닥과 땅 사이 공간 → 찬 공기가 통함</text></g>'
            : '<g transform="translate(480 ' + (g + sink * .5) + ') rotate(' + (sink * .35).toFixed(1) + ')"><rect x="-80" y="-60" width="160" height="60" fill="#c9b08a" stroke="#6d4c2f" stroke-width="3"/><polygon points="-90,-60 0,-100 90,-60" fill="#8b5a3c"/></g>' +
              (sink > 2 ? '<text x="480" y="' + (g + 70) + '" text-anchor="middle" class="pf-ht warn">땅이 녹아 내려앉음 → 건물 기울어짐</text>' : "");
          el.querySelector(".pf-read").innerHTML = K.big(K.MON[m] + " 기온", deg(st.t), cold ? "땅 표면이 다시 얼어붙음" : "땅 표면이 녹음", cold ? "cold" : "warm") +
            K.big("녹은 층 깊이", (Math.max(0, st.thaw - st.refr)).toFixed(1) + "m", "여름 최대 약 " + permaState(8, 0).thaw.toFixed(1) + "m", "key") +
            K.big("그 아래", "영구 동토층", "일 년 내내 0℃ 이하") + (house === 1 ? K.big("건물 아래", sh.thaw.toFixed(1) + "m까지 녹음", "", "warm") : "");
        }
        bindSeg(el, "house", function (i) { house = i; set(); });
        const pl = K.player(el, ".pf-play", K.MON, function (k) { m = k; set(); }, { interval: 1300, start: 7 });
        return function () { pl.pause(); };
      }
    };
  }
  insertAfter("5-2", "시뮬레이터 — 사막의 일교차", desertCauseBlock());
  insertAfter("5-4", "시뮬레이터 — 기후 시계", permafrostBlock());
})();
