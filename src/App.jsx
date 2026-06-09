import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CAT_CENTER = {
  x: 0.5,
  y: 0.67,
};

// Weekly Avg DAU — 10 most recent months (Aug 2025 → Jun 2026). Edit freely.
// `note` adds an annotation label above a bar.
const MATTLE_DAU = [
  { week: "2025-08-04", dau: 1028 },
  { week: "2025-08-11", dau: 938 },
  { week: "2025-08-18", dau: 1129 },
  { week: "2025-08-25", dau: 1177 },
  { week: "2025-09-01", dau: 1342, note: "growth start" },
  { week: "2025-09-08", dau: 1874 },
  { week: "2025-09-15", dau: 2029 },
  { week: "2025-09-22", dau: 2149 },
  { week: "2025-09-29", dau: 2349 },
  { week: "2025-10-06", dau: 3010 },
  { week: "2025-10-13", dau: 3201, note: "PEAK" },
  { week: "2025-10-20", dau: 2462 },
  { week: "2025-10-27", dau: 2594 },
  { week: "2025-11-03", dau: 2675 },
  { week: "2025-11-10", dau: 2441 },
  { week: "2025-11-17", dau: 1917, note: "decline" },
  { week: "2025-11-24", dau: 1812 },
  { week: "2025-12-01", dau: 1856 },
  { week: "2025-12-08", dau: 1825 },
  { week: "2025-12-15", dau: 1699 },
  { week: "2025-12-22", dau: 1711 },
  { week: "2025-12-29", dau: 1601 },
  { week: "2026-01-05", dau: 1723 },
  { week: "2026-01-12", dau: 3422, note: "SPIKE (event)" },
  { week: "2026-01-19", dau: 2998 },
  { week: "2026-01-26", dau: 2966 },
  { week: "2026-02-02", dau: 2719 },
  { week: "2026-02-09", dau: 2789 },
  { week: "2026-02-16", dau: 2492 },
  { week: "2026-02-23", dau: 2311 },
  { week: "2026-03-02", dau: 2105 },
  { week: "2026-03-09", dau: 2052 },
  { week: "2026-03-16", dau: 1867, note: "steady decline" },
  { week: "2026-03-23", dau: 1811 },
  { week: "2026-03-30", dau: 1691 },
  { week: "2026-04-06", dau: 1635 },
  { week: "2026-04-13", dau: 1486 },
  { week: "2026-04-20", dau: 1401 },
  { week: "2026-04-27", dau: 1331 },
  { week: "2026-05-04", dau: 1246 },
  { week: "2026-05-11", dau: 1178 },
  { week: "2026-05-18", dau: 1096 },
  { week: "2026-05-25", dau: 1000 },
  { week: "2026-06-01", dau: 927, partial: true },
];

// Expand the weekly DAU averages into DAILY points whose per-week mean equals
// the weekly average (random daily jitter, deterministic via seed). Each point
// is { date: "YYYY-MM-DD", dau }. Used for the DAU line on the daily timeline.
const MATTLE_DAU_DAILY = (() => {
  let seed = 99173;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const out = [];
  for (const w of MATTLE_DAU) {
    const base = Date.parse(w.week + "T00:00:00Z");
    const days = w.partial ? 4 : 7;
    const deltas = [];
    for (let i = 0; i < days; i++) deltas.push(rnd() - 0.5);
    const mean = deltas.reduce((a, b) => a + b, 0) / days; // remove drift → mean 0
    const amp = w.dau * 0.18; // gentle daily spread around the weekly average
    for (let i = 0; i < days; i++) {
      out.push({
        date: new Date(base + i * 86400000).toISOString().slice(0, 10),
        dau: Math.max(0, Math.round(w.dau + (deltas[i] - mean) * amp)),
      });
    }
  }
  return out;
})();

// Real daily Impressions for Mattle (from X analytics CSV export). One value
// per day from 2025-06-09. Peak: Jan 14 2026 (379,781). Index 0 = _START.
const MATTLE_IMPRESSIONS_START = "2025-06-09";
const MATTLE_IMPRESSIONS = [
  1714, 621, 1698, 1036, 1144, 1312, 2170, 1476, 1282, 841, 6508, 6286, 3512, 18121,
  19029, 5353, 4537, 16757, 12662, 6784, 13782, 5204, 3488, 4506, 4109, 3594, 5077, 3034,
  6456, 13299, 6437, 6245, 7109, 4496, 1818, 5247, 5171, 3199, 2608, 3735, 12958, 6352,
  9470, 4721, 4018, 5217, 3935, 5061, 5485, 6517, 7821, 13828, 6866, 5345, 2898, 9707,
  5374, 4206, 8528, 3373, 1782, 1768, 2643, 5967, 4436, 9440, 5640, 9065, 3458, 1705,
  3659, 6851, 10701, 26935, 28730, 15513, 9064, 13140, 12713, 15038, 8897, 5632, 4730, 3595,
  6770, 7058, 10672, 8499, 9776, 10382, 12988, 11629, 10576, 8835, 20217, 22115, 9718, 6405,
  18192, 36301, 39418, 28661, 28630, 23874, 18270, 30678, 29243, 29211, 16890, 28021, 37891, 19176,
  22034, 87637, 177402, 34248, 19489, 12522, 25468, 34447, 23717, 65414, 60290, 81637, 55791, 28115,
  52443, 34455, 46049, 40387, 20251, 23905, 35203, 50400, 32179, 34257, 31266, 23355, 12236, 8115,
  13241, 22245, 29596, 21497, 19244, 14967, 10012, 22488, 48527, 82706, 53595, 18681, 18301, 20756,
  14296, 48656, 65511, 30363, 18767, 10165, 5986, 7253, 9468, 5120, 3936, 19343, 21253, 10920,
  13783, 13692, 13224, 9353, 6715, 10346, 7864, 9993, 4951, 3792, 7571, 15403, 7368, 5190,
  3869, 8561, 8045, 8539, 6004, 4694, 4706, 3365, 5266, 7652, 9643, 13452, 11787, 7698,
  15044, 8887, 7643, 5524, 8156, 4223, 3142, 3405, 4416, 18860, 10787, 6573, 4934, 4997,
  4601, 3420, 8802, 11890, 9480, 9310, 14332, 12895, 55531, 379781, 185513, 97606, 42935, 24851,
  35299, 41051, 43000, 75986, 66735, 16652, 11532, 16771, 17083, 9706, 18668, 6812, 8435, 11812,
  10655, 7952, 5691, 4135, 3465, 3747, 3150, 55438, 31754, 20437, 9739, 6128, 8013, 5093,
  8946, 7912, 3906, 3663, 3397, 4160, 19783, 14206, 8822, 4141, 5635, 6605, 22812, 11244,
  5532, 5478, 4664, 6646, 10603, 5415, 4283, 3334, 11212, 26441, 18268, 15980, 17855, 12898,
  8836, 6194, 3186, 3178, 12182, 27742, 44011, 72575, 37038, 11101, 51132, 76647, 2244, 2910,
  5269, 3197, 1870, 1690, 4133, 1964, 1932, 3611, 8062, 5046, 2789, 2256, 1373, 1307,
  4988, 4032, 6458, 3309, 2204, 1825, 1913, 2056, 4748, 3381, 11347, 3810, 1906, 7310,
  31317, 41704, 40629, 14770, 3311, 1438, 1172, 58309, 73671, 12015, 2841, 1586, 1012, 1578,
  3221, 4079, 1569, 1408, 1195, 1318, 2533, 1380, 1639, 4447, 6847, 3562, 1515, 1413,
  1494, 1392, 925, 1290, 2618, 2308, 1223, 1848, 1168, 4799, 3685, 2821, 1851, 1188,
  441,
];

// Real daily Impressions for Lora Finance (from X analytics CSV export).
const LORA_IMPRESSIONS_START = "2025-12-08";
const LORA_IMPRESSIONS = [
  717, 9159, 5418, 8160, 8538, 4471, 1869, 3178, 4770, 5943, 3635, 1450, 942, 1250,
  961, 652, 1076, 948, 362, 246, 906, 478, 427, 486, 365, 335, 299, 295,
  348, 4095, 51968, 55101, 15045, 30622, 64495, 24129, 33877, 9538, 4217, 170083, 132398, 22817,
  12580, 7374, 4541, 9199, 13352, 6803, 2502, 2100, 1873, 2192, 2112, 1671, 1415, 1218,
  5426, 3826, 1480, 1078, 1083, 967, 813, 1102, 1018, 1035, 1158, 827, 660, 660,
  550, 645, 573, 517, 692, 593, 493, 493, 496, 468, 496, 583, 539, 564,
  499, 1012, 938, 731, 497, 458, 442, 541, 353, 11557, 29610, 32010, 46291, 49645,
  44848, 30353, 30794, 17829, 26945, 8764, 7300, 17518, 10667, 13613, 27081, 22629, 11807, 13513,
  15915, 6903, 4190, 5856, 6172, 9808, 16632, 12570, 6706, 6294, 4936, 3476, 4152, 8257,
  8201, 3423, 3157, 2164, 2884, 2288, 1501, 1295, 1394, 1185, 1634, 1240, 1014, 1221,
  1162, 1045, 1342, 1107, 928, 963, 973, 865, 1101, 1010, 1032, 1029, 877, 722,
  1028, 895, 1150, 1021, 729, 675, 754, 792, 986, 650, 647, 573, 615, 1262,
  622, 486, 483, 675, 544, 576, 512, 500, 419, 627, 679, 501, 547, 515,
  200,
];

// Real X posts per day: "YYYY-MM-DD": [url, url, …]. Dates derived from each
// tweet's snowflake id. A day may have 0 (no embed) or several posts (all shown).
const MATTLE_POSTS = {
  "2025-08-01": ["https://x.com/mattlefun/status/1951122370653217029", "https://x.com/mattlefun/status/1951204883039965245"],
  "2025-08-02": ["https://x.com/mattlefun/status/1951484440464507043"],
  "2025-08-03": ["https://x.com/mattlefun/status/1951854332829413702", "https://x.com/mattlefun/status/1952003894869196842", "https://x.com/mattlefun/status/1952031230905749561", "https://x.com/mattlefun/status/1952040068631445633"],
  "2025-08-04": ["https://x.com/mattlefun/status/1952278603393372430", "https://x.com/mattlefun/status/1952422300445200773"],
  "2025-08-06": ["https://x.com/mattlefun/status/1952947362600763830", "https://x.com/mattlefun/status/1952995963536326792"],
  "2025-08-07": ["https://x.com/mattlefun/status/1953406365134889406"],
  "2025-08-10": ["https://x.com/mattlefun/status/1954557633207189624"],
  "2025-08-11": ["https://x.com/mattlefun/status/1954837724852281406", "https://x.com/mattlefun/status/1954853273451790529", "https://x.com/mattlefun/status/1954863504348840233"],
  "2025-08-12": ["https://x.com/mattlefun/status/1955306772836782249", "https://x.com/mattlefun/status/1955403926284783843"],
  "2025-08-13": ["https://x.com/mattlefun/status/1955484471974826390"],
  "2025-08-14": ["https://x.com/mattlefun/status/1955804506920509870", "https://x.com/mattlefun/status/1955953908913987909"],
  "2025-08-15": ["https://x.com/mattlefun/status/1956205699492659227", "https://x.com/mattlefun/status/1956290997748474132", "https://x.com/mattlefun/status/1956357457242112058"],
  "2025-08-18": ["https://x.com/mattlefun/status/1957463729710481911"],
  "2025-08-19": ["https://x.com/mattlefun/status/1957645148504093128", "https://x.com/mattlefun/status/1957812900485296512", "https://x.com/mattlefun/status/1957832167490482534"],
  "2025-08-20": ["https://x.com/mattlefun/status/1958002258098155588", "https://x.com/mattlefun/status/1958135289496649798", "https://x.com/mattlefun/status/1958201725741150411"],
  "2025-08-21": ["https://x.com/mattlefun/status/1958409299564331218"],
  "2025-08-22": ["https://x.com/mattlefun/status/1958772979158196462", "https://x.com/mattlefun/status/1958936783984763367"],
  "2025-08-23": ["https://x.com/mattlefun/status/1959109363630735764", "https://x.com/mattlefun/status/1959149841713336570"],
  "2025-08-25": ["https://x.com/mattlefun/status/1959917418278429052", "https://x.com/mattlefun/status/1959976963654991952"],
  "2025-08-26": ["https://x.com/mattlefun/status/1960222038322479283"],
  "2025-08-27": ["https://x.com/mattlefun/status/1960582769865843207", "https://x.com/mattlefun/status/1960634896306856059", "https://x.com/mattlefun/status/1960671803719688667"],
  "2025-08-28": ["https://x.com/mattlefun/status/1961104437365383467"],
  "2025-08-30": ["https://x.com/mattlefun/status/1961789329375940653"],
  "2025-09-01": ["https://x.com/mattlefun/status/1962463113200152888"],
  "2025-09-02": ["https://x.com/mattlefun/status/1962839453145416190"],
  "2025-09-03": ["https://x.com/mattlefun/status/1963075280828039281", "https://x.com/mattlefun/status/1963275428912848898"],
  "2025-09-05": ["https://x.com/mattlefun/status/1963830758415405461", "https://x.com/mattlefun/status/1963870621919814100", "https://x.com/mattlefun/status/1963876132585185488", "https://x.com/mattlefun/status/1963961204142969342"],
  "2025-09-06": ["https://x.com/mattlefun/status/1964306306569052585", "https://x.com/mattlefun/status/1964344831129604549"],
  "2025-09-08": ["https://x.com/mattlefun/status/1964923534242988333", "https://x.com/mattlefun/status/1964951380973756592"],
  "2025-09-09": ["https://x.com/mattlefun/status/1965243321435251005", "https://x.com/mattlefun/status/1965356859147387224"],
  "2025-09-10": ["https://x.com/mattlefun/status/1965830408442085748"],
  "2025-09-11": ["https://x.com/mattlefun/status/1965993651634618784", "https://x.com/mattlefun/status/1966005382259843274", "https://x.com/mattlefun/status/1966022555598458914", "https://x.com/mattlefun/status/1966120230549430683"],
  "2025-09-12": ["https://x.com/mattlefun/status/1966354609397743881", "https://x.com/mattlefun/status/1966373920808014119", "https://x.com/mattlefun/status/1966456710736023684"],
  "2025-09-13": ["https://x.com/mattlefun/status/1966804933954658764"],
  "2025-09-15": ["https://x.com/mattlefun/status/1967483526359679312", "https://x.com/mattlefun/status/1967535083432419433", "https://x.com/mattlefun/status/1967672600039211436"],
  "2025-09-16": ["https://x.com/mattlefun/status/1967872587939434821", "https://x.com/mattlefun/status/1967921418575958376", "https://x.com/mattlefun/status/1967983983779823866", "https://x.com/mattlefun/status/1968014292793598360", "https://x.com/mattlefun/status/1968032292275884497"],
  "2025-09-17": ["https://x.com/mattlefun/status/1968156572674383882", "https://x.com/mattlefun/status/1968177684691005762", "https://x.com/mattlefun/status/1968224135617855781", "https://x.com/mattlefun/status/1968268704816169352", "https://x.com/mattlefun/status/1968344712211021901"],
  "2025-09-18": ["https://x.com/mattlefun/status/1968527534997541101", "https://x.com/mattlefun/status/1968613756776366432", "https://x.com/mattlefun/status/1968685929801072653", "https://x.com/mattlefun/status/1968766981689204953"],
  "2025-09-19": ["https://x.com/mattlefun/status/1968890037019484350", "https://x.com/mattlefun/status/1968912125159424250", "https://x.com/mattlefun/status/1968978385738084469", "https://x.com/mattlefun/status/1969105070479290865"],
  "2025-09-20": ["https://x.com/mattlefun/status/1969247861973139574", "https://x.com/mattlefun/status/1969299980142682215", "https://x.com/mattlefun/status/1969344534653124915", "https://x.com/mattlefun/status/1969399230394744960"],
  "2025-09-21": ["https://x.com/mattlefun/status/1969766707855302990", "https://x.com/mattlefun/status/1969795634065768747", "https://x.com/mattlefun/status/1969876852753002748"],
  "2025-09-22": ["https://x.com/mattlefun/status/1969979086757073329", "https://x.com/mattlefun/status/1970073528725905908"],
  "2025-09-23": ["https://x.com/mattlefun/status/1970341756291215668", "https://x.com/mattlefun/status/1970462626682675643", "https://x.com/mattlefun/status/1970490638161588706", "https://x.com/mattlefun/status/1970508570400891158", "https://x.com/mattlefun/status/1970524615710777649", "https://x.com/mattlefun/status/1970550965154787710"],
  "2025-09-24": ["https://x.com/mattlefun/status/1970691775124918606", "https://x.com/mattlefun/status/1970788313926865263", "https://x.com/mattlefun/status/1970793536443617352", "https://x.com/mattlefun/status/1970862767214415895", "https://x.com/mattlefun/status/1970873360247902458", "https://x.com/mattlefun/status/1970881595566707021"],
  "2025-09-25": ["https://x.com/mattlefun/status/1971061048972054798"],
  "2025-09-26": ["https://x.com/mattlefun/status/1971389742836219961", "https://x.com/mattlefun/status/1971526395642917316", "https://x.com/mattlefun/status/1971577851045728603", "https://x.com/mattlefun/status/1971619247475532027"],
  "2025-09-27": ["https://x.com/mattlefun/status/1971823941296734568"],
  "2025-09-28": ["https://x.com/mattlefun/status/1972101956505424150"],
  "2025-09-29": ["https://x.com/mattlefun/status/1972522975112110280", "https://x.com/mattlefun/status/1972684378691227756"],
  "2025-09-30": ["https://x.com/mattlefun/status/1972888191058559007", "https://x.com/mattlefun/status/1972971114868445293", "https://x.com/mattlefun/status/1972997417982410946", "https://x.com/mattlefun/status/1973055234709836166"],
  "2025-10-01": ["https://x.com/mattlefun/status/1973279433311265017", "https://x.com/mattlefun/status/1973327027198677332", "https://x.com/mattlefun/status/1973415224637268231", "https://x.com/mattlefun/status/1973417732361351186"],
  "2025-10-03": ["https://x.com/mattlefun/status/1974060115197399351"],
  "2025-10-05": ["https://x.com/mattlefun/status/1974746382767661073"],
  "2025-10-06": ["https://x.com/mattlefun/status/1975108770868146432", "https://x.com/mattlefun/status/1975133066168545609", "https://x.com/mattlefun/status/1975230001965584839"],
  "2025-10-07": ["https://x.com/mattlefun/status/1975410355544477967", "https://x.com/mattlefun/status/1975527777110815112", "https://x.com/mattlefun/status/1975592899191710046"],
  "2025-10-08": ["https://x.com/mattlefun/status/1975826764292366508", "https://x.com/mattlefun/status/1975927633562178003", "https://x.com/mattlefun/status/1975954551661539644", "https://x.com/mattlefun/status/1975956555700052148"],
  "2025-10-09": ["https://x.com/mattlefun/status/1976187489414168752", "https://x.com/mattlefun/status/1976256335197978663"],
  "2025-10-10": ["https://x.com/mattlefun/status/1976595497138987130", "https://x.com/mattlefun/status/1976645725531550200"],
  "2025-10-11": ["https://x.com/mattlefun/status/1977029834472927509"],
  "2025-10-13": ["https://x.com/mattlefun/status/1977607732363657455"],
  "2025-10-14": ["https://x.com/mattlefun/status/1977933553624400202", "https://x.com/mattlefun/status/1977977506168021498", "https://x.com/mattlefun/status/1978124890231492993"],
  "2025-10-15": ["https://x.com/mattlefun/status/1978358138404536726", "https://x.com/mattlefun/status/1978415855362056331", "https://x.com/mattlefun/status/1978480541696741509", "https://x.com/mattlefun/status/1978491473801908489"],
  "2025-10-16": ["https://x.com/mattlefun/status/1978697132573172016", "https://x.com/mattlefun/status/1978742678147027378"],
  "2025-10-17": ["https://x.com/mattlefun/status/1979067525951557764"],
  "2025-10-18": ["https://x.com/mattlefun/status/1979481670014439473", "https://x.com/mattlefun/status/1979511023104299364"],
  "2025-10-19": ["https://x.com/mattlefun/status/1979766424534192480"],
  "2025-10-20": ["https://x.com/mattlefun/status/1980152052216184867", "https://x.com/mattlefun/status/1980301460983451917"],
  "2025-10-21": ["https://x.com/mattlefun/status/1980499355019923943", "https://x.com/mattlefun/status/1980657537977577633"],
  "2025-10-22": ["https://x.com/mattlefun/status/1980840741082657025", "https://x.com/mattlefun/status/1980878673566892080", "https://x.com/mattlefun/status/1980959820929737216", "https://x.com/mattlefun/status/1981027691269599592"],
  "2025-10-23": ["https://x.com/mattlefun/status/1981191652372074803", "https://x.com/mattlefun/status/1981237358113804354", "https://x.com/mattlefun/status/1981335758813483265"],
  "2025-10-24": ["https://x.com/mattlefun/status/1981623168399012170", "https://x.com/mattlefun/status/1981692155782701507"],
  "2025-10-27": ["https://x.com/mattlefun/status/1982839647920390435"],
  "2025-10-28": ["https://x.com/mattlefun/status/1983090793230499914"],
  "2025-10-29": ["https://x.com/mattlefun/status/1983442483477659664", "https://x.com/mattlefun/status/1983547047287591387", "https://x.com/mattlefun/status/1983578928565645742"],
  "2025-10-30": ["https://x.com/mattlefun/status/1983886458399367645"],
  "2025-10-31": ["https://x.com/mattlefun/status/1984201551708377586", "https://x.com/mattlefun/status/1984224531930657255"],
  "2025-11-01": ["https://x.com/mattlefun/status/1984492550884114513"],
  "2025-11-03": ["https://x.com/mattlefun/status/1985209910804836784", "https://x.com/mattlefun/status/1985393780695196080"],
  "2025-11-04": ["https://x.com/mattlefun/status/1985637611554422999", "https://x.com/mattlefun/status/1985659115008639248", "https://x.com/mattlefun/status/1985739430599311682"],
  "2025-11-05": ["https://x.com/mattlefun/status/1986011599703007530", "https://x.com/mattlefun/status/1986023580518478312", "https://x.com/mattlefun/status/1986135120013893910", "https://x.com/mattlefun/status/1986140066935415163", "https://x.com/mattlefun/status/1986155738667094507"],
  "2025-11-06": ["https://x.com/mattlefun/status/1986396350410350958", "https://x.com/mattlefun/status/1986454404783088009"],
  "2025-11-08": ["https://x.com/mattlefun/status/1986998230052421975", "https://x.com/mattlefun/status/1987143966853370279"],
  "2025-11-09": ["https://x.com/mattlefun/status/1987368891836981433", "https://x.com/mattlefun/status/1987490358305964183"],
  "2025-11-10": ["https://x.com/mattlefun/status/1987922608512504049"],
  "2025-11-11": ["https://x.com/mattlefun/status/1988136370326688227", "https://x.com/mattlefun/status/1988196038801526825", "https://x.com/mattlefun/status/1988215140945129862", "https://x.com/mattlefun/status/1988232368365400184", "https://x.com/mattlefun/status/1988237778916896843"],
  "2025-11-12": ["https://x.com/mattlefun/status/1988474528159379880", "https://x.com/mattlefun/status/1988502902831542358", "https://x.com/mattlefun/status/1988562304867385567", "https://x.com/mattlefun/status/1988627410724520245", "https://x.com/mattlefun/status/1988665272677593421", "https://x.com/mattlefun/status/1988682646671749499"],
  "2025-11-13": ["https://x.com/mattlefun/status/1988835924214497439"],
  "2025-11-14": ["https://x.com/mattlefun/status/1989283486897947066"],
  "2025-11-17": ["https://x.com/mattlefun/status/1990442544283672970"],
  "2025-11-18": ["https://x.com/mattlefun/status/1990695760606998958"],
  "2025-11-21": ["https://x.com/mattlefun/status/1991820070440566991", "https://x.com/mattlefun/status/1991897585154711691", "https://x.com/mattlefun/status/1991915992667365604"],
  "2025-11-22": ["https://x.com/mattlefun/status/1992192506323480951", "https://x.com/mattlefun/status/1992228661647569084"],
  "2025-11-24": ["https://x.com/mattlefun/status/1992900508043149397", "https://x.com/mattlefun/status/1992994728762310904"],
  "2025-11-25": ["https://x.com/mattlefun/status/1993228313007923281", "https://x.com/mattlefun/status/1993346734932828215"],
  "2025-11-26": ["https://x.com/mattlefun/status/1993537783710072869", "https://x.com/mattlefun/status/1993687345363607657", "https://x.com/mattlefun/status/1993711353497026841"],
  "2025-11-27": ["https://x.com/mattlefun/status/1993908236089741647", "https://x.com/mattlefun/status/1993939441162113212", "https://x.com/mattlefun/status/1993984907857875249"],
  "2025-11-28": ["https://x.com/mattlefun/status/1994257898302828939", "https://x.com/mattlefun/status/1994336469406675368"],
  "2025-11-29": ["https://x.com/mattlefun/status/1994626914112393399", "https://x.com/mattlefun/status/1994713294188478767"],
  "2025-12-01": ["https://x.com/mattlefun/status/1995371382453244002", "https://x.com/mattlefun/status/1995392908904604145"],
  "2025-12-04": ["https://x.com/mattlefun/status/1996460593600201110"],
  "2025-12-05": ["https://x.com/mattlefun/status/1996809814065008764"],
  "2025-12-06": ["https://x.com/mattlefun/status/1997331430989562219"],
  "2025-12-09": ["https://x.com/mattlefun/status/1998324912830730715", "https://x.com/mattlefun/status/1998434119236346340"],
  "2025-12-10": ["https://x.com/mattlefun/status/1998781995674165444"],
  "2025-12-16": ["https://x.com/mattlefun/status/2000856642410496378"],
  "2025-12-17": ["https://x.com/mattlefun/status/2001235459285114962", "https://x.com/mattlefun/status/2001290808386003254"],
  "2025-12-18": ["https://x.com/mattlefun/status/2001599612407480646"],
  "2025-12-19": ["https://x.com/mattlefun/status/2001924826475434096", "https://x.com/mattlefun/status/2001932374712684615", "https://x.com/mattlefun/status/2002067491330343045"],
  "2025-12-20": ["https://x.com/mattlefun/status/2002249589756485770", "https://x.com/mattlefun/status/2002313480750461008"],
  "2025-12-22": ["https://x.com/mattlefun/status/2002969129280586153", "https://x.com/mattlefun/status/2002989851592065295", "https://x.com/mattlefun/status/2003032529205338396", "https://x.com/mattlefun/status/2003118886670283080"],
  "2025-12-24": ["https://x.com/mattlefun/status/2003806257942306961", "https://x.com/mattlefun/status/2003853382847791589"],
  "2025-12-26": ["https://x.com/mattlefun/status/2004451928345096404"],
  "2025-12-30": ["https://x.com/mattlefun/status/2005965284683964732"],
  "2025-12-31": ["https://x.com/mattlefun/status/2006209985303478734", "https://x.com/mattlefun/status/2006226521124696173", "https://x.com/mattlefun/status/2006309185869492472", "https://x.com/mattlefun/status/2006394523182882882", "https://x.com/mattlefun/status/2006406827660161097", "https://x.com/mattlefun/status/2006470424767443098"],
  "2026-01-02": ["https://x.com/mattlefun/status/2007018154300674484"],
  "2026-01-07": ["https://x.com/mattlefun/status/2008866944674627710"],
  "2026-01-08": ["https://x.com/mattlefun/status/2009134516372381848", "https://x.com/mattlefun/status/2009267699659231346"],
  "2026-01-11": ["https://x.com/mattlefun/status/2010315892534718742"],
  "2026-01-12": ["https://x.com/mattlefun/status/2010679898759979368", "https://x.com/mattlefun/status/2010744032079847479", "https://x.com/mattlefun/status/2010834174891212910"],
  "2026-01-13": ["https://x.com/mattlefun/status/2010990422039151064", "https://x.com/mattlefun/status/2011045571826762091", "https://x.com/mattlefun/status/2011106090910683208"],
  "2026-01-14": ["https://x.com/mattlefun/status/2011397014073033201"],
  "2026-01-15": ["https://x.com/mattlefun/status/2011758054459801619", "https://x.com/mattlefun/status/2011792436285358230", "https://x.com/mattlefun/status/2011844085255225809"],
  "2026-01-16": ["https://x.com/mattlefun/status/2011979268692328533", "https://x.com/mattlefun/status/2012014188819071064", "https://x.com/mattlefun/status/2012121455790801246"],
  "2026-01-17": ["https://x.com/mattlefun/status/2012469340936040578"],
  "2026-01-19": ["https://x.com/mattlefun/status/2013101544141398068"],
  "2026-01-20": ["https://x.com/mattlefun/status/2013402833018855864"],
  "2026-01-21": ["https://x.com/mattlefun/status/2013841770170220844", "https://x.com/mattlefun/status/2013991183853449624"],
  "2026-01-22": ["https://x.com/mattlefun/status/2014201604703244652", "https://x.com/mattlefun/status/2014222285226627582", "https://x.com/mattlefun/status/2014280230597501016"],
  "2026-01-23": ["https://x.com/mattlefun/status/2014565614044774568", "https://x.com/mattlefun/status/2014575424270172350"],
  "2026-01-26": ["https://x.com/mattlefun/status/2015606743427170750"],
  "2026-01-27": ["https://x.com/mattlefun/status/2016102263782346826", "https://x.com/mattlefun/status/2016179720623394845"],
  "2026-01-29": ["https://x.com/mattlefun/status/2016718020564103345", "https://x.com/mattlefun/status/2016736893820686844"],
  "2026-01-31": ["https://x.com/mattlefun/status/2017470809577800042"],
  "2026-02-01": ["https://x.com/mattlefun/status/2017824712605511988"],
  "2026-02-02": ["https://x.com/mattlefun/status/2018276377439748518"],
  "2026-02-09": ["https://x.com/mattlefun/status/2020770598226735292", "https://x.com/mattlefun/status/2020832629298467293"],
  "2026-02-11": ["https://x.com/mattlefun/status/2021506975142756731"],
  "2026-02-14": ["https://x.com/mattlefun/status/2022585956768059481"],
  "2026-02-16": ["https://x.com/mattlefun/status/2023416531942826305"],
  "2026-02-22": ["https://x.com/mattlefun/status/2025575792416346338", "https://x.com/mattlefun/status/2025674288079229263"],
  "2026-02-24": ["https://x.com/mattlefun/status/2026255064663466417"],
  "2026-02-26": ["https://x.com/mattlefun/status/2026853779434516765"],
  "2026-02-27": ["https://x.com/mattlefun/status/2027352450722844902"],
  "2026-02-28": ["https://x.com/mattlefun/status/2027560734176219589", "https://x.com/mattlefun/status/2027652489881780422"],
};

// Mattle video clips (one per notable post) for the Collect video line.
const MATTLE_VIDEOS = [
  "/Mattle-fun/Videos-Line/1951854332829413702_1.mp4",
  "/Mattle-fun/Videos-Line/1952661829932494985_1.mp4",
  "/Mattle-fun/Videos-Line/1953406365134889406_1.mp4",
  "/Mattle-fun/Videos-Line/1956290623423529154_1.mp4",
  "/Mattle-fun/Videos-Line/1956307329336393794_1.mp4",
  "/Mattle-fun/Videos-Line/1962463113200152888_1.mp4",
  "/Mattle-fun/Videos-Line/1967921418575958376_1.mp4",
  "/Mattle-fun/Videos-Line/1973415224637268231_1.mp4",
  "/Mattle-fun/Videos-Line/1975826764292366508_1.mp4",
  "/Mattle-fun/Videos-Line/1977607732363657455_1.mp4",
  "/Mattle-fun/Videos-Line/1977977506168021498_1.mp4",
  "/Mattle-fun/Videos-Line/1982839647920390435_1.mp4",
  "/Mattle-fun/Videos-Line/1983547047287591387_1.mp4",
  "/Mattle-fun/Videos-Line/1986011599703007530_1.mp4",
  "/Mattle-fun/Videos-Line/1988682646671749499_1.mp4",
  "/Mattle-fun/Videos-Line/1992900508043149397_1.mp4",
  "/Mattle-fun/Videos-Line/1997331430989562219_1.mp4",
  "/Mattle-fun/Videos-Line/2002067491330343045_1.mp4",
  "/Mattle-fun/Videos-Line/2006226521124696173_1.mp4",
  "/Mattle-fun/Videos-Line/2012014188819071064_1.mp4",
  "/Mattle-fun/Videos-Line/2041190651749155007_1.mp4",
  "/Mattle-fun/Videos-Line/2062036365735579800_1.mp4",
];

// Mattle marquee images (under the video line in the Collect section).
const MATTLE_MARQUEE = [
  "/Mattle-fun/Marquee/1951484440464507043_1.jpg",
  "/Mattle-fun/Marquee/1968685929801072653_1.jpg",
  "/Mattle-fun/Marquee/1969979086757073329_2.jpg",
  "/Mattle-fun/Marquee/1973327027198677332_1.jpg",
  "/Mattle-fun/Marquee/1980840741082657025_1.jpg",
  "/Mattle-fun/Marquee/1990695760606998958_2.png",
  "/Mattle-fun/Marquee/1994336469406675368_1.jpg",
  "/Mattle-fun/Marquee/1998434119236346340_1.jpg",
  "/Mattle-fun/Marquee/2001599612407480646_1.jpg",
  "/Mattle-fun/Marquee/2001932374712684615_1.jpg",
  "/Mattle-fun/Marquee/2002313480750461008_1.jpg",
  "/Mattle-fun/Marquee/2002969129280586153_1.jpg",
  "/Mattle-fun/Marquee/2002989851592065295_2.jpg",
  "/Mattle-fun/Marquee/2003853382847791589_1.jpg",
  "/Mattle-fun/Marquee/2006226521124696173_2.jpg",
  "/Mattle-fun/Marquee/2006470424767443098_1.jpg",
  "/Mattle-fun/Marquee/2008866944674627710_1.jpg",
  "/Mattle-fun/Marquee/2010744032079847479_1.jpg",
  "/Mattle-fun/Marquee/2010834174891212910_1.jpg",
  "/Mattle-fun/Marquee/2010990422039151064_1.jpg",
  "/Mattle-fun/Marquee/2011106090910683208_1.jpg",
  "/Mattle-fun/Marquee/2011758054459801619_1.jpg",
  "/Mattle-fun/Marquee/2012469340936040578_1.jpg",
  "/Mattle-fun/Marquee/2013402833018855864_1.jpg",
  "/Mattle-fun/Marquee/2014222285226627582_1.jpg",
  "/Mattle-fun/Marquee/2016736893820686844_1.jpg",
  "/Mattle-fun/Marquee/2017824712605511988_1.jpg",
  "/Mattle-fun/Marquee/2018276377439748518_1.jpg",
  "/Mattle-fun/Marquee/2020770598226735292_1.jpg",
  "/Mattle-fun/Marquee/2020832629298467293_1.jpg",
  "/Mattle-fun/Marquee/2022585956768059481_1.jpg",
  "/Mattle-fun/Marquee/2023416531942826305_2.jpg",
  "/Mattle-fun/Marquee/2025575792416346338_2.jpg",
  "/Mattle-fun/Marquee/2025674288079229263_1.jpg",
  "/Mattle-fun/Marquee/2026255064663466417_1.jpg",
  "/Mattle-fun/Marquee/2026853779434516765_1.jpg",
  "/Mattle-fun/Marquee/2027352450722844902_1.jpg",
  "/Mattle-fun/Marquee/2057405409699524975_2.jpg",
];

// Lora X posts per day (dated by snowflake id from lorafinance_tweets.csv).
const LORA_POSTS = {
  "2025-12-08": ["https://x.com/LoraFinance/status/1998060908073865409"],
  "2025-12-09": ["https://x.com/LoraFinance/status/1998432780963774842"],
  "2025-12-10": ["https://x.com/LoraFinance/status/1998786224723574869"],
  "2025-12-11": ["https://x.com/LoraFinance/status/1999152246387540384"],
  "2025-12-15": ["https://x.com/LoraFinance/status/2000604556049199575"],
  "2025-12-16": ["https://x.com/LoraFinance/status/2000983793524777466"],
  "2025-12-17": ["https://x.com/LoraFinance/status/2001352390075891950", "https://x.com/LoraFinance/status/2001348658026156388"],
  "2025-12-19": ["https://x.com/LoraFinance/status/2002061973404455369"],
  "2025-12-24": ["https://x.com/LoraFinance/status/2003861511207256276"],
  "2026-01-06": ["https://x.com/LoraFinance/status/2008566896636162068"],
  "2026-01-08": ["https://x.com/LoraFinance/status/2009353905596190978"],
  "2026-01-09": ["https://x.com/LoraFinance/status/2009686091289505951"],
  "2026-01-10": ["https://x.com/LoraFinance/status/2010035038080143582"],
  "2026-01-12": ["https://x.com/LoraFinance/status/2010780640380404011"],
  "2026-01-16": ["https://x.com/LoraFinance/status/2012086541175419201"],
  "2026-01-18": ["https://x.com/LoraFinance/status/2012925124270322029"],
  "2026-01-22": ["https://x.com/LoraFinance/status/2014371087203946833"],
  "2026-01-23": ["https://x.com/LoraFinance/status/2014709175746756828"],
  "2026-02-02": ["https://x.com/LoraFinance/status/2018403198281875691"],
  "2026-03-03": ["https://x.com/LoraFinance/status/2028840508643275195"],
  "2026-03-11": ["https://x.com/LoraFinance/status/2031767165871984890"],
  "2026-03-12": ["https://x.com/LoraFinance/status/2032146967552508311"],
  "2026-03-13": ["https://x.com/LoraFinance/status/2032507761565765771", "https://x.com/LoraFinance/status/2032326458065240212"],
  "2026-03-14": ["https://x.com/LoraFinance/status/2032873591340146754"],
  "2026-03-15": ["https://x.com/LoraFinance/status/2033227391703883948"],
  "2026-03-16": ["https://x.com/LoraFinance/status/2033565880211349539"],
  "2026-03-17": ["https://x.com/LoraFinance/status/2033937121271288178"],
  "2026-03-18": ["https://x.com/LoraFinance/status/2034312525421113435", "https://x.com/LoraFinance/status/2034197019766702507"],
  "2026-03-19": ["https://x.com/LoraFinance/status/2034759729504026758", "https://x.com/LoraFinance/status/2034720809789673582"],
  "2026-03-22": ["https://x.com/LoraFinance/status/2035785941177233822"],
  "2026-03-25": ["https://x.com/LoraFinance/status/2036842641409847709"],
  "2026-03-26": ["https://x.com/LoraFinance/status/2037250231969239358"],
  "2026-03-27": ["https://x.com/LoraFinance/status/2037612702127047142"],
  "2026-03-28": ["https://x.com/LoraFinance/status/2037989181205709044"],
  "2026-03-29": ["https://x.com/LoraFinance/status/2038278418761204210"],
  "2026-04-02": ["https://x.com/LoraFinance/status/2039666864541020454"],
  "2026-04-04": ["https://x.com/LoraFinance/status/2040486160594841801"],
  "2026-04-05": ["https://x.com/LoraFinance/status/2040858724487856130"],
  "2026-04-07": ["https://x.com/LoraFinance/status/2041564703386956073"],
  "2026-04-11": ["https://x.com/LoraFinance/status/2043106032151597187", "https://x.com/LoraFinance/status/2043038679996993824"],
  "2026-04-17": ["https://x.com/LoraFinance/status/2045124395770020165"],
};

// Lora video clips + marquee images (fill the Lora-finance/Branding folders).
const LORA_VIDEOS = [
  "/Lora-finance/Branding/Videos-Line/1998060908073865409_1.mp4",
  "/Lora-finance/Branding/Videos-Line/1998432780963774842_1.mp4",
  "/Lora-finance/Branding/Videos-Line/2000604556049199575_1.mp4",
  "/Lora-finance/Branding/Videos-Line/2008566896636162068_1.mp4",
  "/Lora-finance/Branding/Videos-Line/2010035038080143582_1.mp4",
  "/Lora-finance/Branding/Videos-Line/2010780640380404011_1.mp4",
  "/Lora-finance/Branding/Videos-Line/2012086541175419201_1.mp4",
  "/Lora-finance/Branding/Videos-Line/2012925124270322029_1.mp4",
  "/Lora-finance/Branding/Videos-Line/2014709175746756828_1.mp4",
  "/Lora-finance/Branding/Videos-Line/2028840508643275195_1.mp4",
  "/Lora-finance/Branding/Videos-Line/2031767165871984890_1.mp4",
  "/Lora-finance/Branding/Videos-Line/2034720809789673582_1.mp4",
  "/Lora-finance/Branding/Videos-Line/2041564703386956073_1.mp4",
];
const LORA_MARQUEE = [
  "/Lora-finance/Branding/Marquee/1998786224723574869_1.jpg",
  "/Lora-finance/Branding/Marquee/2000604566849519683_1.jpg",
  "/Lora-finance/Branding/Marquee/2000604570825732536_1.jpg",
  "/Lora-finance/Branding/Marquee/2000983793524777466_1.jpg",
  "/Lora-finance/Branding/Marquee/2002061973404455369_1.jpg",
  "/Lora-finance/Branding/Marquee/2014371087203946833_1.jpg",
  "/Lora-finance/Branding/Marquee/2014709175746756828_2.jpg",
  "/Lora-finance/Branding/Marquee/2018403223976173897_1.jpg",
  "/Lora-finance/Branding/Marquee/2032146967552508311_1.jpg",
  "/Lora-finance/Branding/Marquee/2032326458065240212_2.jpg",
  "/Lora-finance/Branding/Marquee/2032873591340146754_1.jpg",
  "/Lora-finance/Branding/Marquee/2033227391703883948_1.jpg",
  "/Lora-finance/Branding/Marquee/2033565880211349539_1.jpg",
  "/Lora-finance/Branding/Marquee/2033937121271288178_1.jpg",
  "/Lora-finance/Branding/Marquee/2035785941177233822_1.jpg",
  "/Lora-finance/Branding/Marquee/2036842641409847709_1.jpg",
  "/Lora-finance/Branding/Marquee/2037250231969239358_1.jpg",
  "/Lora-finance/Branding/Marquee/2038278418761204210_1.jpg",
  "/Lora-finance/Branding/Marquee/2040486160594841801_1.jpg",
  "/Lora-finance/Branding/Marquee/2040858724487856130_1.jpg",
];

// Portfolio stacking cards. Edit/extend freely — the effect adapts to the
// number of cards. Each card is a single tall panel you scroll through.
const PORTFOLIO_CARDS = [
  {
    title: "Boltrade.ai - Marketing Co-founder",
    accent: "bg-zinc-800",
    banner: "/Boltrade-banner.png",
    // 4 sequences for the branding story clause.
    brandingSequences: [
      // Sequence 1 — ideas & references
      [
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/First-sequence/image%20109%20(1).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/First-sequence/image%20110.png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/First-sequence/image%20111%20(2).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/First-sequence/image%20112%20(1).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/First-sequence/image%20117%20(2).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/First-sequence/image%205%20(2).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/First-sequence/image%2073%20(1).png",
      ],
      // Sequence 2 — memes & cosmic
      [
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Second-sequence/web/Cover%20(2)%202.png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Second-sequence/web/Cover%20(2)%204.png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Second-sequence/image%2022%20(1).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Second-sequence/image%205%20(1).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Second-sequence/image%206%20(1).png",
      ],
      // Sequence 3 — mascot
      [
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Third-sequence/panel_1_top_left_web.jpg",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Third-sequence/panel_2_top_right_web.jpg",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Third-sequence/panel_3_bottom_left_web.jpg",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Third-sequence/panel_4_bottom_right_web.jpg",
      ],
      // Sequence 4 — hope
      [
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Forth-sequence/chalker99_httpss.mj.runDW_U8DvCyPw_A_vibrant_and_dynamic_bann_40eda56b-3bbb-406c-9c09-1052b11d92d4_3%20(1).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Forth-sequence/chalker99_httpss.mj.runDW_U8DvCyPw_A_vibrant_and_dynamic_bann_f199e54b-67d2-429d-8bcc-ca193fdd1e45_0%20(3).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Forth-sequence/chalker99_httpss.mj.runDW_U8DvCyPw_A_vibrant_and_dynamic_bann_f199e54b-67d2-429d-8bcc-ca193fdd1e45_2%20(1).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Forth-sequence/chalker99_httpss.mj.runaUGjk6c_tBU_A_colorful_and_energetic_b_1990bedb-c23a-4513-b1e8-fd21eb91da4e_2%20(2).png",
      ],
    ],
    // ── VISUAL BRANDING story text (edit these words freely) ──
    brandingWords: {
      a: "From ideas", // before sequence 1 & 2
      b: "to", // end of line 1
      c: "a mascot", // start of line 2
      d: "of hope", // between sequence 3 & 4
    },
    // Paragraph ABOVE the marquee (news bar).
    brandingText1:
      "Identified that our target users are meme-ors, degens, high-tech driven, ape, we did competitor audit and meme audit to find the same patterns representing them. We chose to make a clock mascot, and ended up with a Cat Clock. The key visual is crafted with AI but well-driven based on moodboard, style, archetype, color, and domain.  ",

    // Performance Campaigns — checkpoint timeline.
    campaigns: [
      {
        title: "Reputation building",
        points: [
          'SEO optimization using "meme tickers" — everyday, every trend we post.',
          "Real usecases to solve pain points and greed activation.",
        ],
        images: [
          "/Boltrade-ai/Performance-campaign/Checkpoint-1/AD_4nXc6ahTjvbGgoBBET4W5ptXJaVsSSQwL0lU53yyEYzKtwpDMjQZD3kHGtfBCpqy3kD7y9UyqRyo91aNqylv4w6Jt-8Jzn32dLclHrIvxeiX_Nf5ezvmMQaQhEkM5F3Uzc8pHxwMkbw.png",
          "/Boltrade-ai/Performance-campaign/Checkpoint-1/AD_4nXdi7mJwj9qLJktH6-e62s0ggg-CQdT6StnhATHWhu06_ORK40SWjr5NnjIRd4fS61YgQgx2Jhw75j28gk_Gzo0mWd3k2vfjBgHblXRud_GV6Ls6pwjICk7yg4G0rSaeG3I7F5Dfag%20(1).png",
          "/Boltrade-ai/Performance-campaign/Checkpoint-1/AD_4nXfQBnXRqsrisTkB0mGZX6oxNo3HrXuAeEd1YzXg26QMiAHuvfqghQAe6bhBJaN_Yihc_74S3PXZgrvbMOXWjwDanW60PdSQbwPFckAzHDVh_fd8980VYU1wmrJQ83IEZwGCMS7vNw.png",
        ],
        paragraph:
          "In this phase, building trust and getting out of hell elo is everything. We focus on selling a wealth-making dream for people using signals and proofs of constant wins. In result, we got out of <1000 views hell elo.",
      },
      {
        title: "Hackathon",
        points: [
          "Introduction of C.A.T as the engine behind the magic.",
          "Convert the previous reputation and traffic into fans with branding visuals and contents.",
        ],
        images: [
          "/Boltrade-ai/Performance-campaign/Checkpoint-2/20260409-223226.jpeg",
          "/Boltrade-ai/Performance-campaign/Checkpoint-2/Screenshot-2025-05-31-at-15.49.44.png",
          "/Boltrade-ai/Performance-campaign/Checkpoint-2/Solana-AI-Hackathon.jpg",
        ],
        paragraph:
          "This phase, it takes trials to farm traffic and leverage as much as possible. This phase also loops people in a content format and an emotional attachment. This phase, our traffic rose to 10k plus per post. Hackathon is a REALLY GREAT way to gain external traction, prepare for amplification.",
      },
      {
        title: "Token launch",
        points: [
          "Mostly timing.",
          "Measurement of traction to launch.",
        ],
        images: [
          "/Boltrade-ai/Performance-campaign/Checkpoint-3/Phase-1_-80-1.png",
          "/Boltrade-ai/Performance-campaign/Checkpoint-3/Phase-2_-90%20(1).png",
          "/Boltrade-ai/Performance-campaign/Checkpoint-3/Screenshot-2025-05-31-at-15.27.05.png",
        ],
        paragraph:
          "In this phase, when everyone is familiar to the content format, loop them in an emotional oppression, like a spring, optimize distribution channels with several obtainable partners as well!",
      },
    ],
    // Two pull-quotes shown above the Performance Campaigns section.
    campaignQuotes: (
      <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-center">
        <blockquote className="flex-1 rounded-2xl border-l-4 border-emerald-400 bg-white/[0.03] p-8 text-xl leading-relaxed text-white/75">
          <p>Our top-performing posts almost always featured:</p>
          <ul className="mt-4 list-disc space-y-1 pl-6 marker:text-emerald-400">
            <li>
              Screenshots from{" "}
              <a
                href="https://app.boltrade.ai"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-300 underline"
              >
                app.boltrade.ai
              </a>
            </li>
            <li>Token explorer links</li>
            <li>Smart wallet addresses + PnL stats</li>
            <li>Dashboard</li>
          </ul>
          <p className="mt-4">
            This made the content non-shill in tone — we show data, not
            opinions. It earned trust fast.
          </p>
        </blockquote>
        <span className="shrink-0 self-center text-5xl font-black text-emerald-400 lg:rotate-0 max-lg:rotate-90">
          →
        </span>
        <blockquote className="flex-1 rounded-2xl border-l-4 border-emerald-400 bg-white/[0.03] p-8 text-xl leading-relaxed text-white/75">
          <p className="text-2xl font-black text-white">
            The Countdown Format = Structured Suspense Engine
          </p>
          <p className="mt-4">
            The 20% → 100% C.A.T Revolution bar worked like an episodic series:
          </p>
          <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-black/50 p-4 font-mono text-base text-emerald-300">
            {`//C.A.T_TRANSMISSION//
⏳ Tick-tock. ▓▓▓▓▓░░░░░ 60%
"//END_TRANSMISSION//"`}
          </pre>
          <p className="mt-4">
            Followers could predict, speculate, and check in daily. Countdown
            created anticipation and stickiness, leading to higher engagement
            and habit-based following.
          </p>
          <ul className="mt-4 space-y-1">
            <li>
              <span className="font-semibold text-white">Hook:</span> Direct
              question to the community
            </li>
            <li>
              <span className="font-semibold text-white">CTA:</span> “Drop ❤️ if
              you agree with C.A.T”
            </li>
            <li>
              <span className="font-semibold text-white">Context:</span>{" "}
              Countdown was at 90%
            </li>
            <li>
              It gamified the narrative: “What&apos;s 90%? Is it the token?”
            </li>
            <li>
              <span className="font-semibold text-white">Timing:</span>{" "}
              Perfectly aligned with product release window
            </li>
          </ul>
        </blockquote>
      </div>
    ),

    // ── VOICE BRANDING story (its OWN text + images) ──
    // Edit the words below, and drop images into the matching folders under
    // public/Boltrade-ai/Branding/Voice-branding/Sequence-1 … Sequence-4,
    // then add their paths to each array (encode spaces as %20).
    voiceWords: {
      a: "From posting proofs",
      b: "to",
      c: "a hope culture",
      d: "",
    },
    voiceSequences: [
      [
        "/Boltrade-ai/Branding/Voice-branding/Sequence-1/20260409-221658.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-1/20260409-223340.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-1/20260409-230501.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-1/20260409-230620.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-1/20260606-032020.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-1/Frame%201597880590.png",
      ],
      [
        "/Boltrade-ai/Branding/Voice-branding/Sequence-2/20260409-222330.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-2/20260409-222507.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-2/20260409-230501.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-2/20260606-023737.jpeg",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-2/AD_4nXdi7mJwj9qLJktH6-e62s0ggg-CQdT6StnhATHWhu06_ORK40SWjr5NnjIRd4fS61YgQgx2Jhw75j28gk_Gzo0mWd3k2vfjBgHblXRud_GV6Ls6pwjICk7yg4G0rSaeG3I7F5Dfag.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-2/AD_4nXfQBnXRqsrisTkB0mGZX6oxNo3HrXuAeEd1YzXg26QMiAHuvfqghQAe6bhBJaN_Yihc_74S3PXZgrvbMOXWjwDanW60PdSQbwPFckAzHDVh_fd8980VYU1wmrJQ83IEZwGCMS7vNw%20(1).png",
      ],
      [
        "/Boltrade-ai/Branding/Voice-branding/Sequence-3/20260409-222834.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-3/20260409-223419.jpeg",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-3/Phase-2_-90.png",
      ],
    ],
    // Paragraph under the Voice Branding story.
    voiceText1:
      "For voice branding, the story is the same. We identified the correct audience, take reference from more than 10 projects doing in memes, trading bot, terminal. Initially, we dug into X algorithm code to find the optimized SEO strategy, provided posts that actually HELP - providing signals with proofs to gain ourselves traction, moving out of the traffic hell. We then run our campaigns with stronger emotional branding, running people and traffic into our emotion loop with unique content format, important milestones, and an oppression strategy.",

    // News-bar marquee images (run continuously under the branding story).
    loopImages: [
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/AVA%201.png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/BOL%206%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/BOL%20NOT%20KAME%202%201%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/Frame%201597880583%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/Frame%201597880586%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/Frame%201597880622%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/Frame%205.png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/MOTION%20BOL%2010%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/MOTION%20BOL%2014.png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/MOTION%20BOL%2017%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/MOTION%20BOL%205%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/MOTION%20BOL%207%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/MOTION%20BOL%208%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/MOTION%20BOL%209%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/%7B5BFB6F3D-0BB4-4BCF-96EF-ACE4E2257F3C%7D%201.png",
    ],
    desc: "Short description of the work and the outcome it drove.",
    context: (
      <>
        Boltrade was{" "}
        <span className="font-semibold text-emerald-300">
          initially a meme signal tool
        </span>
        , made by scraping smart wallets and identify abnormal activities. At
        the time, it was blended among massive wave of trading bots, buried in
        the traffic hell, having no identity and worst, having no idea how to
        market a finished product. Late 2024 and early 2025, everyone was
        craving for AI Agents, and I think I found{" "}
        <span className="font-semibold text-emerald-300">
          that "HOPE"! I changed the entire project into Trading AI-Agent, into hope
        </span>
        , creating an identity for it, and the rest is history. We made it to
        the top of Solana for a day, with a{" "}
        <span className="font-semibold text-white underline decoration-emerald-400 decoration-[3px] underline-offset-[6px]">
          $0 budget.
        </span>
      </>
    ),
    achievementsText: (
      <ul className="max-w-4xl list-disc space-y-14 pl-8 text-2xl leading-loose text-white/70 marker:text-emerald-400">
        <li>
          Top #1 Trending Token status on Dexscreener and Bullx_io, driving
          $110M+ trading volume in 24 hours.
        </li>
        <li>
          Oversaw the successful listing of C.A.T tokens (powered by the
          Boltrade platform) on major exchanges, including KCEX, XT Exchange,
          LBank, BitMart, Gate.io, MEXC, and CoinEx, and on platforms such as
          CoinMarketCap with zero listing budget.
        </li>
        <li>
          Virtuals.io reached out, twice to convince us to launch on them, 10+ tier 2 KOLs everywhere speaks about us, free.
        </li>
      </ul>
    ),
    achievementsImages: [
      "/Boltrade-ai/Achievements/1.jpg",
      "/Boltrade-ai/Achievements/2.jpeg",
      "/Boltrade-ai/Achievements/3.jpg",
      "/Boltrade-ai/Achievements/Gate-MEXC.png",
      "/Boltrade-ai/Achievements/Screenshot-2025-05-31-at-15.42.43.png",
      "/Boltrade-ai/Achievements/Screenshot-2025-05-31-at-15.42.49.png",
      "/Boltrade-ai/Achievements/Screenshot-2025-05-31-at-15.42.59.png",
      "/Boltrade-ai/Achievements/Screenshot-2025-05-31-at-15.43.13.png",
      "/Boltrade-ai/Achievements/Screenshot-2025-05-31-at-15.43.59.png",
    ],
    achievements: [
      { value: "1M+", caption: "Impressions on X within a single week" },
      { value: "26K+", caption: "Active users generated in 30 days" },
      { value: "$110M+", caption: "Day one trading volume w/o MMs or CEXes" },
      { value: "2nd", caption: "Runner up of SendAI Solana Hackathon" },
    ],
  },
  {
    title: "Mattle.fun - Business Co-founder",
    accent: "bg-zinc-800",
    banner: "/Mattlefun-banner.jpeg",
    desc: "Short description of the work and the outcome it drove.",
    context: (
      <>
        Mattle.fun was{" "}
        <span className="font-semibold text-emerald-300">
          initially a Play-to-earn pixel game that has a trading engine
        </span>
        . It has a good presence in the Solana community but from April to
        September, no significant traffic comes in, no way to launch, no
        interest from any VCs/entities. The market was misarable at the time I
        joined, so I decided to sell it to big players,{" "}
        <span className="font-semibold text-emerald-300">
          {`changed it to "gamified trading platform"`}
        </span>
        , and guess what, Solana Mobile, Legion, Dev.fun, Pump.fun came to us
        with offers. All of that because I{" "}
        <span className="font-semibold text-white underline decoration-emerald-400 decoration-[3px] underline-offset-[6px]">
          leveraged the winning of the hackathon, and tweaked the communication
          a little to give some hope!
        </span>
      </>
    ),

    achievements: [
      { value: "5M+", caption: "Impressions on X throughout 7 months" },
      { value: "46K+", caption: "All-time users on our game" },
      { value: "19%", caption: "Users finished their first match in the game" },
      { value: "1st", caption: "Winner of Solana Mobile Hackathon" },
    ],
    // Paragraph under the achievements numbers (full width).
    achievementsText: (
      <p className="text-2xl leading-9 text-white/70">
        For voice branding, the story is the same. We identified the correct
        audience, take reference from more than 10 projects doing in memes,
        trading bot, terminal. Initially, we dug into X algorithm code to find
        the optimized SEO strategy, provided posts that actually HELP - providing
        signals with proofs to gain ourselves traction, moving out of the
        traffic hell. We then run our campaigns with stronger emotional
        branding, running people and traffic into our emotion loop with unique
        content format, important milestones, and an oppression strategy.
      </p>
    ),
    // Scattered, click-to-zoom achievement screenshots (same as Boltrade).
    // Drop the 4 screenshots into public/Mattle-fun/Achievements/ with these names.
    // Show the screenshots as one equal-height row (no text part).
    achievementsRow: true,
    achievementsImages: [
      "/Mattle-fun/Achievements/att.0Hc3B49Tf2h6L64WgzoV90LFvIq3Mv1YfxpqsOBJoro.JPG",
      "/Mattle-fun/Achievements/IMG_8441.PNG",
      "/Mattle-fun/Achievements/att.Q5M3_NJzIwYPed5r8BwwQXUmkcby_EbbjtmTRjcHj6Q.JPG",
      "/Mattle-fun/Achievements/att.GrTyLpQXx83QE1vIGw4FPP4bALNf2Anp5P3BOSAHkY0.JPG",
      "/Mattle-fun/Achievements/1955484471974826390_1.jpg",
      "/Mattle-fun/Achievements/1968014292793598360_1.jpg",
    ],
    // Performance Campaigns — checkpoint timeline (add images later into
    // public/Mattle-fun/Performance-campaign/Checkpoint-{1,2,3}).
    campaigns: [
      {
        label: "Phase 1",
        title: "Public sale",
        points: ["This phase focuses on reputation building, traction building by collabing closely with credible partners like Dev.fun, Solana Mobile, Streamflow, and general Sol Ecosystem.","Doing giveaways to extend the top funnel"],
        images: [
          "/Mattle-fun/Performance-campaign/Checkpoint-1/1968978385738084469_1.png",
          "/Mattle-fun/Performance-campaign/Checkpoint-1/1974060115197399351_1.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-1/1975410355544477967_1.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-1/1975527777110815112_1.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-1/1976595497138987130_1.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-1/1977029834472927509_1.jpg",
        ],
        paragraph:
          "20min all sold out public sale, got reached out by Legion.cc, Pump.fun, Star.fun, and so on.",
      },
      {
        label: "Phase 2",
        title: "TGE",
        points: ["Focus on the TGE with massive campaigns all at once","Doing constant AMAs, inputing as much info for investors as possible"],
        images: [
          "/Mattle-fun/Performance-campaign/Checkpoint-2/1975957601268752439_1.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-2/1978124890231492993_1.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-2/1978697132573172016_1.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-2/1979766424534192480_1.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-2/1985637611554422999_1.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-2/1985659115008639248_1.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-2/1986011599703007530_2.jpg",
        ],
        paragraph:
          "Successful TGE to our target before Public sale buyers dump.",
      },
      {
        label: "Phase 3",
        title: "Maintain",
        points: ["Mostly maintainance campaigns to reserve gun powder","Prepare to buy back tokens at lowest for second pump"],
        images: [
          "/Mattle-fun/Performance-campaign/Checkpoint-3/1992900508043149397_2.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-3/1992994728762310904_1.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-3/1993908236089741647_1.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-3/2001235459285114962_1.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-3/2002067491330343045_2.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-3/2002313480750461008_1.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-3/2002989851592065295_2.jpg",
        ],
        paragraph:
          "We gathered back most of tokens, did the second wave successfully, spending 0 but still not pushing the datas down too bad.",
      },
      {
        label: "Phase 4",
        title: "Last wave",
        points: ["Maintainance, announcing phase 2","Second wave."],
        images: [
          "/Mattle-fun/Performance-campaign/Checkpoint-4/2012469340936040578_1.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-4/2015606743427170750_1.jpg",
          "/Mattle-fun/Performance-campaign/Checkpoint-4/2026853779434516765_1.jpg",
        ],
        paragraph:
          "The game is making us constantly few grands a month, so the founder decided to just leave it here — minor updates, minor maintainance.",
      },
    ],
    // Daily DAU points (random per day, weekly mean = the weekly average),
    // drawn as a line over the impressions bars on the shared daily timeline.
    dauData: MATTLE_DAU_DAILY,
    // Daily Impressions chart, shown under the DAU chart.
    impressionsData: MATTLE_IMPRESSIONS,
    impressionsStart: MATTLE_IMPRESSIONS_START,
    posts: MATTLE_POSTS,
    // Transparent colored phase bands over the highlighted window.
    impressionsBands: [
      { from: "2025-08-01", to: "2025-10-11", color: "bg-red-500/20", phase: "Phase 1", label: "Public sale" },
      { from: "2025-10-12", to: "2025-11-12", color: "bg-yellow-400/20", phase: "Phase 2", label: "TGE" },
      { from: "2025-11-13", to: "2026-01-15", color: "bg-green-500/20", phase: "Phase 3", label: "Maintain" },
      { from: "2026-01-16", to: "2026-02-28", color: "bg-purple-500/20", phase: "Phase 4", label: "Last wave" },
    ],
    // Video line in the Collect section (renamed "Video created" for Mattle).
    videos: MATTLE_VIDEOS,
    collectLabel: "Video created",
    // Image marquee under the video line.
    marquee: MATTLE_MARQUEE,
    // Extra bottom length (~30% more than the default pb-110) for the marquee.
    cardPadB: "pb-143 sm:pb-143",
  },
  {
    title: "Lora.finance - Business Co-founder",
    accent: "bg-zinc-800",
    banner: "/Lorafinance-banner.jpeg",
    desc: "Short description of the work and the outcome it drove.",
    context:
      'Lora.finance was an idea on "renting convexity" created by my tech co-founder. Initially it took him 2 hours to explain each of members in the team what the product is. It was a nerd-idea having no feasible approach at first. I participated this from the beginning, selling crypto "renting convexity" under "trading with no-liquidation" - a universal hope of all traders. We gained massive traffic, nearly a million views in 2 weeks.  ',

    achievements: [
      { value: "700K+", caption: "Impressions within 2 weeks" },
      { value: "30K+", caption: "DAU for 2 straight months" },
      { value: "$1B+", caption: "Testnet trading volume" },
      { value: "39%", caption: "Comeback after day 1 of testnet" },
    ],
    // Achievement screenshots shown as one equal-height row (no text part).
    achievementsRow: true,
    achievementsImages: [
      "/Lora-finance/Achievements/2026-06-09%2020.44.31.jpg",
      "/Lora-finance/Achievements/2026-06-09%2020.46.34.jpg",
      "/Lora-finance/Achievements/2026-06-09%2020.46.44.jpg",
      "/Lora-finance/Achievements/2026-06-09%2020.46.56.jpg",
    ],
    // Editable long paragraph shown below the achievements row.
    achievementsRowText:
      " Even though the project did not come to an end due to internal conflict on company structure and to be honest, all of us was too naive, it was still a good journey. We stopped at testnet to not risk any possibility of losing people's money, knowing that people have used our platform, gamble with it quite alot, like it. ",
    // Branding section: a single headline statement + a small image gallery.
    brandingLine: "A nerd defi product needs a little sprinkle of Hope",
    brandingGallery: {
      img1: "/Lora-finance/Branding/Img-1/IMG_8450.PNG",
      img1Caption:
        "This was the first look of Lora.finance — completely unrelated, hard to understand.",
      img2: "/Lora-finance/Branding/Img-2/IMG_8452.JPG",
      img2Caption:
        "I made the entire logo, UX/UI, brand guideline, and socials — all AI generated.",
      rest: [
        "/Lora-finance/Branding/Rest/2000604566849519683_1.jpg",
        "/Lora-finance/Branding/Rest/2000983793524777466_1.jpg",
        "/Lora-finance/Branding/Rest/2002061973404455369_1.jpg",
        "/Lora-finance/Branding/Rest/2014371087203946833_1.jpg",
      ],
    },
    // Closing line under the branding gallery.
    brandingClosing: 'Framing product into "no-liquidation" — Hope!',
    // Two pull-quotes above Performance Campaigns (no arrow between).
    campaignQuotes: (
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <blockquote className="flex-1 rounded-2xl border-l-4 border-emerald-400 bg-white/[0.03] p-8 text-xl leading-relaxed text-white/75">
          <p className="text-2xl font-black text-white">
            Lora Finance Testnet Is Officially LIVE
          </p>
          <p className="mt-4">
            Waitlist users are in.
            <br />
            The rest are queued.
          </p>
          <p className="mt-4 font-semibold text-white">
            Rent upside. No liquidation. Inevitable.
          </p>
          <p className="mt-4">
            Enter Season 1 →{" "}
            <a
              href="https://testnet.lora.finance"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-300 underline"
            >
              testnet.lora.finance
            </a>
          </p>
        </blockquote>
        <blockquote className="flex-1 rounded-2xl border-l-4 border-emerald-400 bg-white/[0.03] p-8 text-xl leading-relaxed text-white/75">
          <p>Oct 10 liquidated $21b, and Lora is here to fix it.</p>
          <p className="mt-4">
            The first renting upside protocol. No liquidation, ever.
          </p>
          <p className="mt-4 font-semibold text-white">Mark your safety.</p>
          <p className="mt-4">
            <a
              href="https://lora.finance"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-300 underline"
            >
              lora.finance
            </a>
          </p>
        </blockquote>
      </div>
    ),
    // Editable long paragraph shown under the quotes.
    campaignQuotesText:
      "Instead of going for the traditional explaination of new terms, we utilized its functions and the benefits it gave and created No-liquidation term, a very on-point, understandable and hopeful phrase!",
    // Real daily Impressions (from X analytics CSV, from Dec 8 2025). Peak: Jan
    // 16 2026 (170K). All bars blue (no highlight window).
    impressionsData: LORA_IMPRESSIONS,
    impressionsStart: LORA_IMPRESSIONS_START,
    impressionsMax: 200000,
    impressionsBenchmarks: [50000, 100000, 150000, 200000],
    impressionsHighlight: false,
    impressionsXLabels: ["Dec ’25", "Jan", "Feb", "Mar", "Apr", "May", "Jun ’26"],
    impressionsRangeLabel: "Dec 2025 → Jun 2026",
    // X posts per day (hover a bar to see that day's embedded posts).
    posts: LORA_POSTS,
    // Transparent colored phase bands over the chart.
    impressionsBands: [
      { from: "2026-01-06", to: "2026-01-23", color: "bg-red-500/20", phase: "Phase 1", label: "Waitlist" },
      { from: "2026-03-11", to: "2026-04-11", color: "bg-yellow-400/20", phase: "Phase 2", label: "Testnet" },
    ],
    // Checkpoint timeline under the chart (add images later into
    // public/Lora-finance/Performance-campaign/Checkpoint-{1,2}).
    campaigns: [
      {
        label: "Phase 1",
        title: "Waitlist",
        points: [
          "I understand that without traction, regardless of how good your content is, nobody cares!",
          "We had no support starting this project, so we utilized the Waitlist.",
          "Keeping the same format of content for SEO.",
        ],
        images: [
          "/Lora-finance/Performance-campaign/Checkpoint-1/IMG_8453.PNG",
          "/Lora-finance/Performance-campaign/Checkpoint-1/IMG_8454.PNG",
          "/Lora-finance/Performance-campaign/Checkpoint-1/IMG_8455.PNG",
          "/Lora-finance/Performance-campaign/Checkpoint-1/IMG_8456.PNG",
          "/Lora-finance/Performance-campaign/Checkpoint-1/IMG_8457.PNG",
          "/Lora-finance/Performance-campaign/Checkpoint-1/IMG_8458.PNG",
        ], // e.g. "/Lora-finance/Performance-campaign/Checkpoint-1/1.png"
        paragraph:
          "It gave us success, virality, and even high-tier people found, saw, and liked the videos.",
      },
      {
        label: "Phase 2",
        title: "Testnet",
        points: [
          "We ran the testnet into 3 gates.",
          "Each requires them to do tasks — extending the campaign duration and retention rate!",
        ],
        images: [
          "/Lora-finance/Performance-campaign/Checkpoint-2/IMG_8459.PNG",
          "/Lora-finance/Performance-campaign/Checkpoint-2/IMG_8460.PNG",
          "/Lora-finance/Performance-campaign/Checkpoint-2/IMG_8461.PNG",
          "/Lora-finance/Performance-campaign/Checkpoint-2/IMG_8462.PNG",
        ],
        paragraph: "20–30K DAUs every day for two straight months.",
      },
    ],
    // Video line ("Video created") + image marquee in the Collect sections.
    collectLabel: "Video created",
    videos: LORA_VIDEOS,
    marquee: LORA_MARQUEE,
  },
  {
    title: "Other projects",
    accent: "bg-zinc-800",
    banner: "/Other-project-banner.png",
    // Compact card: little content, so end soon after it (no big empty tail).
    cardPadB: "pb-16 sm:pb-16",
    desc: "Short description of the work and the outcome it drove.",
    context: (
      <>
        I have been working in crypto since 2021, with up to 20 projects. My work
        is a lot, and under different roles. I&apos;ll only list several notable
        ones here:{" "}
        {[
          ["gm_dot_ai", "https://x.com/gm_dot_ai"],
          ["k300ventures", "https://x.com/k300ventures"],
          ["TCVNCommunity", "https://x.com/TCVNCommunity"],
          ["BemilGame", "https://x.com/BemilGame"],
        ].map(([handle, url], i, arr) => (
          <span key={handle}>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-emerald-300 hover:underline"
            >
              @{handle}
            </a>
            {i < arr.length - 1 ? ", " : ""}
          </span>
        ))}
      </>
    ),
    achievements: [
      { value: "20M+", caption: "In total impressions across accounts" },
      { value: "1M+", caption: "In total followers" },
  
    ],
  },
];

function pickEyeAsset(dx, dy) {
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 24) {
    return "/cat-eye-top.png";
  }

  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  if (angle >= -150 && angle < -90) {
    return "/cat-eye-top-left.png";
  }

  if (angle >= -90 && angle < -30) {
    return "/cat-eye-top.png";
  }

  if (angle >= -30 && angle < 30) {
    return "/cat-eye-top-right.png";
  }

  if (angle >= 30 && angle < 90) {
    return "/cat-eye-bottom-right.png";
  }

  if (angle >= 90 && angle < 150) {
    return "/cat-eye-bottom.png";
  }

  return "/cat-eye-bottom-left.png";
}

function TypingLogo() {
  const text = "MINH PHAM - SELLING STORY IS OLD. I SELL HOPE.";
  const [displayText, setDisplayText] = useState("");
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout;

    if (!isDeleting && index < text.length) {
      // Typing forward
      timeout = setTimeout(() => {
        setDisplayText(text.slice(0, index + 1));
        setIndex(index + 1);
      }, index === 0 ? 500 : 65);
    } else if (!isDeleting && index === text.length) {
      // Pause after fully typed
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2200);
    } else if (isDeleting && index > 0) {
      // Erasing backward
      timeout = setTimeout(() => {
        setDisplayText(text.slice(0, index - 1));
        setIndex(index - 1);
      }, 35);
    } else if (isDeleting && index === 0) {
      // Pause before typing again
      timeout = setTimeout(() => {
        setIsDeleting(false);
      }, 600);
    }

    return () => clearTimeout(timeout);
  }, [index, isDeleting]);

  return (
    <span className="relative inline-flex items-center whitespace-nowrap">
      {/* Invisible full text reserves a fixed footprint so the navbar never
          reflows as the text types and deletes. */}
      <span aria-hidden="true" className="invisible">
        {text}
      </span>
      {/* Animating text + cursor, overlaid so it doesn't affect layout. */}
      <span className="absolute inset-y-0 left-0 flex items-center whitespace-nowrap">
        <span className="text-emerald-300">{displayText}</span>
        <span className="ml-1 h-5 w-[2px] animate-pulse bg-emerald-300" />
      </span>
    </span>
  );
}

const PLACEHOLDER_PARAGRAPH =
  "For voice branding, the story is the same. We identified the correct audience, take reference from more than 10 projects doing in memes, trading bot, terminal. Initially, we dug into X algorithm code to find the optimized SEO strategy, provided posts that actually HELP - providing signals with proofs to gain ourselves traction, moving out of the traffic hell. We then run our campaigns with stronger emotional branding, running people and traffic into our emotion loop with unique content format, important milestones, and an oppression strategy.";

const DEFAULT_ACHIEVEMENTS = [
  { value: "00", caption: "Short caption" },
  { value: "00", caption: "Short caption" },
  { value: "00", caption: "Short caption" },
  { value: "00", caption: "Short caption" },
];


// Lazily-loaded X (Twitter) embed. Loads widgets.js once on first use; the same
// URL is not re-created across hovers (effect keyed on url), so it stays cheap.
const TWEET_SCALE = 0.5; // render at 50% size
const TWEET_WIDTH = 550; // full widget width before scaling
function TweetEmbed({ url }) {
  const wrapRef = useRef(null);
  const innerRef = useRef(null);
  useEffect(() => {
    const id = (url.match(/status\/(\d+)/) || [])[1];
    const el = innerRef.current;
    if (!id || !el) return;
    let cancelled = false;
    el.innerHTML = "";
    const fitHeight = () => {
      if (!cancelled && wrapRef.current && el) {
        wrapRef.current.style.height = `${el.offsetHeight * TWEET_SCALE}px`;
      }
    };
    const render = () => {
      if (cancelled || !el || !window.twttr?.widgets) return;
      el.innerHTML = "";
      window.twttr.widgets
        .createTweet(id, el, {
          theme: "dark",
          conversation: "none",
          width: TWEET_WIDTH,
          dnt: true,
        })
        // StrictMode double-invokes effects: drop the stale (cancelled) render.
        .then((node) => {
          if (cancelled && node) {
            node.remove();
            return;
          }
          fitHeight();
          // iframe may resize once more after first paint
          setTimeout(fitHeight, 600);
        });
    };
    let s;
    if (window.twttr?.widgets) {
      render();
    } else {
      s = document.getElementById("twitter-wjs");
      if (!s) {
        s = document.createElement("script");
        s.id = "twitter-wjs";
        s.src = "https://platform.twitter.com/widgets.js";
        s.async = true;
        document.body.appendChild(s);
      }
      s.addEventListener("load", render);
    }
    return () => {
      cancelled = true;
      if (s) s.removeEventListener("load", render);
      if (el) el.innerHTML = "";
    };
  }, [url]);
  return (
    <div
      ref={wrapRef}
      className="overflow-hidden"
      style={{ width: TWEET_WIDTH * TWEET_SCALE, minHeight: 60 }}
    >
      <div
        ref={innerRef}
        style={{
          width: TWEET_WIDTH,
          transform: `scale(${TWEET_SCALE})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

// Combo chart on a single shared daily timeline: dense daily Impressions bars
// (left axis, K) + a weekly Avg DAU line overlaid on the SAME x-axis (right
// axis). `line` is the DAU data ([{ week, dau }]); points are placed by date.
// Hovering a COLORED (highlight-window) column shows that day's X post embed.
function ImpressionsChart({
  data = [],
  max = 475000,
  benchmarks = [95000, 190000, 285000, 380000, 475000],
  startDate = "2025-06-08",
  highlightFrom = "2025-08",
  highlightThrough = "2026-02",
  xLabels = ["Jun ’25", "Aug", "Oct", "Dec", "Feb ’26", "Apr", "Jun ’26"],
  rangeLabel = "Jun 2025 → Jun 2026",
  line = [],
  // lineMax 5000 so 1000/2000/3000/4000 land on the 20/40/60/80% impressions
  // gridlines (95K/190K/285K/380K) — shared horizontal lines for both axes.
  lineMax = 5000,
  lineBenchmarks = [1000, 2000, 3000, 4000],
  posts = {},
  highlight = true, // false → every bar blue (no grey split)
  bands = [], // [{ from, to, color }] transparent colored overlays by date range
}) {
  const fmtK = (v) => `${Math.round(v / 1000)}K`;
  const inWindow = (ym) =>
    !highlight || (ym >= highlightFrom && ym <= highlightThrough);
  const start = Date.parse(startDate + "T00:00:00Z");
  const span = Math.max(1, data.length - 1); // total days on the x-axis
  // Map each DAU day onto the same daily timeline as the bars. `on` marks the
  // Aug 2025 – Feb 2026 window (emerald); the rest is drawn grey.
  const pts = line
    .map((d) => {
      const dayIdx = (Date.parse(d.date + "T00:00:00Z") - start) / 86400000;
      const ym = d.date.slice(0, 7);
      return {
        x: (dayIdx / span) * 100,
        y: 100 - Math.min(1, d.dau / lineMax) * 100,
        on: inWindow(ym),
      };
    })
    .filter((p) => p.x >= 0 && p.x <= 100);
  // DAU value keyed by day-index (relative to the impressions start) for hover.
  const dauByDay = {};
  line.forEach((d) => {
    const idx = Math.round((Date.parse(d.date + "T00:00:00Z") - start) / 86400000);
    dauByDay[idx] = d.dau;
  });
  const [hover, setHover] = useState(null);
  const N = data.length;
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(N - 1, Math.floor(rel * N))));
  };
  const hov = hover != null ? data[hover] : null;
  const hovYm =
    hover != null
      ? new Date(start + hover * 86400000).toISOString().slice(0, 10)
      : null;
  const hovDau = hover != null ? dauByDay[hover] : undefined;
  // X post embeds only on the colored (highlight-window) columns. A day can
  // have several posts; show up to POST_CAP and note the rest.
  const POST_CAP = 3;
  const hovUrls =
    hovYm != null && inWindow(hovYm.slice(0, 7)) ? posts[hovYm] || [] : [];
  return (
    <div className="w-full">
      <div className="mb-6 flex items-baseline justify-between text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
        <span>
          Impressions (daily){pts.length > 0 ? " + Avg DAU (weekly)" : ""} —{" "}
          {rangeLabel}
        </span>
      </div>
      <div className="flex gap-3">
        {/* Left Y axis — impressions */}
        <div className="relative h-[80vh] w-12 shrink-0">
          {benchmarks.map((v) => (
            <span
              key={v}
              className="absolute right-0 translate-y-1/2 text-xs font-medium text-white/40"
              style={{ bottom: `${(v / max) * 100}%` }}
            >
              {fmtK(v)}
            </span>
          ))}
          <span className="absolute bottom-0 right-0 translate-y-1/2 text-xs font-medium text-white/40">
            0
          </span>
        </div>
        {/* Plot */}
        <div className="flex-1">
          <div
            className="relative h-[80vh]"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          >
            {/* horizontal benchmark gridlines */}
            {benchmarks.map((v) => (
              <div
                key={v}
                className="absolute inset-x-0 border-t border-white/10"
                style={{ bottom: `${(v / max) * 100}%` }}
              />
            ))}
            {/* cursor tracer — faint vertical light bar over the hovered day */}
            {hover != null && (
              <div
                className="pointer-events-none absolute inset-y-0 z-20 -translate-x-1/2"
                style={{ left: `${((hover + 0.5) / N) * 100}%` }}
              >
                <div className="h-full w-[2px] bg-white/15" />
              </div>
            )}
            {/* tooltip */}
            {hover != null && (
              <div
                className={`pointer-events-none absolute top-2 z-40 w-[330px] whitespace-nowrap rounded-xl border border-white/15 bg-zinc-900/95 px-4 py-3 text-sm shadow-2xl ${
                  hover < N / 2 ? "translate-x-2" : "-translate-x-[calc(100%+0.5rem)]"
                }`}
                style={{ left: `${((hover + 0.5) / N) * 100}%` }}
              >
                <div className="font-semibold text-white/80">{hovYm}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[#7cc6fb]">
                  <span className="inline-block h-2 w-2 rounded-sm bg-[#1d9bf0]" />
                  {hov.toLocaleString()} impressions
                </div>
                {hovDau != null && (
                  <div className="mt-0.5 flex items-center gap-1.5 text-emerald-300">
                    <span className="inline-block h-[2px] w-3 bg-emerald-400" />
                    {hovDau.toLocaleString()} DAU
                  </div>
                )}
                {hovUrls.length > 0 && (
                  <div className="mt-2 space-y-2 border-t border-white/10 pt-2">
                    <div className="text-xs font-medium text-white/50">
                      {hovUrls.length} post{hovUrls.length > 1 ? "s" : ""} this day
                    </div>
                    {hovUrls.slice(0, POST_CAP).map((u) => (
                      <TweetEmbed key={u} url={u} />
                    ))}
                    {hovUrls.length > POST_CAP && (
                      <div className="text-xs text-white/40">
                        +{hovUrls.length - POST_CAP} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="flex h-full items-end gap-px border-b border-white/15">
              {data.map((imp, i) => {
                const h = Math.min(1, imp / max) * 100;
                const ym = new Date(start + i * 86400000)
                  .toISOString()
                  .slice(0, 7);
                const on = inWindow(ym);
                return (
                  <div
                    key={i}
                    title={`${ym} (day ${i + 1}): ${imp.toLocaleString()} impressions`}
                    className="flex-1"
                    style={{ height: `${h}%` }}
                  >
                    <div
                      className={`h-full w-full transition-colors ${
                        hover === i
                          ? on
                            ? "bg-[#7cc6fb]"
                            : "bg-white/60"
                          : on
                            ? "bg-[#1d9bf0]"
                            : "bg-white/25"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
            {/* transparent colored bands over date ranges (drawn over bars) */}
            {bands.map((b, k) => {
              const f = (Date.parse(b.from + "T00:00:00Z") - start) / 86400000;
              const t = (Date.parse(b.to + "T00:00:00Z") - start) / 86400000;
              return (
                <div
                  key={k}
                  className={`pointer-events-none absolute inset-y-0 ${b.color}`}
                  style={{
                    left: `${(f / N) * 100}%`,
                    width: `${((t - f + 1) / N) * 100}%`,
                  }}
                >
                  {(b.phase || b.label) && (
                    <span className="absolute left-1/2 top-3 flex max-w-full -translate-x-1/2 flex-col items-center gap-0.5 px-1 text-center">
                      {b.phase && (
                        <span className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.2em] text-white/90">
                          {b.phase}
                        </span>
                      )}
                      {b.label && (
                        <span className="text-sm font-semibold leading-tight text-white/70">
                          {b.label}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
            {/* Avg DAU line overlay — same timeline, right-axis scale */}
            {pts.length > 0 && (
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {pts.slice(0, -1).map((p, i) => (
                  <line
                    key={i}
                    x1={p.x}
                    y1={p.y}
                    x2={pts[i + 1].x}
                    y2={pts[i + 1].y}
                    stroke={p.on ? "#34d399" : "rgba(255,255,255,0.35)"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
            )}
          </div>
          <div className="mt-3 flex justify-between text-xs font-medium text-white/40">
            {xLabels.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        </div>
        {/* Right Y axis — DAU line scale (only when a line is present) */}
        {pts.length > 0 && (
          <div className="relative h-[80vh] w-12 shrink-0">
            {lineBenchmarks.map((v) => (
              <span
                key={v}
                className="absolute left-0 translate-y-1/2 text-xs font-medium text-white/50"
                style={{ bottom: `${(v / lineMax) * 100}%` }}
              >
                {v.toLocaleString()}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-6 text-sm text-white/55">
        {highlight ? (
          <>
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-5 rounded-sm bg-[#1d9bf0]" />
              Impressions · Aug 2025 – Feb 2026
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-5 rounded-sm bg-white/25" />
              Impressions · outside that window
            </span>
          </>
        ) : (
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-5 rounded-sm bg-[#1d9bf0]" />
            Impressions (daily)
          </span>
        )}
        {pts.length > 0 && (
          <span className="flex items-center gap-2">
            <span className="inline-block h-[2px] w-5 bg-emerald-400" />
            Avg DAU (weekly)
          </span>
        )}
      </div>
    </div>
  );
}

// Fixed pseudo-random tilt + vertical offset per image, so the gallery looks
// scattered (like tossed photos) but stays stable across renders.
const SCATTER_ROTATE = [
  "-rotate-6",
  "rotate-3",
  "rotate-12",
  "-rotate-3",
  "rotate-6",
  "-rotate-12",
  "rotate-2",
  "-rotate-2",
  "rotate-6",
];
const SCATTER_MT = [
  "mt-0",
  "mt-12",
  "mt-4",
  "mt-20",
  "mt-2",
  "mt-16",
  "mt-8",
  "mt-24",
  "mt-6",
];

// Section heading label.
function SectionLabel({ children }) {
  return (
    <p className="text-base font-semibold uppercase tracking-[0.4em] text-emerald-300">
      {children}
    </p>
  );
}

// A dashed placeholder area to fill with images / content later.
function Placeholder({ label, className = "" }) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl border border-dashed border-white/15 text-center text-sm uppercase tracking-[0.3em] text-white/25 ${className}`}
    >
      {label}
    </div>
  );
}

// Fades its children in (with a slight rise) the first time they scroll into
// view. Used for everything on a card except the title + context.
function FadeIn({ children, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[1200ms] ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}


// A small inline looping image frame — sits inside the branding story text.
function InlineLoop({ images, interval = 600, className = "" }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!images || images.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), interval);
    return () => clearInterval(t);
  }, [images, interval]);

  return (
    <span
      className={`relative mx-8 inline-block overflow-hidden rounded-xl border border-white/15 align-middle shadow-lg ${className}`}
    >
      {(images || []).map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          draggable="false"
          decoding="async"
          className={`absolute inset-0 h-full w-full select-none object-cover ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {(!images || images.length === 0) && (
        <span className="flex h-full w-full items-center justify-center font-mono text-xs uppercase tracking-widest text-white/25">
          seq
        </span>
      )}
    </span>
  );
}

// Wrap every occurrence of the word "hope" in a highlight marker.
function highlightHope(text) {
  if (!text) return text;
  return text.split(/(hope)/gi).map((part, i) =>
    part.toLowerCase() === "hope" ? (
      <span
        key={i}
        className="rounded bg-emerald-400/25 px-2 text-emerald-300"
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}

// Editorial branding story — large flowing text with inline looping image
// frames punctuating the narrative.
function BrandingStory({
  sequences = [],
  interval = 600,
  words = {},
  joinB = false, // true = "to" leads clause 2 on wrap; false = ends clause 1
}) {
  // Editable text fragments around the sequence frames.
  const {
    a = "From ideas", // before seq 1 & 2
    b = "to", // after seq 2 (end of line 1)
    c = "a mascot", // before seq 3 (start of line 2)
    d = "of hope", // between seq 3 and seq 4
  } = words;
  const [s1 = [], s2 = [], s3 = [], s4 = []] = sequences;

  // Stick the two clauses together on one line; only right-align the second
  // clause once it actually wraps onto its own line. Pure CSS can't do this
  // (auto-margins spread it on one line), so we measure the wrap.
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const [wrapped, setWrapped] = useState(false);
  useEffect(() => {
    const check = () => {
      const a1 = line1Ref.current;
      const a2 = line2Ref.current;
      if (!a1 || !a2) return;
      setWrapped(a2.offsetTop > a1.offsetTop + 2);
    };
    check();
    const t = setTimeout(check, 150);
    window.addEventListener("resize", check);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
      <span ref={line1Ref} className="flex items-center whitespace-nowrap">
        <span>{highlightHope(a)}</span>
        <InlineLoop images={s1} interval={interval} className="h-[9vw] w-[13.5vw] -rotate-6" />
        <InlineLoop images={s2} interval={interval} className="-ml-[4vw] h-[9vw] w-[13.5vw] rotate-3" />
        {!joinB && <span>{highlightHope(b)}</span>}
      </span>
      <span
        ref={line2Ref}
        className={`flex items-center whitespace-nowrap ${
          wrapped ? "ml-auto" : ""
        }`}
      >
        <span>{highlightHope(joinB ? `${b} ${c}` : c)}</span>
        <InlineLoop images={s3} interval={interval} className="h-[9vw] w-[13.5vw]" />
        <span>{highlightHope(d)}</span>
        {s4.length > 0 && (
          <InlineLoop images={s4} interval={interval} className="h-[9vw] w-[13.5vw]" />
        )}
      </span>
    </div>
  );
}

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.";

// Continuous news-bar marquee of images (seamless loop via duplicated track).
function Marquee({ images, speed = 60 }) {
  if (!images || images.length === 0) return null;
  const track = [...images, ...images];
  return (
    <div className="w-full overflow-hidden">
      <div
        className="flex w-max gap-6"
        style={{ animation: `marquee ${speed}s linear infinite` }}
      >
        {track.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            draggable="false"
            className="h-[42rem] w-auto select-none rounded-xl border border-white/10 object-cover"
          />
        ))}
      </div>
    </div>
  );
}

// A horizontal LINE of videos (uniform height) that snaps to center. ONLY the
// centered clip plays (muted, looping) — the rest stay paused on their first
// frame, so all 51 never play at once (which is what caused the lag).
function VideoLine({ videos = [], height = "h-[75vh]" }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    // Start with the first clip centered (snap centers the rest as you scroll).
    const first = root.querySelector("video");
    if (first)
      root.scrollLeft =
        first.offsetLeft - (root.clientWidth - first.offsetWidth) / 2;
    let onScreen = false;
    const vids = () => root.querySelectorAll("video");
    // Play a clip only when it's BOTH centered AND the strip is on screen;
    // otherwise pause it (so nothing keeps playing behind other cards).
    const sync = () => {
      vids().forEach((v) => {
        if (onScreen && v.dataset.centered === "1") v.play?.().catch(() => {});
        else v.pause?.();
      });
    };
    // Thin central strip → a clip "intersects" only when it's centered.
    const centerIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          e.target.dataset.centered = e.isIntersecting ? "1" : "0";
          if (!e.isIntersecting) e.target.currentTime = 0;
        }
        sync();
      },
      { root, rootMargin: "0px -49% 0px -49%", threshold: 0 },
    );
    // Is the whole strip visible in the page viewport?
    const pageIO = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0].isIntersecting;
        sync();
      },
      { threshold: 0.1 },
    );
    vids().forEach((v) => centerIO.observe(v));
    pageIO.observe(root);
    return () => {
      centerIO.disconnect();
      pageIO.disconnect();
    };
  }, [videos]);
  if (!videos.length) return null;
  const scrollBy = (dir) => {
    const el = scrollRef.current;
    const v = el?.querySelector("video");
    // All clips are the same width, so step by exactly one (+ the gap) so each
    // one lands centered.
    if (el && v) el.scrollBy({ left: dir * (v.offsetWidth + 16), behavior: "smooth" });
  };
  const navBtn =
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-2xl text-white/80 transition hover:border-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-300";
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div
        ref={scrollRef}
        className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[12.5vw] pb-3"
      >
        {videos.map((src) => (
          <video
            key={src}
            src={`${src}#t=0.1`}
            muted
            loop
            playsInline
            preload="metadata"
            className={`${height} w-[75vw] shrink-0 snap-center bg-black object-cover`}
          />
        ))}
      </div>
      {/* fixed controls row under the line */}
      <div className="flex items-center gap-6">
        <button type="button" aria-label="Scroll left" onClick={() => scrollBy(-1)} className={navBtn}>
          ‹
        </button>
        <button type="button" aria-label="Scroll right" onClick={() => scrollBy(1)} className={navBtn}>
          ›
        </button>
      </div>
    </div>
  );
}

// Horizontal checkpoint timeline — numbered nodes on a line, each with a
// title, "+" bullet points, and an overlapping image pile.
function CheckpointLine({ items = [], onZoom }) {
  const cols =
    { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" }[
      items.length
    ] || "lg:grid-cols-3";
  return (
    <div className="relative">
      {/* the connecting line (desktop only) */}
      <div className="absolute left-0 right-0 top-7 hidden h-[2px] bg-white/15 lg:block" />
      {/* Subgrid: each column shares the same 4 row heights (header / bullets /
          images / paragraph), so the paragraphs all line up on the same y. */}
      <div
        className={`relative grid grid-cols-1 gap-14 ${cols} lg:grid-rows-[auto_auto_auto_auto] lg:gap-x-12 lg:gap-y-0`}
      >
        {items.map((cp, i) => (
          <div key={i} className="lg:row-span-4 lg:grid lg:grid-rows-subgrid">
            {/* Row 1 — header */}
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-400 bg-zinc-900 text-2xl font-black text-emerald-300">
                {i + 1}
              </div>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
                {cp.label || `Checkpoint ${i + 1}`}
              </p>
              <h4 className="mt-2 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                {cp.title}
              </h4>
            </div>
            {/* Row 2 — bullets */}
            <ul className="mt-10 space-y-6 text-2xl leading-relaxed text-white/70 lg:mt-0 lg:pt-10">
              {(cp.points || []).map((p, j) => (
                <li key={j} className="flex gap-3">
                  <span className="text-emerald-400">+</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            {/* Row 3 — image grid (wraps within the column, never spills into
                a neighboring phase regardless of how many images there are) */}
            <div className="mt-20 flex flex-wrap content-start gap-2 lg:mt-0 lg:pt-20">
              {(cp.images || []).map((img, k) => {
                const src = typeof img === "string" ? img : img.src;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onZoom?.(src)}
                    className="shrink-0 transition duration-300 hover:scale-105"
                  >
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      draggable="false"
                      className="h-24 w-auto cursor-zoom-in select-none rounded-lg border-2 border-white/20 object-cover shadow-lg"
                    />
                  </button>
                );
              })}
            </div>
            {/* Row 4 — paragraph (aligned across all checkpoints) */}
            <p className="mt-8 self-start text-2xl leading-relaxed text-white/60 lg:mt-0 lg:pt-8">
              <span className="mr-2 font-bold text-emerald-400">→</span>
              {cp.paragraph}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Branding gallery: Img 1 and Img 2 side-by-side at equal height with a caption
// below each; the "rest" sit next to Img 2 as much smaller thumbnails.
function BrandingGallery({ data = {}, onZoom }) {
  const { img1, img1Caption, img2, img2Caption, rest = [] } = data;
  const cap = "mt-4 text-2xl leading-relaxed text-white/80";
  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
      <figure>
        <button type="button" onClick={() => onZoom?.(img1)} className="block">
          <img
            src={img1}
            alt=""
            loading="lazy"
            className="h-[40vh] w-auto cursor-zoom-in select-none object-contain"
          />
        </button>
        <figcaption className={cap}>{img1Caption}</figcaption>
      </figure>
      <span className="shrink-0 self-center text-5xl font-black text-emerald-400 max-lg:rotate-90">
        →
      </span>
      <figure>
        <div className="flex items-start gap-3">
          <button type="button" onClick={() => onZoom?.(img2)} className="shrink-0">
            <img
              src={img2}
              alt=""
              loading="lazy"
              className="h-[40vh] w-auto cursor-zoom-in select-none rounded-xl border border-white/10 object-contain"
            />
          </button>
          <div className="flex flex-col gap-2">
            {rest.map((src, i) => (
              <button key={i} type="button" onClick={() => onZoom?.(src)} className="shrink-0">
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-[9vh] w-auto cursor-zoom-in select-none rounded-md border border-white/10 object-contain"
                />
              </button>
            ))}
          </div>
        </div>
        <figcaption className={cap}>{img2Caption}</figcaption>
      </figure>
    </div>
  );
}

// Justified row of images: all SAME HEIGHT, widths proportional to each image's
// aspect ratio, the whole row fitting one line. Achieved by setting each cell's
// flex-grow to its aspect ratio (measured on load) with flex-basis 0.
function AchievementRow({ images = [], onZoom }) {
  const [ratios, setRatios] = useState({});
  return (
    <div className="flex items-stretch gap-3">
      {images.map((src, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onZoom?.(src)}
          className="min-w-0"
          style={{ flexGrow: ratios[i] || 1, flexBasis: 0 }}
        >
          <img
            src={src}
            alt=""
            loading="lazy"
            draggable="false"
            onLoad={(e) =>
              setRatios((r) => ({
                ...r,
                [i]: e.target.naturalWidth / e.target.naturalHeight || 1,
              }))
            }
            className="h-auto w-full cursor-zoom-in select-none rounded-xl"
          />
        </button>
      ))}
    </div>
  );
}

// A single portfolio card, split into 5 sections you scroll through:
// Title + Context, Achievements, Branding, Performance Campaigns, Collect.
function PortfolioCard({ card }) {
  // The image the user clicked to zoom (null = closed).
  const [zoomed, setZoomed] = useState(null);

  // Close the zoomed image on Escape.
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e) => {
      if (e.key === "Escape") setZoomed(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  return (
    <div
      className={`relative flex min-h-screen w-[96vw] flex-col gap-50 overflow-hidden rounded-[2rem] border border-white/10 ${card.accent} p-10 ${card.cardPadB || "pb-110 sm:pb-110"} shadow-2xl sm:w-[98vw] sm:p-14`}
    >
      {/* Optional full-bleed banner (original aspect ratio). No fade. */}
      {card.banner && (
        <div className="-mx-10 -mt-10 sm:-mx-14 sm:-mt-14">
          <img
            src={card.banner}
            alt={`${card.title} banner`}
            className="block aspect-[3/1] w-full select-none object-cover"
            draggable="false"
          />
        </div>
      )}

      {/* 1 — TITLE + CONTEXT (context below the title, right-aligned). No fade. */}
      <section>
        <h3 className="text-7xl font-black tracking-tight text-white sm:text-9xl">
          {card.title}
        </h3>
        <p className="mt-20 text-2xl leading-9 text-white/70 sm:text-3xl">
          {card.context || PLACEHOLDER_PARAGRAPH}
        </p>
      </section>

      {/* 2 — ACHIEVEMENTS (big numbers + captions, then a paragraph) */}
      <section>
        <FadeIn>
          <SectionLabel>Achievements</SectionLabel>
        </FadeIn>
        <FadeIn className="mt-10 grid grid-cols-2 gap-10 sm:grid-cols-4">
          {(card.achievements || DEFAULT_ACHIEVEMENTS).map((a, idx) => (
            <div key={idx}>
              <div className="text-7xl font-black tracking-tight text-white sm:text-8xl">
                {a.value}
              </div>
              <div className="mt-4 text-3xl leading-9 text-white/60">
                {a.caption}
              </div>
            </div>
          ))}
        </FadeIn>
        {(card.achievementsRow ||
          card.achievementsText ||
          card.achievementsImages) && (
        <FadeIn className="mt-28">
          {/* Equal-height single row of screenshots (no text). */}
          {card.achievementsRow ? (
            <div>
              <AchievementRow
                images={card.achievementsImages}
                onZoom={setZoomed}
              />
              {card.achievementsRowText && (
                <p className="mt-10 text-2xl leading-9 text-white/70">
                  {card.achievementsRowText}
                </p>
              )}
            </div>
          ) : (
          /* Text + the big three (the hero shots). */
          <div
            className={
              card.achievementsImages
                ? "flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16"
                : ""
            }
          >
            <div className={card.achievementsImages ? "lg:w-1/2" : ""}>
              {card.achievementsText || (
                <p className="max-w-3xl text-2xl leading-9 text-white/70">
                  {PLACEHOLDER_PARAGRAPH}
                </p>
              )}
            </div>

            {card.achievementsImages && (
              <div className="lg:w-1/2">
                {/* Big three (the hero shots). */}
                <div className="flex flex-wrap items-start justify-center">
                  {card.achievementsImages.slice(0, 3).map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setZoomed(src)}
                      style={{ zIndex: i }}
                      className={`relative -ml-20 transition duration-300 first:ml-0 hover:z-40 hover:-translate-y-3 hover:scale-105 ${
                        SCATTER_ROTATE[i % SCATTER_ROTATE.length]
                      } ${SCATTER_MT[i % SCATTER_MT.length]}`}
                    >
                      <img
                        src={src}
                        alt=""
                        loading="lazy"
                        className="h-64 w-[22rem] cursor-zoom-in select-none rounded-xl border-2 border-white/20 object-cover shadow-2xl"
                        draggable="false"
                      />
                    </button>
                  ))}
                </div>

                {/* Breadcrumb trail — half size, ~15% overlap, centered under
                    the big three and pulled up over their lower half. */}
                <div className="-mt-20 flex items-start justify-center">
                  {card.achievementsImages.slice(3).map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setZoomed(src)}
                      style={{ zIndex: 20 + i }}
                      className={`relative -ml-10 transition duration-300 first:ml-0 hover:z-40 hover:-translate-y-3 hover:scale-110 ${
                        SCATTER_ROTATE[(i + 1) % SCATTER_ROTATE.length]
                      }`}
                    >
                      <img
                        src={src}
                        alt=""
                        loading="lazy"
                        className="h-48 w-[16.5rem] cursor-zoom-in select-none rounded-lg border-2 border-white/20 object-cover shadow-2xl"
                        draggable="false"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}
        </FadeIn>
        )}
      </section>

      {/* 3 — BRANDING (only rendered for cards with branding content) */}
      {(card.brandingSequences || card.voiceSequences || card.brandingLine) && (
      <section className="space-y-10">
        <FadeIn>
          <SectionLabel>
            {card.figma ? "Visual Branding" : "Branding"}
          </SectionLabel>
        </FadeIn>
        {card.brandingLine ? (
          <>
            <FadeIn>
              <p className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                {highlightHope(card.brandingLine)}
              </p>
            </FadeIn>
            {card.brandingGallery && (
              <FadeIn className="pt-6">
                <BrandingGallery data={card.brandingGallery} onZoom={setZoomed} />
              </FadeIn>
            )}
            {card.brandingClosing && (
              <FadeIn className="pt-4">
                <p className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {highlightHope(card.brandingClosing)}
                </p>
              </FadeIn>
            )}
          </>
        ) : (
          <>
            <FadeIn>
              {card.brandingSequences ? (
                <BrandingStory
                  sequences={card.brandingSequences}
                  words={card.brandingWords}
                  interval={600}
                />
              ) : (
                <Placeholder label="Images" className="h-[55vh]" />
              )}
            </FadeIn>
            {card.brandingSequences && (
              <FadeIn className="pb-10 pt-10">
                <p className="text-2xl leading-relaxed text-white/70">
                  {card.brandingText1 || LOREM}
                </p>
              </FadeIn>
            )}
            {card.figma && (
              <FadeIn className="pt-10">
                <SectionLabel>Voice Branding</SectionLabel>
              </FadeIn>
            )}
            {card.voiceSequences ? (
              <FadeIn>
                <BrandingStory
                  sequences={card.voiceSequences}
                  words={card.voiceWords}
                  interval={600}
                  joinB
                />
              </FadeIn>
            ) : (
              <FadeIn>
                <Placeholder label="Images" className="h-[55vh]" />
              </FadeIn>
            )}
            <FadeIn className="pt-10">
              <p className="text-2xl leading-9 text-white/70">
                {card.voiceText1 || PLACEHOLDER_PARAGRAPH}
              </p>
            </FadeIn>
          </>
        )}
      </section>
      )}

      {/* Pull-quotes (+ optional paragraph), shown above Performance Campaigns */}
      {card.campaignQuotes && (
        <section className="space-y-8">
          <FadeIn>{card.campaignQuotes}</FadeIn>
          {card.campaignQuotesText && (
            <FadeIn>
              <p className="text-2xl leading-9 text-white/70">
                {card.campaignQuotesText}
              </p>
            </FadeIn>
          )}
        </section>
      )}

      {/* 4 — PERFORMANCE CAMPAIGNS (only when there's content) */}
      {(card.campaigns || card.impressionsData || card.dauData) && (
      <section className="space-y-10">
        <FadeIn>
          <SectionLabel>Performance Campaigns</SectionLabel>
        </FadeIn>
        {card.impressionsData && (
          <FadeIn className="pt-8">
            <ImpressionsChart
              data={card.impressionsData}
              startDate={card.impressionsStart}
              max={card.impressionsMax}
              benchmarks={card.impressionsBenchmarks}
              line={card.dauData || []}
              posts={card.posts || {}}
              highlight={card.impressionsHighlight}
              xLabels={card.impressionsXLabels}
              rangeLabel={card.impressionsRangeLabel}
              bands={card.impressionsBands}
            />
          </FadeIn>
        )}
        {card.campaigns ? (
          <FadeIn className="pt-16">
            <CheckpointLine items={card.campaigns} onZoom={setZoomed} />
          </FadeIn>
        ) : (
          !card.dauData &&
          !card.impressionsData && (
            <FadeIn>
              <Placeholder label="Your space" className="h-[75vh]" />
            </FadeIn>
          )
        )}
      </section>
      )}

      {/* 5 — COLLECT (only when there's a marquee or videos) */}
      {(card.loopImages || card.videos) && (
      <section className="space-y-10">
        <FadeIn>
          <SectionLabel>{card.collectLabel || "Collect"}</SectionLabel>
        </FadeIn>
        {card.loopImages ? (
          <FadeIn className="-mx-10 pb-48 pt-6 sm:-mx-14">
            <Marquee images={card.loopImages} speed={60} />
          </FadeIn>
        ) : card.videos ? (
          <FadeIn className="pt-6">
            <VideoLine videos={card.videos} />
          </FadeIn>
        ) : null}
      </section>
      )}

      {/* 6 — COLLECT (image marquee), shown under the video lines */}
      {card.marquee && (
        <section className="space-y-10">
          <FadeIn>
            <SectionLabel>Collect</SectionLabel>
          </FadeIn>
          <FadeIn className="-mx-10 pb-48 pt-6 sm:-mx-14">
            <Marquee images={card.marquee} speed={100} />
          </FadeIn>
        </section>
      )}

      {/* Zoom lightbox — rendered in a portal so it escapes the pinned/
          transformed stage and overlays the whole viewport. */}
      {zoomed &&
        createPortal(
          <div
            onClick={() => setZoomed(null)}
            className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
          >
            <img
              src={zoomed}
              alt=""
              onClick={(e) => e.stopPropagation()}
              className="max-h-[70vh] max-w-[70vw] rounded-xl object-contain shadow-2xl"
            />
          </div>,
          document.body
        )}
    </div>
  );
}

export default function App() {
  const imageRef = useRef(null);
  const [eyeSrc, setEyeSrc] = useState("/cat-eye-top.png");

  // GSAP ScrollTrigger: pin the hero stage, then stack the cards ON TOP of the
  // hero (the cat is the base the cards slide over).
  const stageRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".card");
      if (cards.length === 0 || !stageRef.current) return;

      const pinEl = stageRef.current.querySelector(".cards-pin");

      // Cards are AUTO-HEIGHT (sized by their content). Each one stacks up over
      // ~1 viewport, then you scroll THROUGH its overflow ~1:1, so the timeline
      // adapts to whatever content length each card has — no fixed card height.
      const vh0 = window.innerHeight;
      const overflowUnits = cards.map(
        (card) => Math.max(0, card.offsetHeight - vh0) / vh0
      );

      // Start every card one viewport below the fold (the hero shows first).
      cards.forEach((card) => gsap.set(card, { y: () => window.innerHeight }));

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinEl,
          start: "top top",
          // Total scroll = sum over cards of (1 stack + its overflow), in
          // viewports. Recomputed on refresh so it stays correct on resize.
          end: () => {
            const v = window.innerHeight;
            let units = 0;
            cards.forEach((card) => {
              units += 1 + Math.max(0, card.offsetHeight - v) / v;
            });
            return "+=" + units * v;
          },
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      let at = 0;
      cards.forEach((card, i) => {
        // 1) stack up: slide from below until the card's top hits the top.
        tl.fromTo(
          card,
          { y: () => window.innerHeight },
          { y: 0, duration: 1, ease: "none" },
          at
        );
        // (No scale recede: scaling the covered card lifted its bottom edge,
        // exposing the bottom-most card's animating marquee through the gap.)
        at += 1;

        // 2) scroll through: slide up ~1:1 to reveal the card's bottom.
        const ovr = overflowUnits[i];
        if (ovr > 0.001) {
          tl.to(
            card,
            {
              y: () => -(card.offsetHeight - window.innerHeight),
              duration: ovr,
              ease: "none",
            },
            at
          );
          at += ovr;
        }
      });
    }, stageRef);

    return () => ctx.revert();
  }, []);

  // Eye-tracking: throttle to one layout read per frame (getBoundingClientRect
  // forces a reflow, so doing it on every mousemove janked the whole page), and
  // skip entirely once the hero has scrolled out of view.
  const eyeTickRef = useRef(false);
  function handleMouseMove(event) {
    if (eyeTickRef.current || !imageRef.current) return;
    eyeTickRef.current = true;
    const { clientX, clientY } = event;
    requestAnimationFrame(() => {
      eyeTickRef.current = false;
      const el = imageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
      const catCenterX = rect.left + rect.width * CAT_CENTER.x;
      const catCenterY = rect.top + rect.height * CAT_CENTER.y;
      setEyeSrc(pickEyeAsset(clientX - catCenterX, clientY - catCenterY));
    });
  }

  function handleMouseLeave() {
    setEyeSrc("/cat-eye-top.png");
  }

  return (
    <main
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="min-h-screen overflow-x-clip bg-black text-white"
    >
      <nav className="fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b border-white/10 bg-black/45 px-8 py-5 backdrop-blur-xl sm:px-14 lg:px-20">
        <a
        href="#home"
        className="block w-[390px] font-mono text-sm font-bold tracking-tight text-white sm:text-base"
        >
        <TypingLogo />
        </a>

        <div className="hidden items-center gap-8 text-sm font-semibold text-white/70 md:flex">
          <a href="#portfolio" className="transition hover:text-emerald-300">
            Portfolio
          </a>

          <a href="#contact" className="transition hover:text-emerald-300">
            Contact
          </a>
        </div>
      </nav>

      

      {/* HERO + PORTFOLIO: one pinned stage. The cat hero is the base; the
          portfolio cards stack right on top of it as you scroll. */}
      <section id="home" ref={stageRef} className="relative">
        {/* Anchor for the "Portfolio" nav link. The hero + deck share one pinned
            stage; card 1 is fully shown ~1 viewport into the pin, so the anchor
            sits 100vh down (not at the hero top). */}
        <span
          id="portfolio"
          aria-hidden="true"
          className="absolute left-0"
          style={{ top: "100vh" }}
        />

        {/* This stage gets pinned; cards stack on top of the hero inside it. */}
        <div className="cards-pin relative h-screen w-full overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.16),transparent_55%)]" />

          {/* CAT HERO (the base the cards stack over) */}
          <div className="absolute inset-0 z-10 flex items-end justify-center px-6 pt-20">
            {/* FRONT IMAGE LAYERS (eyes track the cursor) */}
            <div
              ref={imageRef}
              className="relative w-full max-w-[1100px] [@media(max-height:1010px)]:max-w-[800px]"
            >
              <img
                src="/me-background.png"
                alt="Portrait background"
                className="block h-auto w-full select-none"
                draggable="false"
              />

              <img
                src="/cat-hand-idle.png"
                alt="Cat and hands"
                className="pointer-events-none absolute inset-0 h-full w-full select-none"
                draggable="false"
              />

              <img
                src={eyeSrc}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full select-none"
                draggable="false"
              />
            </div>
          </div>

          {/* HERO HEADLINE — split to the edges so the cat sits between the
              words (and never blocks them). Behind the cat (z-0). */}
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center px-10">
            <h1 className="flex w-full flex-col justify-center gap-[3vh] font-black uppercase leading-[0.9] tracking-tight text-white">
              {/* Line 1: "Selling" (left)  …  "story?." (right) */}
              <span className="flex items-center justify-center gap-[14vw] whitespace-nowrap text-[7vw]">
                <span>Selling</span>
                <span className="whitespace-nowrap">
                  <span className="relative inline-block">
                    story
                    {/* Cypherpunk graffiti cross-out over "story". */}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 200 80"
                      fill="none"
                      preserveAspectRatio="none"
                      className="pointer-events-none absolute -bottom-3 -left-4 -right-4 -top-3 -rotate-3 overflow-visible text-emerald-400 [filter:drop-shadow(0_0_16px_rgba(52,211,153,0.75))]"
                    >
                      <path
                        d="M4 16 Q78 44 196 66"
                        stroke="currentColor"
                        className="[stroke-width:clamp(7px,1.7vw,22px)]"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      <path
                        d="M8 68 Q112 32 197 14"
                        stroke="currentColor"
                        className="[stroke-width:clamp(7px,1.7vw,22px)]"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </span>
                  ?
                </span>
              </span>

              {/* Line 2: "I Sell" (left)  …  "hope." (right) */}
              <span className="flex items-center justify-center gap-[14vw] whitespace-nowrap text-[12.5vw]">
                <span>I Sell</span>
                <span className="whitespace-nowrap">
                  <span className="relative inline-block">
                    hope
                    {/* Cypherpunk graffiti double underline under "hope". */}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 200 30"
                      fill="none"
                      preserveAspectRatio="none"
                      className="pointer-events-none absolute -left-3 -right-8 bottom-[-0.18em] h-[0.4em] -rotate-1 overflow-visible text-emerald-400 [filter:drop-shadow(0_0_16px_rgba(52,211,153,0.75))]"
                    >
                      <path
                        d="M3 8 Q92 1 197 9"
                        stroke="currentColor"
                        className="[stroke-width:clamp(6px,1.3vw,18px)]"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      <path
                        d="M5 24 Q108 30 196 21"
                        stroke="currentColor"
                        className="[stroke-width:clamp(6px,1.3vw,18px)]"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                    {/* Hand-drawn one-stroke graffiti star, top-right corner. */}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 100 100"
                      fill="none"
                      className="pointer-events-none absolute -right-[0.3em] -top-[0.2em] h-[0.6em] w-[0.6em] rotate-12 overflow-visible text-yellow-400 [filter:drop-shadow(0_0_10px_rgba(250,204,21,0.85))]"
                    >
                      <path
                        d="M51 7 Q63 47 78 86 Q42 56 5 34 Q50 38 96 36 Q58 64 22 89 Q38 47 52 8 Q57 15 64 20"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
             
                </span>
              </span>
            </h1>
          </div>

          {/* PORTFOLIO CARDS — stack on top of the hero. */}
          {PORTFOLIO_CARDS.map((card, i) => (
            <div
              key={card.title}
              className="card absolute inset-x-0 top-0 flex justify-center"
              style={{ zIndex: 40 + i }}
            >
              <PortfolioCard card={card} />
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT ME — full-bleed: text fills the left half, photo fills the right */}
      <section id="about" className="relative z-10 bg-black py-[5vh]">
        <div className="grid items-stretch lg:grid-cols-2">
          <div className="flex flex-col justify-center px-8 py-40 sm:px-14 lg:px-20">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">
              About me
            </p>
            <h2 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl">
              I turn{" "}
              <span className="rounded bg-red-500/25 px-2 text-red-400">
                early, misunderstood
              </span>{" "}
              products
              <br />
              into{" "}
              <span className="rounded bg-emerald-400/25 px-2 text-emerald-300">
                hope
              </span>{" "}
              people line up for.
            </h2>
            <p className="mt-8 text-2xl leading-9 text-white/70">
              {`I'm Minh, an alumnus of the University of Melbourne and RMIT University, majoring in Finance. I've been working in crypto for 6 years — failing and succeeding multiple times. It taught me that the entire space runs on "hope," and I've spent that time learning to sell it. With me, you won't book pointless KOLs, won't burn tons of money on marketing, and your product will carry a "hopeful" soul.`}
            </p>
          </div>
          <div className="flex min-h-[60vh] items-center justify-center p-6">
            <img
              src="/IMG_8464.JPG"
              alt="Portrait"
              className="aspect-square w-[70%] rounded-3xl object-cover shadow-2xl"
            />
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="border-t border-white/10 bg-black px-8 py-32 sm:px-14 lg:px-20"
      >
        <div className="max-w-7xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">
            Contact
          </p>

          <h2 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
            Let&apos;s build something sellable.
          </h2>

          <a
            href="mailto:pdq.minh63@gmail.com"
            className="mt-10 inline-flex rounded-full bg-white px-6 py-3 font-bold text-black transition hover:scale-105 hover:bg-emerald-300"
          >
            Email Me
          </a>
        </div>
      </section>
    </main>
  );
}