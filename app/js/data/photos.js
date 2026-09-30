/* ============================================================
   지오엑스-세계의 기후 — data/photos.js
   사진 목록 — 위키미디어 공용(퍼블릭 도메인 · CC 라이선스), 파일은 assets/photos/ (가로·세로 최대 1400px, 약 300KB 이하로 줄임)
   { 키: { file, cap(설명), author(저작자), license, src(원본 주소) } }
   사진을 추가하면 ui/photo.js의 Photo.html(키)가 그 자리에 사진 카드를 그림
   내려받은 날: 2026-09-29 (선생님 승인)
   ============================================================ */
"use strict";

const PHOTOS = {
  "sky-shower": {"file": "sky-shower.jpg", "cap": "맑은 날의 뭉게구름 — 오늘의 날씨", "author": "W.carter", "license": "CC BY 4.0", "src": "https://commons.wikimedia.org/wiki/File:Cute_summer_cloud_over_Tuntorp,_Brastad.jpg"},
  "sahara": {"file": "sahara.jpg", "cap": "사하라 사막의 모래 언덕 (이집트)", "author": "Vyacheslav Argenberg", "license": "CC BY 4.0", "src": "https://commons.wikimedia.org/wiki/File:Sand_dune_in_the_desert,_Sahara_Desert,_Egypt.jpg"},
  "cumulonimbus": {"file": "cumulonimbus.jpg", "cap": "적란운 — 강한 상승 기류로 높이 솟은 구름", "author": "Thennicke", "license": "CC BY-SA 4.0", "src": "https://commons.wikimedia.org/wiki/File:Cumulonimbus_sunset_panorama,_Albury_NSW_Australia.jpg"},
  "norway-harbour": {"file": "norway-harbour.jpg", "cap": "노르웨이 트롬쇠 항구 — 북위 70° 가까이에서도 겨울에 얼지 않음", "author": "Harald Groven from Tromsø, Norway", "license": "CC BY-SA 2.0", "src": "https://commons.wikimedia.org/wiki/File:Troms%C3%B8_havn_(49851771736).jpg"},
  "monsoon-rain": {"file": "monsoon-rain.jpg", "cap": "여름 계절풍 시기의 비 (미얀마 양곤)", "author": "Jakub Hałun", "license": "CC BY 4.0", "src": "https://commons.wikimedia.org/wiki/File:Monsoon_rain_in_Yangon,_Myanmar,_20160812_082637.jpg"},
  "quito": {"file": "quito.jpg", "cap": "키토 — 해발 약 2,850m 고산 도시 (에콰도르)", "author": "Ymblanter", "license": "CC BY-SA 4.0", "src": "https://commons.wikimedia.org/wiki/File:Quito_Panorama_of_the_historic_center_from_Casa_Bella_Vista_01.jpg"},
  "stevenson-screen": {"file": "stevenson-screen.jpg", "cap": "백엽상과 자동 기상 관측 장비", "author": "A. Kardaś", "license": "CC BY-SA 4.0", "src": "https://commons.wikimedia.org/wiki/File:Klatka_i_stacja_meteo.jpg"},
  "rain-gauge": {"file": "rain-gauge.jpg", "cap": "우량계 — 눈금으로 강수량(mm) 읽기", "author": "FrancescMontana", "license": "CC BY-SA 4.0", "src": "https://commons.wikimedia.org/wiki/File:Manual_rain_gauge_in_mountain_landscape,_Catalonia,_Spain51025_133840.jpg"},
  "wind-vane": {"file": "wind-vane.jpg", "cap": "사막의 기상 관측 장비 — 풍향계 · 풍속계", "author": "Alex Sergeev (www.asergeev.com)", "license": "CC BY-SA 3.0", "src": "https://commons.wikimedia.org/wiki/File:Weather_station_in_Al_Kharrarah.jpg"},
  "atacama": {"file": "atacama.jpg", "cap": "페루 남부 해안의 사막 — 한류 연안 (국제 우주 정거장 촬영)", "author": "NASA Johnson Space Center", "license": "Public domain", "src": "https://commons.wikimedia.org/wiki/File:A_portion_of_the_Atacama_Desert_along_Peru%E2%80%99s_southern_Pacific_coast_(iss074e0315662).jpg"},
  "changma-sat": {"file": "changma-sat.jpg", "cap": "동아시아의 긴 비구름 띠 — 장마 시기 위성 영상 (2016년 6월 23일)", "author": "NASA's Aqua Satellite", "license": "Public domain", "src": "https://commons.wikimedia.org/wiki/File:June_23,_2016,_Eastern_China_thunderstorms.jpg"},
  "rainforest": {"file": "rainforest.jpg", "cap": "열대 우림 — 에콰도르 아마존", "author": "Jay", "license": "CC BY 2.0", "src": "https://commons.wikimedia.org/wiki/File:Amazon_rainforest_treetops_in_Tena,_Ecuador.jpg"},
  "savanna": {"file": "savanna.jpg", "cap": "사바나 — 탄자니아 세렝게티", "author": "Bjørn Christian Tørrissen", "license": "CC BY-SA 3.0", "src": "https://commons.wikimedia.org/wiki/File:Serengeti-Landscape-2012.JPG"},
  "steppe": {"file": "steppe.jpg", "cap": "스텝 — 몽골고원의 초원", "author": "Shizhao", "license": "CC BY-SA 3.0", "src": "https://commons.wikimedia.org/wiki/File:Grasslands-menggu.jpg"},
  "deciduous": {"file": "deciduous.jpg", "cap": "가을의 낙엽 활엽수림 (독일)", "author": "Norbert Nagel", "license": "CC BY-SA 3.0", "src": "https://commons.wikimedia.org/wiki/File:Autumnal_deciduous_forest_-_Laubwand_im_Herbst.jpg"},
  "olive": {"file": "olive.jpg", "cap": "올리브 농장 — 에스파냐 안달루시아", "author": "Wildmountainscene", "license": "CC BY-SA 3.0", "src": "https://commons.wikimedia.org/wiki/File:Olive_groves_in_Andalucia.jpg"},
  "taiga": {"file": "taiga.jpg", "cap": "타이가 — 시베리아의 침엽수림", "author": "Vyacheslav Argenberg", "license": "CC BY 4.0", "src": "https://commons.wikimedia.org/wiki/File:Ergaki,_Taiga_in_Siberia,_Dark_coniferous_forest,_Sayan_Mountains,_Russia.jpg"},
  "tundra": {"file": "tundra.jpg", "cap": "툰드라 — 여름의 알래스카, 호수와 습지", "author": "Andrea Pokrzywinski", "license": "CC BY 2.0", "src": "https://commons.wikimedia.org/wiki/File:Alaska_-tundra_landscape-11Aug2008.jpg"},
  "ice-sheet": {"file": "ice-sheet.jpg", "cap": "그린란드 빙상 — 우주에서 본 모습", "author": "USGS", "license": "Public domain", "src": "https://commons.wikimedia.org/wiki/File:Greenland_ice_sheet_USGS.jpg"},
  "alpaca": {"file": "alpaca.jpg", "cap": "안데스 고원의 알파카 (페루)", "author": "Elwinlhq", "license": "CC BY-SA 4.0", "src": "https://commons.wikimedia.org/wiki/File:Baby_alpacas_in_the_Andes_(Huaman_Quispe_Farm)_-_Alpacas_bebes_-_Paqucha_u%C3%B1a_Nu%C3%B1oa_llaqtamanta.jpg"},
  "andes": {"file": "andes.jpg", "cap": "안데스의 계단식 경작지 — 페루 피사크", "author": "Unukorno", "license": "CC BY 3.0", "src": "https://commons.wikimedia.org/wiki/File:Pisac_Terraces.jpg"}
};
