# ============================================================
# 지오엑스-세계의 기후 — tools/build-koppen-map.py  (배포 제외)
# 쾨펜 세계 지도 데이터 만들기 → js/data/koppen-map.js
#
# 기후 자료: Beck et al. (2023) climate_data_0p5.zip 중 1991_2020/ensemble_mean_0p5.nc
#            (0.5° 격자 월평균 기온·강수, CC BY 4.0, figshare 21789074)
# 바탕 지도: Natural Earth 1:50m admin-0 countries (퍼블릭 도메인)
#
# 분류 규칙 (Peel et al. 2007 · Beck et al. 2018 방식, 기획서 결정에 따라 온대·냉대 경계만 −3℃):
#   E  최난월 < 10℃              → ET(최난월 > 0℃) · EF
#   B  연강수량 < 10 × Pth        → BW(< 5 × Pth) · BS
#      Pth = 2 × 연평균기온 + 28(여름 반년 강수 ≥ 70%) / + 0(겨울 반년 ≥ 70%) / + 14(그 밖)
#   A  최한월 ≥ 18℃              → Af(최건월 ≥ 60mm) · Am(최건월 ≥ 100 − 연강수량/25) · Aw
#   C  최한월 > −3℃ / D 최한월 ≤ −3℃
#      s: 여름 최건월 < 40mm 이고 < 겨울 최다우월/3 · w: 겨울 최건월 < 여름 최다우월/10 · 그 밖 f
#      Cf → Cfa(최난월 ≥ 22℃) · Cfb,  D는 Df · Dw (Ds는 Df로 묶음 — 교과서 13유형)
#   고산(H)은 격자 분류에 없음 → 앱에서 고산 도시 점으로 표시
#
# 실행: python tools/build-koppen-map.py <ensemble_mean_0p5.nc> <countries-50m.geojson> [기후데이터.CSV]
#   (h5py · numpy · shapely 필요)
# ============================================================
import sys, json, csv, os
import numpy as np
import h5py
from shapely.geometry import shape, MultiPolygon, Polygon
from shapely.ops import unary_union

NC, GEO = sys.argv[1], sys.argv[2]
CSV = sys.argv[3] if len(sys.argv) > 3 else None
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "js", "data", "koppen-map.js")

CODES = ["", "Af", "Am", "Aw", "BW", "BS", "Cfa", "Cfb", "Cs", "Cw", "Df", "Dw", "ET", "EF"]
IDX = {c: i for i, c in enumerate(CODES)}

# ---------- 1. 기후 자료 읽기 ----------
f = h5py.File(NC, "r")
T = f["air_temperature"][:].astype(np.float64)   # (12, 360, 720)
P = f["precipitation"][:].astype(np.float64)
lat = f["lat"][:]
lon = f["lon"][:]
T[T <= -9000] = np.nan
P[P <= -9000] = np.nan
if lat[0] < lat[-1]:                               # 북쪽이 위(행 0 = 북위 89.75°)가 되게
    T, P, lat = T[:, ::-1, :], P[:, ::-1, :], lat[::-1]
if lon[0] > lon[-1]:
    T, P, lon = T[:, :, ::-1], P[:, :, ::-1], lon[::-1]
H, W = lat.size, lon.size
print("격자", W, "x", H, "위도", lat[0], "→", lat[-1], "경도", lon[0], "→", lon[-1])


def classify(t, p, la):
    """월평균 기온 t[12](℃) · 강수 p[12](mm), 위도 la → 쾨펜 코드"""
    tmax, tmin = t.max(), t.min()
    mat, map_ = t.mean(), p.sum()
    summer = [3, 4, 5, 6, 7, 8] if la >= 0 else [9, 10, 11, 0, 1, 2]   # 4~9월(북반구) / 10~3월(남반구)
    winter = [m for m in range(12) if m not in summer]
    ps, pw = p[summer], p[winter]
    if tmax < 10:
        return "ET" if tmax > 0 else "EF"
    if ps.sum() >= 0.7 * map_:
        pth = 2 * mat + 28
    elif pw.sum() >= 0.7 * map_:
        pth = 2 * mat
    else:
        pth = 2 * mat + 14
    if map_ < 10 * pth:
        return "BW" if map_ < 5 * pth else "BS"
    if tmin >= 18:
        pdry = p.min()
        if pdry >= 60:
            return "Af"
        if pdry >= 100 - map_ / 25:
            return "Am"
        return "Aw"
    s_dry = ps.min() < 40 and ps.min() < pw.max() / 3
    w_dry = pw.min() < ps.max() / 10
    sec = "s" if s_dry else ("w" if w_dry else "f")
    if tmin > -3:
        if sec == "f":
            return "Cfa" if tmax >= 22 else "Cfb"
        return "C" + sec
    return "Dw" if sec == "w" else "Df"


grid = np.zeros((H, W), dtype=np.uint8)
valid = ~np.isnan(T).any(axis=0) & ~np.isnan(P).any(axis=0)
for i in range(H):
    for j in range(W):
        if valid[i, j]:
            grid[i, j] = IDX[classify(T[:, i, j], P[:, i, j], lat[i])]
print("육지 격자", int(valid.sum()))

# ---------- 1-2. 기후대별 육지 면적 비율 (격자 면적 = cos(위도)에 비례, 남극 포함 / 제외) ----------
wlat = np.cos(np.radians(lat))[:, None] * np.ones((1, W))
areas = {}
for tag, mask in (("all", np.ones_like(wlat, dtype=bool)), ("noAnt", (lat > -60)[:, None] * np.ones((1, W), dtype=bool))):
    tot = wlat[(grid > 0) & mask].sum()
    areas[tag] = {z: round(float(wlat[(grid > 0) & mask & np.isin(grid, [IDX[c] for c in CODES if c and c[0] == z])].sum() / tot * 100), 1) for z in "ABCDE"}
print("기후대별 육지 면적(%)", areas)

# ---------- 2. 해안선 틈 메우기: 바다 칸을 가까운 육지 분류로 3칸까지 확장 (해안선으로 잘라 냄) ----------
g = grid.copy()
for _ in range(3):
    ng = g.copy()
    empty = g == 0
    for di, dj in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]:
        sh = np.roll(np.roll(g, di, axis=0), dj, axis=1)
        take = empty & (ng == 0) & (sh > 0)
        ng[take] = sh[take]
    g = ng

# ---------- 3. 격자 → 문자열 (행 단위 연속 길이 부호화) ----------
# 한 구간 = 분류 글자 1자(A=0 없음, B=1 Af …) + 길이(36진수) + "," / 행 끝 ";"
runs = []
for i in range(H):
    row, j, parts = g[i], 0, []
    while j < W:
        k = j
        while k < W and row[k] == row[j]:
            k += 1
        parts.append(chr(65 + int(row[j])) + np.base_repr(k - j, 36).lower())
        j = k
    runs.append(",".join(parts))
grid_str = ";".join(runs)

# ---------- 4. 육지 윤곽·국경 (Natural Earth) → SVG 경로 (x = 경도, y = −위도) ----------
geo = json.load(open(GEO, encoding="utf-8"))
polys = [shape(ft["geometry"]).buffer(0) for ft in geo["features"] if ft["geometry"]]


def ring_path(coords, nd=1):
    pts, last = [], None
    for x, y in coords:
        q = (round(x, nd), round(-y, nd))
        if q != last:
            pts.append(q)
            last = q
    if len(pts) < 4:
        return ""
    return "M" + "L".join("%g %g" % q for q in pts[:-1]) + "Z"


def geom_path(gm, min_area):
    out = []
    parts = gm.geoms if isinstance(gm, MultiPolygon) else [gm]
    for pg in parts:
        if pg.area < min_area:
            continue
        out.append(ring_path(pg.exterior.coords))
        for r in pg.interiors:
            if Polygon(r).area >= min_area * 4:
                out.append(ring_path(r.coords))
    return "".join(out)


land = unary_union(polys).simplify(0.08, preserve_topology=True)
land_path = geom_path(land, 0.08)
# 국경선: 나라 윤곽에서 해안선을 뺀 선
from shapely.geometry import LineString, MultiLineString
coast = land.boundary
border_lines = []
for pg in polys:
    b = pg.simplify(0.1, preserve_topology=True).boundary.difference(coast.buffer(0.12))
    if b.is_empty:
        continue
    for ln in (b.geoms if hasattr(b, "geoms") else [b]):
        if isinstance(ln, LineString) and ln.length > 0.3:
            pts, last = [], None
            for x, y in ln.coords:
                q = (round(x, 1), round(-y, 1))
                if q != last:
                    pts.append(q)
                    last = q
            if len(pts) > 1:
                border_lines.append("M" + "L".join("%g %g" % q for q in pts))
borders_path = "".join(border_lines)

# ---------- 5. 도시 자료로 점검 ----------
if CSV:
    rows = list(csv.DictReader(open(CSV, encoding="utf-8-sig")))
    same, diff = 0, []
    for r in rows:
        if r["Type"] == "H":
            continue
        la, lo = float(r["Lat"]), float(r["Lon"])
        i = int(np.clip((lat[0] + 0.25 - la) / 0.5, 0, H - 1))
        j = int(np.clip((lo - (lon[0] - 0.25)) / 0.5, 0, W - 1))
        c = CODES[g[i, j]]
        want = r["Type"]
        ok = (c == want) or (want == "Cs" and c == "Cs") or (c[:1] == want[:1] and want[:1] in "ABE")
        if ok:
            same += 1
        else:
            diff.append((r["City"], want, c))
    print("도시 자료와 기후대(첫 글자) 일치: %d / %d" % (same, same + len(diff)))
    for d in diff:
        print("  다름:", d)

# ---------- 6. 저장 ----------
js = (
    "/* ============================================================\n"
    "   지오엑스-세계의 기후 — data/koppen-map.js  (tools/build-koppen-map.py로 생성 — 직접 고치지 않음)\n"
    "   쾨펜 세계 지도: 0.5° 격자 분류 + 육지 윤곽 + 국경 (정거원통도법, x = 경도, y = −위도)\n"
    "   기후 자료: Beck et al. (2023) 1991~2020년 월평균 기온·강수 (CC BY 4.0) — 온대·냉대 경계 최한월 −3℃\n"
    "   바탕 지도: Natural Earth 1:50m (퍼블릭 도메인)\n"
    "   ============================================================ */\n"
    "\"use strict\";\n\n"
    "const KOPPEN_MAP = {\n"
    "  w: %d, h: %d, res: 0.5, north: 90, west: -180,\n"
    "  areas: %s,\n"
    "  codes: %s,\n"
    "  grid: \"%s\",\n"
    "  land: \"%s\",\n"
    "  borders: \"%s\"\n"
    "};\n" % (W, H, json.dumps(areas), json.dumps(CODES), grid_str, land_path, borders_path)
)
open(OUT, "w", encoding="utf-8").write(js)
print("저장:", os.path.normpath(OUT), "%.0f KB" % (len(js.encode("utf-8")) / 1024),
      "(격자 %.0f KB · 육지 %.0f KB · 국경 %.0f KB)" % (len(grid_str) / 1024, len(land_path) / 1024, len(borders_path) / 1024))
