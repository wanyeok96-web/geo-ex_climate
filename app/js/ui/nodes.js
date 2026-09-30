/* ============================================================
   지오엑스-세계의 기후 — ui/nodes.js
   노드형 블록 (공용 부품, PART 2에서 처음 사용 — 파트기획/PART2 4절)
   - 개요 화면: 기본 개념 + 노드 카드
   - 노드를 누르면 같은 블록 안에서 노드 화면으로 전환
     위쪽 노드 막대(⌂ 개요 + 노드 전부) · 소주제 칩(①②③) · 왼쪽 개조식 설명 · 오른쪽 큰 시각 자료
   사용:
     블록 html: Nodes.html("2-1", def) / init: Nodes.init(블록 요소, "2-1", def)
     def = { intro: HTML, groups: [{ label, ids, extra }], nodes: [
               { id, emoji, name, desc, color, topics: [
                   { t: 소주제 이름, pts: [개조식 문장…], terms: [용어…], links: HTML,
                     fig: function () → { html, init(그림 요소) → 정리 함수(선택) } } ] } ] }
     다른 블록에서 노드 열기: Nodes.get("2-2").open(노드 id, 소주제 번호)
   ============================================================ */
"use strict";

const Nodes = (function () {
  const inst = {};
  const NUM = "①②③④⑤⑥";

  function byId(def, id) {
    for (let i = 0; i < def.nodes.length; i++) if (def.nodes[i].id === id) return def.nodes[i];
    return null;
  }

  function card(n) {
    return '<button type="button" class="nd-card" data-nd="' + n.id + '" style="--nc:' + (n.color || "var(--accent)") + '">' +
      '<span class="nd-card-emo" aria-hidden="true">' + n.emoji + '</span>' +
      '<span class="nd-card-name">' + escHtml(n.name) + '</span>' +
      '<span class="nd-card-desc">' + fmtKo(n.desc) + '</span>' +     // 소주제 목록은 노드 화면에서 (선생님 수정, 2026-09-29)
    '</button>';
  }

  function html(key, def) {
    const groups = def.groups || [{ label: "", ids: def.nodes.map(function (n) { return n.id; }) }];
    let cards = "";
    groups.forEach(function (g) {
      cards += '<div class="nd-group">' +
        (g.label ? '<div class="nd-glabel">' + escHtml(g.label) + '</div>' : "") +
        '<div class="nd-cards">' + g.ids.map(function (id) { return card(byId(def, id)); }).join("") + (g.extra || "") + '</div>' +
      '</div>';
    });
    let bar = '<button type="button" class="nd-tab nd-home" data-nd-home>⌂ 개요</button>';
    def.nodes.forEach(function (n) {
      bar += '<button type="button" class="nd-tab" data-nd="' + n.id + '" style="--nc:' + (n.color || "var(--accent)") + '">' +
        '<span class="nd-tab-emo" aria-hidden="true">' + n.emoji + '</span>' + escHtml(n.name) + '</button>';
    });
    return '<div class="nd" data-nodes="' + key + '">' +
      '<div class="nd-hub">' +
        '<div class="nd-intro">' + def.intro + '</div>' +
        '<div class="nd-groups g' + groups.length + '">' + cards + '</div>' +
      '</div>' +
      '<div class="nd-view" hidden>' +
        '<div class="nd-bar" role="tablist" aria-label="노드">' + bar + '</div>' +
        '<div class="nd-topics" role="tablist" aria-label="소주제"></div>' +
        '<div class="nd-stage">' +
          '<div class="nd-text" aria-live="polite"></div>' +
          '<div class="nd-fig"></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function init(el, key, def) {
    const root = el.querySelector('.nd[data-nodes="' + key + '"]');
    const hub = root.querySelector(".nd-hub");
    const view = root.querySelector(".nd-view");
    const topicsEl = root.querySelector(".nd-topics");
    const textEl = root.querySelector(".nd-text");
    const figEl = root.querySelector(".nd-fig");
    let cur = null, cleanup = null;

    function showTopic(n, t) {
      if (cleanup) { try { cleanup(); } catch (e) { /* 무시 */ } cleanup = null; }
      const tp = n.topics[t];
      topicsEl.querySelectorAll(".nd-topic").forEach(function (b, i) {
        b.classList.toggle("on", i === t);
        b.setAttribute("aria-selected", String(i === t));
      });
      textEl.innerHTML =
        '<h4 class="nd-t-title"><span class="nd-t-no">' + NUM[t] + '</span>' + escHtml(tp.t) + '</h4>' +
        '<ul class="nd-pts">' + tp.pts.map(function (s) { return "<li>" + fmtKo(s) + "</li>"; }).join("") + '</ul>' +
        (tp.terms && tp.terms.length ? '<div class="nd-terms"><span class="nd-terms-l">교과 용어</span>' +
          tp.terms.map(function (s) { return '<span class="nd-term">' + escHtml(s) + '</span>'; }).join("") + '</div>' : "") +
        (tp.links ? '<div class="nd-links">' + tp.links + '</div>' : "");
      const f = tp.fig ? tp.fig() : { html: "" };
      figEl.innerHTML = f.html;
      if (f.init) cleanup = f.init(figEl) || null;
    }

    function open(id, t) {
      const n = byId(def, id);
      if (!n) return;
      cur = n;
      hub.hidden = true;
      view.hidden = false;
      root.classList.add("viewing");
      root.style.setProperty("--nc", n.color || "var(--accent)");
      view.querySelectorAll(".nd-tab[data-nd]").forEach(function (b) {
        const on = b.getAttribute("data-nd") === id;
        b.classList.toggle("on", on);
        b.setAttribute("aria-selected", String(on));
      });
      topicsEl.innerHTML = n.topics.map(function (tp, i) {
        return '<button type="button" class="nd-topic" role="tab" data-t="' + i + '"><span class="nd-t-no">' + NUM[i] + '</span>' + escHtml(tp.t) + '</button>';
      }).join("");
      showTopic(n, Math.max(0, Math.min(n.topics.length - 1, t || 0)));
    }

    function home() {
      if (cleanup) { try { cleanup(); } catch (e) { /* 무시 */ } cleanup = null; }
      cur = null;
      figEl.innerHTML = "";
      view.hidden = true;
      hub.hidden = false;
      root.classList.remove("viewing");
    }

    root.addEventListener("click", function (e) {
      if (e.target.closest("[data-nd-home]")) { home(); return; }
      const nb = e.target.closest("[data-nd]");
      if (nb && root.contains(nb) && !e.target.closest(".nd-fig")) { open(nb.getAttribute("data-nd"), 0); return; }
      const tb = e.target.closest(".nd-topic");
      if (tb && cur) showTopic(cur, +tb.getAttribute("data-t"));
    });

    inst[key] = { open: open, home: home };
  }

  function get(key) { return inst[key] || null; }

  return { html: html, init: init, get: get };
})();
