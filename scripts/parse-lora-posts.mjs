// Build LORA_POSTS (date → [url]) from the tweets CSV, dating each by snowflake.
// Skips replies (is_reply === "True").
import fs from "node:fs";

const CSV = "/Users/admin/Desktop/my-website/public/Lora-finance/lorafinance_tweets.csv";
const TWITTER_EPOCH = 1288834974657n;

// Minimal RFC-4180 CSV parser (handles quoted fields, embedded commas/newlines).
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const rows = parseCSV(fs.readFileSync(CSV, "utf8").replace(/^﻿/, ""));
const header = rows[0];
const iUrl = header.indexOf("url");
const iId = header.indexOf("id");
const iReply = header.indexOf("is_reply");

const byDate = new Map();
let total = 0, replies = 0, min = "9999", max = "0000";
for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  const id = row[iId];
  const url = row[iUrl];
  if (!/^\d+$/.test(id) || !/\/status\/\d+/.test(url || "")) continue;
  if (row[iReply] === "True") { replies++; continue; }
  const ms = (BigInt(id) >> 22n) + TWITTER_EPOCH;
  const date = new Date(Number(ms)).toISOString().slice(0, 10);
  if (date < min) min = date;
  if (date > max) max = date;
  if (!byDate.has(date)) byDate.set(date, []);
  byDate.get(date).push(url);
  total++;
}
const entries = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
console.error(`kept=${total} repliesSkipped=${replies} days=${entries.length} range=${min}..${max}`);
const obj = entries
  .map(([d, list]) => `  "${d}": [${list.map((u) => `"${u}"`).join(", ")}],`)
  .join("\n");
process.stdout.write(`const LORA_POSTS = {\n${obj}\n};\n`);
