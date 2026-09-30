/* ============================================================
   지오엑스-세계의 기후 — ui/anim.js
   애니메이션 재생기 (공용 부품) — 교사가 누르며 설명하는 단계형 애니메이션
   - 「▶ 재생 · ⏸ 멈춤 · ↻ 처음부터」 + 단계 점(누르면 그 단계로)
   - 단계가 바뀔 때 onStep(k)를 부름 → 그림 쪽에서 SVG 클래스·속성을 바꿔 움직임을 만듦
     (움직임 자체는 CSS transition / animation — 동작 줄이기 설정이면 CSS가 움직임을 끔)
   - 자동 재생: interval(ms)마다 다음 단계, 마지막 단계에서 멈춤(loop: true면 처음으로)
   사용: Anim.player(담을 요소, { steps: ["공기 상승", "냉각", …], onStep: function (k) {}, interval: 1800, loop: false, start: 0 })
         → { go(k), play(), pause(), reset() }
   ============================================================ */
"use strict";

const Anim = (function () {
  function player(host, opts) {
    const labels = opts.steps || [];
    const n = labels.length;
    const bar = document.createElement("div");
    bar.className = "anim-bar";
    bar.innerHTML =
      '<button type="button" class="anim-btn anim-play" aria-label="재생">▶ 재생</button>' +
      '<button type="button" class="anim-btn anim-reset" aria-label="처음부터">↻</button>' +
      '<div class="anim-steps">' + labels.map(function (t, i) {
        return '<button type="button" class="anim-step" data-k="' + i + '"><i>' + (i + 1) + '</i><span>' + escHtml(t) + '</span></button>';
      }).join("") + '</div>';
    host.appendChild(bar);

    let k = -1, timer = null;
    const playBtn = bar.querySelector(".anim-play");
    function go(i) {
      k = Math.max(0, Math.min(n - 1, i));
      bar.querySelectorAll(".anim-step").forEach(function (b, j) {
        b.classList.toggle("on", j === k);
        b.classList.toggle("done", j < k);
      });
      if (opts.onStep) opts.onStep(k);
    }
    function pause() {
      if (timer) { clearInterval(timer); timer = null; }
      playBtn.textContent = "▶ 재생";
      playBtn.classList.remove("on");
    }
    function play() {
      if (timer) return;
      if (k >= n - 1 && !opts.loop) go(0);
      playBtn.textContent = "⏸ 멈춤";
      playBtn.classList.add("on");
      timer = setInterval(function () {
        if (!host.isConnected) { pause(); return; }          // 다른 챕터로 가면 멈춤
        if (k >= n - 1) { if (opts.loop) go(0); else pause(); return; }
        go(k + 1);
      }, opts.interval || 1800);
    }
    bar.addEventListener("click", function (e) {
      if (e.target.closest(".anim-play")) { if (timer) pause(); else play(); return; }
      if (e.target.closest(".anim-reset")) { pause(); go(0); return; }
      const s = e.target.closest(".anim-step");
      if (s) { pause(); go(+s.getAttribute("data-k")); }
    });
    go(opts.start || 0);
    return { go: go, play: play, pause: pause, reset: function () { pause(); go(0); }, get step() { return k; } };
  }

  /* 계속 흐르는 애니메이션(해류·바람 화살표 등)의 켜기·끄기 버튼 — 요소에 .anim-paused 클래스 */
  function flowToggle(host, target, label) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "anim-btn anim-flow on";
    b.textContent = "⏸ " + (label || "흐름 멈춤");
    b.addEventListener("click", function () {
      const paused = target.classList.toggle("anim-paused");
      b.classList.toggle("on", !paused);
      b.textContent = (paused ? "▶ " : "⏸ ") + (label || (paused ? "흐름 보기" : "흐름 멈춤"));
    });
    host.appendChild(b);
    return b;
  }

  return { player: player, flowToggle: flowToggle };
})();
