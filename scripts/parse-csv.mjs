// Generic: parse an X analytics CSV → daily Impressions array.
// Usage: node parse-csv.mjs <csvPath> <VAR_PREFIX> [startFrom]
import fs from "node:fs";

const [csvPath, prefix, startFrom] = process.argv.slice(2);
const MONTHS = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

const lines = fs.readFileSync(csvPath, "utf8").split("\n").slice(1);
const byDate = new Map();
for (const line of lines) {
  const m = line.match(/^"[A-Za-z]{3}, ([A-Za-z]{3}) (\d{1,2}), (\d{4})",(\d+),/);
  if (!m) continue;
  const [, mon, day, year, imp] = m;
  byDate.set(`${year}-${MONTHS[mon]}-${String(day).padStart(2, "0")}`, Number(imp));
}
let dates = [...byDate.keys()].sort();
if (startFrom) dates = dates.filter((d) => d >= startFrom);
const start = dates[0];
const end = dates[dates.length - 1];

const out = [];
const startMs = Date.parse(start + "T00:00:00Z");
const endMs = Date.parse(end + "T00:00:00Z");
for (let t = startMs; t <= endMs; t += 86400000)
  out.push(byDate.get(new Date(t).toISOString().slice(0, 10)) ?? 0);

const max = Math.max(...out);
const peakIdx = out.indexOf(max);
const peakDate = new Date(startMs + peakIdx * 86400000).toISOString().slice(0, 10);
console.error(`days=${out.length} range=${start}..${end} max=${max} peak=${peakDate}`);

const rows = [];
for (let i = 0; i < out.length; i += 14)
  rows.push("  " + out.slice(i, i + 14).join(", ") + ",");
process.stdout.write(
  `const ${prefix}_START = "${start}";\nconst ${prefix} = [\n${rows.join("\n")}\n];\n`,
);
