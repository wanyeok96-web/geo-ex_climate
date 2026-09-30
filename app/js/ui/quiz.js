/* ============================================================
   지오엑스-세계의 기후 — ui/quiz.js
   함께 풀기 (공용 부품) — 교사가 스크린 앞에서 진행 (기획서 3-4, PART 1 기획 6절)
   - 교사가 학생 답을 선택지에서 누름 → 맞음·틀림 표시
   - 「정답 보기」 → 정답·해설 공개 (선택지를 누르지 않아도 가능)
   - 「다시 풀기」 → 처음 상태로. 점수·기록 없음
   형식: ox · mcq(객관식) · graphs(그래프 고르기) · sort(분류하기: 문장 카드마다 칸 고르기) · map(지도에서 누르기)
   q.visual(HTML)이 있으면 왼쪽에 자료(그래프 등), 오른쪽에 선택지
   Quiz.html(문제) → 블록 안에 넣고, Quiz.init(블록 요소)로 동작 연결
   ============================================================ */
"use strict";

const Quiz = (function () {
  const MARK_OK = '<span class="qz-mark ok" aria-label="정답">O</span>';
  const MARK_NO = '<span class="qz-mark no" aria-label="오답">X</span>';

  function controls() {
    return '<div class="qz-ctrl">' +
      '<button type="button" class="qz-btn qz-reveal">정답 보기</button>' +
      '<button type="button" class="qz-btn ghost qz-reset">다시 풀기</button>' +
    '</div>';
  }
  function explainBox(q) {
    return '<div class="qz-explain" hidden><span class="qz-tag">해설</span>' + fmtKo(q.explain) + '</div>';
  }

  function html(q) {
    let body = "";
    if (q.type === "ox") {
      body = '<div class="qz-opts ox">' +
        '<button type="button" class="qz-opt" data-v="1"><span class="ox-o">O</span></button>' +
        '<button type="button" class="qz-opt" data-v="0"><span class="ox-x">X</span></button></div>';
    } else if (q.type === "mcq") {
      body = '<div class="qz-opts mcq">' + q.options.map(function (o, i) {
        return '<button type="button" class="qz-opt" data-v="' + i + '"><span class="qz-num">' + "①②③④⑤"[i] + '</span>' + fmtKo(o) + '</button>';
      }).join("") + '</div>';
    } else if (q.type === "graphs") {
      body = '<div class="qz-opts graphs">' + q.options.map(function (o, i) {
        return '<button type="button" class="qz-opt g" data-v="' + i + '"><span class="qz-num">' + "①②③④⑤"[i] + '</span>' + o + '</button>';
      }).join("") + '</div>';
    } else if (q.type === "sort") {
      body = '<div class="qz-sort">' + q.items.map(function (it, i) {
        return '<div class="qz-item" data-i="' + i + '" data-a="' + it.a + '"><span class="qz-it-t">' + fmtKo(it.t) + '</span>' +
          '<span class="qz-bins">' + q.bins.map(function (b, k) {
            return '<button type="button" class="qz-bin" data-k="' + k + '">' + b + '</button>';
          }).join("") + '</span><span class="qz-res"></span></div>';
      }).join("") + '</div>';
    } else if (q.type === "map") {
      body = '<div class="qz-map"></div><div class="qz-pick" aria-live="polite"></div>';
    }
    const foot = '<div class="qz-foot">' + controls() + '<div class="qz-feedback" aria-live="polite"></div></div>' + explainBox(q);
    if (q.visual) {
      return '<div class="qz qz--' + q.type + ' has-visual" data-type="' + q.type + '">' +
        '<p class="qz-q"><span class="qz-tag q">Q</span>' + fmtKo(q.q) + '</p>' +
        '<div class="qz-split"><div class="qz-visual">' + q.visual + '</div><div class="qz-side">' + body + foot + '</div></div>' +
      '</div>';
    }
    return '<div class="qz qz--' + q.type + '" data-type="' + q.type + '">' +
      '<p class="qz-q"><span class="qz-tag q">Q</span>' + fmtKo(q.q) + '</p>' + body + foot +
    '</div>';
  }

  /* 블록 안의 문제 하나에 동작 연결 */
  function init(el, q) {
    const box = el.querySelector(".qz");
    const fb = box.querySelector(".qz-feedback");
    const ex = box.querySelector(".qz-explain");
    let map = null;

    function feedback(ok, text) {
      fb.innerHTML = (ok ? MARK_OK : MARK_NO) + '<span>' + text + '</span>';
      fb.className = "qz-feedback " + (ok ? "ok" : "no");
    }
    function reveal() {
      box.classList.add("revealed");
      ex.hidden = false;
      if (q.type === "ox") box.querySelector('.qz-opt[data-v="' + (q.answer ? 1 : 0) + '"]').classList.add("answer");
      if (q.type === "mcq" || q.type === "graphs") box.querySelector('.qz-opt[data-v="' + q.answer + '"]').classList.add("answer");
      if (q.type === "sort") box.querySelectorAll(".qz-item").forEach(function (it) {
        it.querySelector('.qz-bin[data-k="' + it.getAttribute("data-a") + '"]').classList.add("answer");
      });
      if (q.type === "map" && map) map.highlight(q.zone);
    }
    function reset() {
      box.classList.remove("revealed");
      ex.hidden = true;
      fb.innerHTML = ""; fb.className = "qz-feedback";
      box.querySelectorAll(".picked, .answer, .ok, .no").forEach(function (b) { b.classList.remove("picked", "answer", "ok", "no"); });
      box.querySelectorAll(".qz-res").forEach(function (r) { r.innerHTML = ""; });
      if (map) { map.highlight(null); map.hideTip(); }
      const pk = box.querySelector(".qz-pick");
      if (pk) pk.innerHTML = "";
    }

    if (q.type === "map") {
      map = WorldMap.create(box.querySelector(".qz-map"), {
        view: q.view, legend: false, info: false,
        onPick: function (r, api) {
          const ok = r.zone === q.zone;
          if (!r.zone) { api.showTip("바다 — 육지를 눌러 주세요", r.x, r.y); return; }
          api.showTip('<i style="background:' + ZONES[r.zone].color + '"></i>' + WorldMap.zoneName(r.zone) + " (" + r.zone + ")", r.x, r.y);
          feedback(ok, ok ? "정답 — " + WorldMap.zoneName(r.zone) : "오답 — " + WorldMap.zoneName(r.zone) + " 지역");
        }
      });
    }

    box.addEventListener("click", function (e) {
      if (e.target.closest(".qz-reveal")) { reveal(); return; }
      if (e.target.closest(".qz-reset")) { reset(); return; }
      const opt = e.target.closest(".qz-opt");
      if (opt) {
        box.querySelectorAll(".qz-opt").forEach(function (b) { b.classList.remove("picked", "ok", "no"); });
        const v = +opt.getAttribute("data-v");
        const ok = q.type === "ox" ? (v === 1) === !!q.answer : v === q.answer;
        opt.classList.add("picked", ok ? "ok" : "no");
        feedback(ok, ok ? "정답" : "오답 — 다시 생각해 보기");
        return;
      }
      const bin = e.target.closest(".qz-bin");
      if (bin) {
        const it = bin.closest(".qz-item");
        it.querySelectorAll(".qz-bin").forEach(function (b) { b.classList.remove("picked", "ok", "no"); });
        const ok = bin.getAttribute("data-k") === it.getAttribute("data-a");
        bin.classList.add("picked", ok ? "ok" : "no");
        it.querySelector(".qz-res").innerHTML = ok ? MARK_OK : MARK_NO;
        const all = box.querySelectorAll(".qz-item"), done = box.querySelectorAll(".qz-bin.picked");
        const right = box.querySelectorAll(".qz-bin.picked.ok").length;
        if (done.length === all.length) feedback(right === all.length, all.length + "문장 중 " + right + "문장 정답");
      }
    });
  }

  return { html: html, init: init };
})();
