// Scrape Wikipedia's chronological "List of wars" pages into data/wars.json,
// merged with the hand-curated rich set in data/curated.json (curated wins on name clash).
// Run: npm run wars
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "node-html-parser";

const PAGES = [
  "List_of_wars:_before_1000",
  "List_of_wars:_1000%E2%80%931499",
  "List_of_wars:_1500%E2%80%931799",
  "List_of_wars:_1800%E2%80%931899",
  "List_of_wars:_1900%E2%80%931944",
  "List_of_wars:_1945%E2%80%931989",
  "List_of_wars:_1990%E2%80%932002",
  "List_of_wars:_2003%E2%80%93present",
  "List_of_wars:_2011%E2%80%93present",
];

const NOW = new Date().getFullYear();

// coarse polity-name -> region map for deriving a theatre when we can
const REGION = [
  ["Europe", /\b(France|French|Germany|German|Prussia|England|English|Britain|British|Scotland|Ireland|Spain|Spanish|Portugal|Italy|Italian|Rome|Roman|Austria|Hungary|Poland|Russia|Russian|Sweden|Norway|Denmark|Netherlands|Dutch|Belgium|Greece|Greek|Serbia|Croatia|Bosnia|Ukraine|Byzantine|Ottoman|Venice|Genoa|Bulgaria|Romania|Czech|Finland|Switzerland|Norman|Saxon|Viking|Papal|Naples|Sardinia|Bohemia)\b/i],
  ["Asia", /\b(China|Chinese|Japan|Japanese|Korea|Korean|India|Indian|Mongol|Mongolia|Vietnam|Cambodia|Laos|Thai|Siam|Burma|Myanmar|Indonesia|Malay|Philippine|Tibet|Afghan|Pakistan|Bangladesh|Sri Lanka|Nepal|Qing|Ming|Han|Tang|Song|Mughal|Persia|Khmer|Manchu|Taiwan)\b/i],
  ["Middle East", /\b(Israel|Israeli|Egypt|Egyptian|Iran|Iranian|Iraq|Iraqi|Syria|Syrian|Lebanon|Jordan|Saudi|Yemen|Arab|Arabia|Turkey|Turkish|Kurd|Palestine|Judea|Assyria|Babylon|Hittite|Sasanian|Umayyad|Abbasid|Caliphate|Seljuk|Mamluk)\b/i],
  ["Africa", /\b(Ethiopia|Ethiopian|Sudan|Somali|Nigeria|Congo|Angola|Mozambique|Zulu|Zimbabwe|Rwanda|Uganda|Kenya|Algeria|Algerian|Morocco|Moroccan|Tunisia|Libya|Mali|Ghana|Ashanti|Boer|Carthage|Carthaginian|Eritrea|Chad|Liberia|Sierra Leone|Ivory Coast|Cameroon)\b/i],
  ["Americas", /\b(United States|U\.S\.|Mexico|Mexican|Canada|Canadian|Brazil|Brazilian|Argentina|Chile|Chilean|Peru|Peruvian|Bolivia|Colombia|Venezuela|Paraguay|Uruguay|Cuba|Cuban|Haiti|Haitian|Aztec|Inca|Maya|Confederate States|Texas|Apache|Sioux|Comanche|Iroquois|Nicaragua|Guatemala|Panama|Ecuador|Gran Colombia)\b/i],
  ["Oceania", /\b(Australia|Australian|New Zealand|Maori|Hawaii|Hawaiian|Samoa|Fiji|Papua|Pacific Islander)\b/i],
];

function deriveRegion(names) {
  for (const n of names) {
    for (const [region, re] of REGION) if (re.test(n)) return region;
  }
  return undefined;
}

function parseYear(raw) {
  if (!raw) return null;
  const s = raw.replace(/\[[^\]]*\]/g, "").trim();
  if (/present|ongoing|today/i.test(s)) return NOW;
  const m = s.match(/(\d{1,4})\s*(BC|BCE)?/i);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  return /bc/i.test(m[2] || "") ? -y : y;
}

function cleanName(s) {
  return s
    .split("\n")[0]
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\(page does not exist\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseBelligerents(cell) {
  if (!cell) return [];
  const lines = cell.text
    .split("\n")
    .map((l) =>
      l
        .replace(/\[[^\]]*\]/g, "")
        .replace(/\([^)]*\)/g, "")
        .replace(/[†*]/g, "")
        .trim()
    )
    .filter(Boolean);
  const out = [];
  for (const l of lines) {
    if (l.length < 2 || l.length > 42) continue;
    if (/^(and|&|others?|various|n\/a)$/i.test(l)) continue;
    if (/(supplied|backed|supported|aided|armed|led|commanded|funded|trained) by|:$/i.test(l)) continue;
    if (/inconclusive|stalemate|indecisive|status quo|unknown|disputed/i.test(l)) continue;
    if (!out.includes(l)) out.push(l);
    if (out.length >= 4) break;
  }
  return out;
}

function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function normName(s) {
  return s.toLowerCase().replace(/^the\s+/, "").replace(/[^a-z0-9]+/g, "");
}

async function fetchPage(page) {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${page}&format=json&prop=text&formatversion=2&redirects=1`;
  const res = await fetch(url, { headers: { "User-Agent": "war-quiz-builder/1.0 (educational)" } });
  if (!res.ok) {
    console.warn(`  ! ${page} -> HTTP ${res.status}`);
    return [];
  }
  const json = await res.json();
  if (!json.parse) {
    console.warn(`  ! ${page} -> no parse`);
    return [];
  }
  const root = parse(json.parse.text);
  const tables = root.querySelectorAll("table.wikitable");
  const wars = [];
  for (const t of tables) {
    for (const tr of t.querySelectorAll("tr")) {
      const cells = tr.querySelectorAll("td");
      if (cells.length < 4) continue;
      const start = parseYear(cells[0].text);
      if (start === null) continue; // not a data row
      const finish = parseYear(cells[1].text) ?? start;
      const nameCell = cells[2];
      const link = nameCell.querySelector("a");
      const name = cleanName(link ? link.text : nameCell.text);
      if (!name || name.length < 3) continue;
      let wiki;
      if (link) {
        const href = link.getAttribute("href") || "";
        if (href.startsWith("/wiki/") && !/does not exist/i.test(link.getAttribute("title") || ""))
          wiki = "https://en.wikipedia.org" + href;
      }
      let sideA = [],
        sideB = [],
        winner = "A";
      if (cells.length >= 5) {
        sideA = parseBelligerents(cells[3]);
        sideB = parseBelligerents(cells[4]);
        const vtext = cells[3].text;
        if (/inconclusive|stalemate|indecisive|status quo/i.test(vtext) || sideA.length === 0)
          winner = "draw";
      } else {
        // merged belligerents / result cell -> inconclusive
        sideA = parseBelligerents(cells[3]);
        winner = "draw";
      }
      const region = deriveRegion([...sideA, ...sideB, name]);
      wars.push({
        name,
        start,
        end: finish < start ? start : finish,
        sideA,
        sideB,
        winner,
        ...(region ? { region } : {}),
        ...(wiki ? { wiki } : {}),
      });
    }
  }
  return wars;
}

// ---- run ----
const curated = JSON.parse(readFileSync("data/curated.json", "utf8")).map((w) => ({
  ...w,
  featured: true,
}));
const seen = new Set(curated.map((w) => normName(w.name)));
const slugs = new Set(curated.map((w) => w.id));

const scraped = [];
for (const page of PAGES) {
  process.stdout.write(`fetching ${page} ... `);
  const rows = await fetchPage(page);
  let added = 0;
  for (const w of rows) {
    const key = normName(w.name);
    if (seen.has(key)) continue;
    seen.add(key);
    let id = slug(`${w.name}-${w.start}`);
    while (slugs.has(id)) id = id + "-x";
    slugs.add(id);
    scraped.push({ id, ...w });
    added++;
  }
  console.log(`${rows.length} rows, +${added} new`);
  await new Promise((r) => setTimeout(r, 400));
}

const all = [...curated, ...scraped].sort((a, b) => a.start - b.start);
// full set ships in public/ and is fetched on demand; the curated seed (data/curated.json)
// stays bundled so the quiz can start instantly before the full set arrives.
writeFileSync("public/wars.json", JSON.stringify(all));
console.log(`\nTOTAL: ${all.length} wars (${curated.length} curated + ${scraped.length} scraped)`);
console.log(`with region: ${all.filter((w) => w.region).length}, with wiki: ${all.filter((w) => w.wiki).length}, with deaths: ${all.filter((w) => w.deaths).length}, both sides: ${all.filter((w) => w.sideA?.length && w.sideB?.length).length}`);
