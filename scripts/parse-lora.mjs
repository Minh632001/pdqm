// Parse the X analytics CSV → daily Impressions array for Lora Finance.
import fs from "node:fs";

const CSV = "/Users/admin/Downloads/account_overview_analytics (1).csv";
const MONTHS = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

const lines = fs.readFileSync(CSV, "utf8").split("\n").slice(1);
const byDate = new Map();
for (const line of lines) {
  const m = line.match(/^"[A-Za-z]{3}, ([A-Za-z]{3}) (\d{1,2}), (\d{4})",(\d+),/);
  if (!m) continue;
  const [, mon, day, year, imp] = m;
  const date = `${year}-${MONTHS[mon]}-${String(day).padStart(2, "0")}`;
  byDate.set(date, Number(imp));
}
const START_FROM = "2025-12-08"; // drop the empty leading period before this
const dates = [...byDate.keys()].sort().filter((d) => d >= START_FROM);
const start = dates[0];
const end = dates[dates.length - 1];

// Fill contiguous days from start..end (0 where missing).
const out = [];
const startMs = Date.parse(start + "T00:00:00Z");
const endMs = Date.parse(end + "T00:00:00Z");
for (let t = startMs; t <= endMs; t += 86400000) {
  const d = new Date(t).toISOString().slice(0, 10);
  out.push(byDate.get(d) ?? 0);
}
const max = Math.max(...out);
const peakIdx = out.indexOf(max);
const peakDate = new Date(startMs + peakIdx * 86400000).toISOString().slice(0, 10);

console.error(
  `days=${out.length} range=${start}..${end} max=${max} peak=${peakDate}`,
);
const rows = [];
for (let i = 0; i < out.length; i += 14)
  rows.push("  " + out.slice(i, i + 14).join(", ") + ",");
process.stdout.write(
  `const LORA_IMPRESSIONS_START = "${start}";\nconst LORA_IMPRESSIONS = [\n${rows.join("\n")}\n];\n`,
);
