# HANDOFF — 지오엑스-세계의 기후

다음 작업자(사람·AI)를 위한 개발 안내입니다. 전체 기획은 상위 폴더의 `기획서.md`(v0.6)가 기준이며, 이 문서는 **코드가 어떻게 짜여 있는지**만 다룹니다.

## 1. 지켜야 할 원칙

- **교사용 디지털 교과서**: 교사가 이 화면 그대로 교실 스크린에 띄워 수업합니다. 장면 재생기·방향키·발표 모드는 없습니다(v0.6에서 걷어냄).
- **더블클릭(file://) 실행 유지**: ES 모듈(`type="module"`), CDN, 외부 네트워크 요청, `fetch()`로 로컬 파일 읽기 금지. 모든 자료는 `.js` 파일 안에 데이터로 넣고 일반 `<script>`로 읽습니다.
- 스크립트는 전역을 공유합니다. 파일 맨 위의 `const`·`function` 이름이 서로 겹치지 않게 하세요.
- 구성 단위는 **파트 / 챕터**입니다(단원·소단원이라고 쓰지 않음).
- 화면 문구는 **개조식**(~함 · ~임 · 명사형), 해요체 쓰지 않음. 모두 AI 초안 → 선생님 검토.
- 챕터는 **프레젠테이션 느낌의 슬라이드형 블록**(화면 높이 블록, 한 블록 = 한 메시지, 큰 시각 자료 + 개조식 3줄 이내) — 기획서 3-3. PART 1 제작 때 블록 틀을 만듦.
- **지오퍼스는 지금 쓰지 않습니다**(마무리 단계에서 따로 기획). 그림 파일(`assets/geopus/`)은 보관만 하며, 사이드바 로고(`geopus-hero-circle-256.png`)만 geo-ex와 같은 로고로 씁니다.
- 글꼴 이름은 **AocSans** 그대로 둡니다.
- 작업 흐름: 파트마다 `파트기획/PART*_….md`로 **파트 뼈대 → 챕터 기획 → 제작 → 확인**(챕터마다 반복), 완료 여부는 `기획서.md` 9-4 표에 체크.

## 2. 스크립트 순서 (`index.html`)

```
data/parts.js       ZONES(기후대 색), PART_ICONS, PARTS(파트·챕터 목차), PAGES(평탄화된 페이지 목록)
data/cities.js      CITIES · CITY_BY_ID — 세계 103개 도시 월평균 기온·강수 (tools/build-cities.mjs로 생성)
data/koppen-map.js  KOPPEN_MAP — 0.5° 쾨펜 분류 격자 + 육지·국경 경로 + 기후대별 면적(areas) (tools/build-koppen-map.py로 생성)
data/photos.js      PHOTOS — 사진 목록(위키미디어 공용, 파일은 assets/photos/). 비어 있으면 사진 칸이 그려지지 않음
core/util.js        $, escHtml, fmtKo(숫자+단위 줄바꿈), isMobile, REDUCED, store(localStorage)
core/router.js      주소(#파트-챕터) 읽기·쓰기
ui/sidebar.js       목차(geo-ex 디자인 사이드바·하단 시트), partIcon()
ui/pages.js         홈·챕터 페이지 그리기, chapterHeadHtml()
ui/help.js          사용 안내 창
ui/chart.js         ClimateChart — 작은 기후 그래프(SVG)
ui/worldmap.js      WorldMap — 쾨펜 세계 지도(범례 강조·위도선·누르기·도시 점·세부 유형 색·도시 선택)
ui/quiz.js          Quiz — 함께 풀기(ox · mcq · graphs · sort · map)
ui/koppen.js        Koppen — 교과서 기준 쾨펜 판별(judge: 기호·이름·단계별 근거) — part1.js가 불러올 때 쓰므로 챕터 파일보다 앞
ui/anim.js          Anim — 단계 애니메이션 재생기(player: ▶ 재생 · ↻ · 단계 버튼 → onStep) · flowToggle(흐름 멈춤)
ui/modal.js         Modal — 상세 모달(open · close · isOpen, Esc·바깥 누르기로 닫기)
ui/photo.js         Photo — 사진 카드(html · has · open, 누르면 크게 보기). PHOTOS에 없는 키는 빈 문자열
ui/slides.js        Slides · CHAPTER_CONTENT — 슬라이드형 블록 틀, chapterChip()
chapters/part1.js   PART 1 기후의 이해
ui/nodes.js · chapters/part2-figs.js · chapters/part2-sims.js · chapters/part2.js   PART 2 (노드형 블록 — 원본 그림 part2-figs.js, 시뮬레이터형 그림 part2-sims.js가 같은 이름으로 바꿔 끼움)
ui/climgraph.js     ClimGraph — 큰 기후 그래프(표시 켜기·끄기, 기준선, 같은 눈금, start: 시작 달, 그리기 애니메이션 훅)
chapters/part4.js   PART 4 + JudgeBoard(판별판, PART 6에서도 사용)
chapters/part5.js   PART 5 — 기후대 챕터 공통 틀 build()
chapters/part6.js   PART 6
chapters/atmos.js   PART 3 — 대기대순환 3D(iframe) 연결
core/app.js         goPage(): 페이지 이동, 목차·하단 시트·주소·창 제목 갱신
main.js             초기화
```

뒤 파일이 앞 파일의 전역을 씁니다(함수 안에서 호출하는 것은 순서 무관). 챕터 내용 파일은 `js/chapters/`에 두고 `core/app.js` 앞에 넣는 것이 기본입니다.

## 3. 페이지 모델

- `PAGES`(parts.js `buildPages()`)는 앱 전체를 한 줄로 편 목록입니다: `home → 1-1 → 1-2 → … → 6-3` (25개 챕터, 파트 표지 없음).
- 페이지 종류(`kind`): `home` · `chapter`(2D 챕터, 스크롤 한 페이지) · `atmos3d`(PART 3).
- 앱 상태는 `core/app.js`의 `app = { page }` 하나뿐입니다. `goPage(id)`가 페이지를 그리고 `renderChrome()`이 목차·하단 시트·주소·창 제목을 맞춥니다.
- 파트 첫 챕터(`p.first`) 머리글에는 파트 목표가 함께 나옵니다.
- 페이지 안의 `[data-go="챕터id"]` 요소를 누르면 그 챕터로 이동합니다(`initApp()`의 클릭 처리).

### 주소 형식

| 주소 | 뜻 |
|---|---|
| `#home` | 홈 · 수업 시작하기 (`#start`도 홈으로) |
| `#2-2` | 챕터 2-2 기후 요인 |
| `#4` | PART 4 첫 챕터(4-1) |

주소는 `history.replaceState`로만 바꿔 뒤로 가기 기록이 쌓이지 않습니다. 직접 고친 주소는 `hashchange`로 반영됩니다.

## 4. 챕터 내용 채우기

- 제작한 챕터는 `CHAPTER_CONTENT["1-1"] = { blocks: [ { title, kind, html, quiz, init } … ] }`로 등록 → `renderPage()`가 `Slides.render()`로 **슬라이드형 블록**을 그림(표지 블록은 자동). 「다음 챕터」 버튼은 두지 않음 — 챕터 이동은 사이드바 목차(선생님 결정, 2026-09-29).
  - kind: `content`(기본) · `think`(생각해 보기) · `quiz`(함께 풀기 — `quiz` 필드) · `summary`(정리)
  - `init(블록 요소, 페이지)`: 그린 뒤 지도·버튼 등 동작 연결
- 등록하지 않은 챕터는 `renderChapterPage()`의 「준비 중」 틀(목록 문구 = `parts.js`의 `plan`).
- 챕터 링크 칩은 `chapterChip(id, 이름, 노드)`(ui/slides.js) — 2-2로 가는 칩은 이름(해류·수륙·계절풍·기단·지형·위도)으로 노드를 골라 `data-node`를 붙임 → 누르면 2-2의 그 노드가 바로 열림(core/app.js 클릭 처리).
- 블록 CSS: 공용은 `style.css`(슬라이드·지도·함께 풀기), 파트별은 `css/part4.css`(큰 그래프·판별판 — PART 5·6도 사용) · `css/part5.css` · `css/part6.css` · `part2.css`(Cursor).
- 판별 기준은 `ui/koppen.js` 한 곳 — 기준을 바꾸면 PART 4·5·6이 함께 바뀜. 세계 지도 분류는 `tools/build-koppen-map.py`(정밀 건조 한계, 온대·냉대 −3℃)로 따로 만듦.
- 글자 크기: 내용 영역은 `--fs-body`(1920px 폭에서 약 20px), 제목 `--fs-title`, 목표 `--fs-goal`. 챕터 안 글자는 `em` 단위로 쓰면 스크린 크기에 맞춰 함께 커집니다.

## 5. 사이드바 (geo-ex 디자인)

- 머리: 원형 로고 + 「지오엑스-세계의 기후」 + 회색 부제. 사이드바 글씨는 굵게 쓰지 않음(선생님 요청). 아래: 구분선 + 「교사용 · 사용 안내 · 📄」(누르면 사용 안내 창).
- 홈 줄과 파트 줄은 선 아이콘(`PART_ICONS`) + 이름 (`PART n` 표시 없음). 챕터는 들여 쓴 이모지(`emoji`), 기후대 챕터는 색 점.
- 현재 파트는 항상 펼치고, 다른 파트는 파트 이름을 눌러 펼친 것만 펼쳐 둡니다(`partOpen`).
- 휴대전화·세로 태블릿(`util.js mqMobile`)에서는 하단 시트: 축소 바(현재 챕터)를 누르거나 위로 끌어 올리면 목차가 열립니다.

## 6. PART 3 — 대기대순환 3D 연결

- `atmos3d/`는 원본 `대기대순환 3D/`를 복사한 것에 **`js/embed.js` 한 파일**과 `index.html` 맨 끝 한 줄(`<script src="js/embed.js"></script>`)만 추가했습니다. 단독으로 열면 embed.js는 아무 일도 하지 않습니다.
- 챕터 3-1~3-8 = 3D 단계 1~8(`parts.js`의 `step`). 3D 챕터 화면은 머리글 없이 틀(`#atmos-frame`)이 내용 영역 전체를 씁니다(선생님 결정, 2026-09-29). 틀은 처음 한 번만 `atmos3d/index.html#i-1`로 불러오고, 이후에는 메시지로만 움직입니다. 다른 파트로 가도 틀은 숨겨 둔 채 유지합니다.
- **장면 넘기기는 3D 안의 ◀ ▶ 진행 막대**가 담당합니다. 3D에서 단계가 바뀌면 앱의 챕터·목차·주소가 따라갑니다(`onAtmosStep`).

| 방향 | 메시지 |
|---|---|
| 앱 → 3D | `{ src:"geoclimate", cmd:"go", i, k }` · `{ cmd:"layout", mobile }` |
| 3D → 앱 | `{ src:"atmos3d", type:"hello" }` (로드됨) · `"ready"` (첫 장면 열림) · `"beat"` (장면 바뀜: step, beat, beats) |

- embed.js가 하는 일: 3D 자체 사이드바·하단 시트·발표 종료 버튼 숨김, 진행 막대 항상 표시(휴대전화에서는 자동·속도 버튼 숨김), 3D 하단 시트 자리 비우지 않기(`insetTarget` 감쌈), F 키(발표 모드) 막기, `goBeat`·`openFromHash`를 감싸 장면 변화를 앱에 알림(3D가 embed.js보다 먼저 첫 장면을 연 경우에도 준비 완료를 알림). 원본에서 이 함수 이름이 바뀌면 embed.js도 고쳐야 합니다.
- **원본 3D를 고친 뒤 다시 맞추는 법**: 원본 파일을 `atmos3d/`에 덮어쓰고, `atmos3d/index.html` 맨 끝(`js/main.js` 뒤)에 embed.js 한 줄을 다시 넣은 다음, 아래 점검 도구를 돌립니다.
- 휴대전화에서는 틀이 앱 하단 시트 바 위에서 끝납니다(`.atmos { bottom: var(--sheet-peek) }`).

## 7. 점검 도구 (`tools/check-file.mjs`, 배포 제외)

```
cd app
node tools/check-file.mjs
```

- Node 22 이상 + Chrome 또는 Edge 필요. 헤드리스 브라우저로 `index.html`을 **file://로 직접** 열어 점검합니다(약 1분).
- 점검 항목(60개, 사진 21장 불러오기 · 2차 보강 기능 포함): 앱 시작·목차·이동·주소, PART 3 3D 동기화, PART 1(슬라이드·애니메이션·오늘 기온·지도 분류·범례·함께 풀기·2-2 노드 바로 열기), PART 4(그리는 순서·7월부터·그래프 표시·순서도·기준 실험·판별판), PART 5(블록 틀·기압대 이동·삽화), PART 6(도시 지도·비교 세트·무작위 판별·교실 퀴즈·힌트), 스크립트 오류.
- 캡처(`tools/shots/`, 저장소에는 올리지 않음 — 점검 때 다시 만들어짐): 제작한 챕터 블록 전부(1920×1080, PART 1·4는 1366×768도) + 4개 화면 × 5개 해상도. 약 5분.
- PART 2 전용 점검: `node tools/check-part2.mjs` (Cursor 작업, 캡처 `tools/shots-p2/`) — 37개(시뮬레이터 · 도시로 읽는 기후 요인 · 단계 애니메이션·다음 소주제·흐르는 해류·장마 전선 북상·추가 문제 포함).
- 브라우저 도구로 확인할 때는 `python -m http.server`로 `app`을 띄워도 됩니다(file://와 동작 동일).

## 8. 애니메이션 · 사진 (2026-09-29 보강)

- 단계형 애니메이션은 `Anim.player(담을 요소, { steps, onStep, interval, loop, start })` 하나로 통일 — 그림 쪽은 `onStep(k)`에서 `data-st` 같은 속성만 바꾸고 움직임은 CSS transition이 맡음. 동작 줄이기 설정(`REDUCED`)이면 CSS가 움직임을 끔.
- 계속 흐르는 움직임(해류·계절풍 점선 `.ga-l.flow`, 바람 알갱이, 산을 넘는 공기)은 CSS/SVG 애니메이션, 멈춤은 `Anim.flowToggle`.
- 사진: `Photo.html(키, { cls })` — `PHOTOS`에 키가 없으면 아무것도 그리지 않으므로 사진 없이도 화면이 완성됨. 사진을 넣으면 `assets/photos/` 파일 + `data/photos.js` 항목(file · cap · author · license · src) + 사용 안내 창 출처 목록.
- PART 2(Cursor 코드) 보강은 그림 함수 안쪽만 넓힘: `part2-figs.js`의 `photo()` · `player()` · `tween()` · `makeMap().setFn/ov` · `geoArrow(…, flow)`, `nodes.js`의 「다음 소주제 →」.

- 정리 블록: `{ kind: "summary", terms: [핵심 용어…] }` → 번호 카드 + 용어 칩 (ui/slides.js)

## 9. 다음 할 일

- PART 1 · 4 · 5 · 6 제작 완료(Claude), PART 2 제작 완료(Cursor) — 선생님 확인 대기. PART 3(3D)은 손대지 않음(선생님 지시).
- 선생님 확인 사항은 각 `파트기획/PART*.md` 끝 「선생님 확인이 필요한 것」에 모아 둠.
- 2026-09-29 PART 1 · 2 · 4 · 5 · 6 보강(애니메이션 · 사진 칸 · 추가 블록·문제) 완료 — 사진 21장 내려받아 넣음(assets/photos/, 약 5MB, 목록·출처 data/photos.js · 사용 안내 창 「사진 목록 보기」).
- 남은 큰 일: 선생님 수정 사항 반영 → 마무리 단계(지오퍼스 기획, 배포).
