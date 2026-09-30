/* ============================================================
   지오엑스-세계의 기후 — tools/build-cities.mjs  (배포 제외)
   세계의 기후 도시 기후 자료(기후데이터.CSV, 103개 도시) → js/data/cities.js
   실행: node tools/build-cities.mjs "<기후데이터.CSV 경로>"
   ============================================================ */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const APP = dirname(dirname(fileURLToPath(import.meta.url)));
const src = process.argv[2];
if (!src) { console.error("CSV 경로를 넣어 주세요."); process.exit(1); }

const lines = readFileSync(src, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
const head = lines[0].split(",");
const col = (n) => head.indexOf(n);
const cities = lines.slice(1).map((l) => {
  const c = l.split(",");
  const num = (i) => Number(c[i]);
  return {
    id: c[col("City")],
    kr: c[col("City_KR")].replace(/_/g, " "),
    type: c[col("Type")].trim(),
    lat: num(col("Lat")), lon: num(col("Lon")),
    t: Array.from({ length: 12 }, (_, m) => num(col("T" + (m + 1)))),
    p: Array.from({ length: 12 }, (_, m) => num(col("P" + (m + 1))))
  };
});

const body = cities.map((c) => "  " + JSON.stringify(c)).join(",\n");
const js = `/* ============================================================
   지오엑스-세계의 기후 — data/cities.js  (tools/build-cities.mjs로 생성 — 직접 고치지 않음)
   세계 ${cities.length}개 도시 기후 자료 (월평균 기온 t[℃] · 월 강수량 p[mm], WMO 기후 평년값)
   type: 교과서 기준 기후 유형 (고산 도시는 H)
   ============================================================ */
"use strict";

const CITIES = [
${body}
];
const CITY_BY_ID = {};
CITIES.forEach(function (c) { CITY_BY_ID[c.id] = c; });
`;
writeFileSync(join(APP, "js", "data", "cities.js"), js);
console.log("저장: js/data/cities.js — " + cities.length + "개 도시");
