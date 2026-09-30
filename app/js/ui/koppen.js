/* ============================================================
   지오엑스-세계의 기후 — ui/koppen.js
   쾨펜 기후 판별 (교과서 기준, PART 4·5·6 공용)
   1차  ① 최난월 < 10℃ → E (한대)   ② 연강수량 < 500mm → B (건조)
        ③ 최한월 ≥ 18℃ → A (열대)   ④ 최한월 > −3℃ → C (온대) / 그 밖 → D (냉대)
   2차  A: f 최소우월 ≥ 60mm · m 최소우월 ≥ 100 − 연강수량/25 · w 그 밖(건기 뚜렷)
        B: W 연강수량 < 250mm · S 250~500mm
        C·D: s 여름 건조(여름 반년 최소우월 < 40mm, 겨울 반년 최다우월 ≥ 여름 최소우월 × 3)
             w 겨울 건조(여름 반년 최다우월 ≥ 겨울 반년 최소우월 × 10) · f 연중 습윤
        E: T 최난월 0~10℃ · F 최난월 < 0℃
   3차  Cf만: a 최난월 ≥ 22℃ · b 최난월 < 22℃   (교과서 13유형: Cfa · Cfb · Cs · Cw, D는 Df · Dw)
   여름 반년: 북반구 4~9월, 남반구 10~3월
   ============================================================ */
"use strict";

const Koppen = (function () {
  const NAMES = {
    Af: "열대 우림 기후", Am: "열대 몬순 기후", Aw: "사바나 기후",
    BW: "사막 기후", BS: "스텝 기후",
    Cfa: "온난 습윤 기후", Cfb: "서안 해양성 기후", Cs: "지중해성 기후", Cw: "온대 겨울 건조 기후",
    Df: "냉대 습윤 기후", Dw: "냉대 겨울 건조 기후", Ds: "냉대 여름 건조 기후",
    ET: "툰드라 기후", EF: "빙설 기후", H: "고산 기후"
  };
  const ZONE_OF = function (code) { return code.charAt(0); };
  const sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
  const r1 = function (v) { return Math.round(v * 10) / 10; };
  const deg = function (v) { return (v < 0 ? "−" + r1(-v) : r1(v)) + "℃"; };
  const mm = function (v) { return Math.round(v).toLocaleString("ko-KR") + "mm"; };

  function seasons(city) {
    const s = city.lat >= 0 ? [3, 4, 5, 6, 7, 8] : [9, 10, 11, 0, 1, 2];
    const w = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(function (m) { return s.indexOf(m) < 0; });
    return { summer: s, winter: w };
  }
  function pick(a, idx, fn) {
    let best = idx[0];
    idx.forEach(function (m) { if (fn(a[m], a[best])) best = m; });
    return best;
  }

  /* 판별: { code, zone, name, steps: [{ lv, q, v, ans, letter }], stats } */
  function judge(city) {
    const t = city.t, p = city.p;
    const tmax = Math.max.apply(null, t), tmin = Math.min.apply(null, t);
    const pAnn = sum(p), pmin = Math.min.apply(null, p);
    const iMax = t.indexOf(tmax), iMin = t.indexOf(tmin);
    const S = seasons(city);
    const sMin = pick(p, S.summer, function (a, b) { return a < b; }), sMax = pick(p, S.summer, function (a, b) { return a > b; });
    const wMin = pick(p, S.winter, function (a, b) { return a < b; }), wMax = pick(p, S.winter, function (a, b) { return a > b; });
    const stats = { tmax: tmax, tmin: tmin, iMax: iMax, iMin: iMin, range: tmax - tmin, pAnn: pAnn, pmin: pmin,
      iPmin: p.indexOf(pmin), iPmax: p.indexOf(Math.max.apply(null, p)), sMin: sMin, sMax: sMax, wMin: wMin, wMax: wMax, south: city.lat < 0 };
    const steps = [];
    let code;

    /* 1차 */
    if (tmax < 10) {
      steps.push({ lv: 1, q: "최난월 평균 기온 10℃ 미만?", v: "최난월 " + deg(tmax), ans: true, letter: "E" });
    } else {
      steps.push({ lv: 1, q: "최난월 평균 기온 10℃ 미만?", v: "최난월 " + deg(tmax), ans: false });
      if (pAnn < 500) steps.push({ lv: 1, q: "연강수량 500mm 미만?", v: "연강수량 " + mm(pAnn), ans: true, letter: "B" });
      else {
        steps.push({ lv: 1, q: "연강수량 500mm 미만?", v: "연강수량 " + mm(pAnn), ans: false });
        if (tmin >= 18) steps.push({ lv: 1, q: "최한월 평균 기온 18℃ 이상?", v: "최한월 " + deg(tmin), ans: true, letter: "A" });
        else {
          steps.push({ lv: 1, q: "최한월 평균 기온 18℃ 이상?", v: "최한월 " + deg(tmin), ans: false });
          steps.push({ lv: 1, q: "최한월 평균 기온 −3℃ 초과?", v: "최한월 " + deg(tmin), ans: tmin > -3, letter: tmin > -3 ? "C" : "D" });
        }
      }
    }
    const Z = steps[steps.length - 1].letter;

    /* 2차 */
    if (Z === "E") {
      const F = tmax < 0;
      steps.push({ lv: 2, q: "최난월 평균 기온 0℃ 미만?", v: "최난월 " + deg(tmax), ans: F, letter: F ? "F" : "T" });
      code = F ? "EF" : "ET";
    } else if (Z === "B") {
      const W = pAnn < 250;
      steps.push({ lv: 2, q: "연강수량 250mm 미만?", v: "연강수량 " + mm(pAnn), ans: W, letter: W ? "W" : "S" });
      code = W ? "BW" : "BS";
    } else if (Z === "A") {
      if (pmin >= 60) { steps.push({ lv: 2, q: "최소우월 강수량 60mm 이상?", v: "최소우월 " + mm(pmin), ans: true, letter: "f" }); code = "Af"; }
      else {
        const th = 100 - pAnn / 25;
        steps.push({ lv: 2, q: "최소우월 강수량 60mm 이상?", v: "최소우월 " + mm(pmin), ans: false });
        const m = pmin >= th;
        steps.push({ lv: 2, q: "건기가 짧음? (최소우월 ≥ 100 − 연강수량÷25 = " + mm(Math.max(0, th)) + ")", v: "최소우월 " + mm(pmin), ans: m, letter: m ? "m" : "w" });
        code = m ? "Am" : "Aw";
      }
    } else {
      const sDry = p[sMin] < 40 && p[wMax] >= 3 * p[sMin];
      const wDry = p[sMax] >= 10 * p[wMin];
      let sec = "f";
      if (sDry && wDry) sec = p[wMax] / Math.max(1, p[sMin]) >= p[sMax] / Math.max(1, p[wMin]) ? "s" : "w";
      else if (sDry) sec = "s";
      else if (wDry) sec = "w";
      steps.push({ lv: 2, q: "여름 건조? (여름 최소우월 40mm 미만, 겨울 최다우월이 그 3배 이상)",
        v: "여름 최소우월 " + mm(p[sMin]) + " · 겨울 최다우월 " + mm(p[wMax]), ans: sec === "s", letter: sec === "s" ? "s" : null });
      if (sec !== "s") {
        steps.push({ lv: 2, q: "겨울 건조? (여름 최다우월이 겨울 최소우월의 10배 이상)",
          v: "여름 최다우월 " + mm(p[sMax]) + " · 겨울 최소우월 " + mm(p[wMin]), ans: sec === "w", letter: sec === "w" ? "w" : "f" });
      }
      if (Z === "C" && sec === "f") {
        const a = tmax >= 22;
        steps.push({ lv: 3, q: "최난월 평균 기온 22℃ 이상?", v: "최난월 " + deg(tmax), ans: a, letter: a ? "a" : "b" });
        code = "Cf" + (a ? "a" : "b");
      } else code = Z + sec;
    }
    return { code: code, zone: Z, name: NAMES[code] || "", steps: steps, stats: stats };
  }

  return { judge: judge, NAMES: NAMES, zoneOf: ZONE_OF, deg: deg, mm: mm };
})();
