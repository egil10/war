import type { War, Question, ModeId, Option } from "./types";
import { hasMappable, countryIds } from "./geo";

export const MODES: { id: ModeId; label: string; blurb: string }[] = [
  { id: "year", label: "guess the year", blurb: "when did it begin?" },
  { id: "winner", label: "who won?", blurb: "name the victor" },
  { id: "flags", label: "name the war", blurb: "from the belligerents" },
  { id: "map", label: "on the map", blurb: "from the geography" },
  { id: "deadlier", label: "deadlier?", blurb: "which cost more lives" },
  { id: "earlier", label: "earlier?", blurb: "which came first" },
  { id: "region", label: "where?", blurb: "the main theatre" },
];

const ALL_MODES = MODES.map((m) => m.id);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample<T>(arr: T[], n: number, exclude: T[] = []): T[] {
  const pool = arr.filter((x) => !exclude.includes(x));
  return shuffle(pool).slice(0, n);
}

export function formatYear(y: number): string {
  return y < 0 ? `${-y} BC` : `${y}`;
}

export function formatRange(start: number, end: number): string {
  if (start === end) return formatYear(start);
  return `${formatYear(start)}–${formatYear(end)}`;
}

function formatDeaths(n: number): string {
  if (n >= 1_000_000) return `~${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)} million`;
  if (n >= 1_000) return `~${Math.round(n / 1000)},000`;
  return `~${n}`;
}

export function wikiUrl(w: War): string {
  return w.wiki || `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(w.name)}`;
}

function sideLabel(names: string[] | undefined, named: string | undefined, fallback: string): string {
  if (named) return named;
  if (names && names.length) return names.length > 1 ? `${names[0]} & allies` : names[0];
  return fallback;
}

// --- eligibility: which wars can power which mode -------------------------
const ELIGIBLE: Record<ModeId, (w: War) => boolean> = {
  year: () => true,
  earlier: () => true,
  winner: (w) => w.sideA.length > 0 && w.sideB.length > 0,
  flags: (w) => hasMappable(w.sideA) && hasMappable(w.sideB),
  map: (w) => countryIds([...w.sideA, ...w.sideB]).length > 0,
  deadlier: (w) => typeof w.deaths === "number",
  region: (w) => !!w.region && !!w.featured,
};

let cacheKey: War[] | null = null;
let cachePools: Record<ModeId, War[]>;
function pools(wars: War[]): Record<ModeId, War[]> {
  if (cacheKey === wars) return cachePools;
  cachePools = {} as Record<ModeId, War[]>;
  for (const m of ALL_MODES) cachePools[m] = wars.filter(ELIGIBLE[m]);
  cacheKey = wars;
  return cachePools;
}

// --- generators ----------------------------------------------------------

function genYear(pool: War[], all: War[]): Question {
  const w = pick(pool);
  const correct = w.start;
  const nearby = all
    .map((x) => x.start)
    .filter((y) => y !== correct && Math.abs(y - correct) <= 120 && Math.abs(y - correct) >= 2);
  const distractSet = new Set<number>(sample([...new Set(nearby)], 3));
  const offsets = [2, 4, 7, 11, 18, 27, 40];
  let oi = 0;
  while (distractSet.size < 3 && oi < offsets.length * 2) {
    const sign = oi % 2 === 0 ? 1 : -1;
    const cand = correct + sign * offsets[oi % offsets.length];
    if (cand !== correct && cand <= new Date().getFullYear()) distractSet.add(cand);
    oi++;
  }
  const options: Option[] = shuffle([
    { label: formatYear(correct), correct: true },
    ...[...distractSet].slice(0, 3).map((y) => ({ label: formatYear(y), correct: false })),
  ]);
  return {
    mode: "year",
    prompt: `When did the ${w.name} begin?`,
    hint: `${sideLabel(w.sideA, w.sideAName, "one side")} vs ${sideLabel(w.sideB, w.sideBName, "another")}`,
    options,
    fact: `The ${w.name} ran ${formatRange(w.start, w.end)}${w.outcome ? ` — ${w.outcome.toLowerCase()}` : ""}.`,
    wiki: wikiUrl(w),
  };
}

function genWinner(pool: War[]): Question {
  const w = pick(pool);
  const a = sideLabel(w.sideA, w.sideAName, "one side");
  const b = sideLabel(w.sideB, w.sideBName, "the other side");
  const opts: Option[] = [
    { label: a, correct: w.winner === "A" },
    { label: b, correct: w.winner === "B" },
    { label: "Stalemate / inconclusive", correct: w.winner === "draw" },
  ];
  return {
    mode: "winner",
    prompt: `Who came out on top in the ${w.name}?`,
    hint: formatRange(w.start, w.end),
    options: shuffle(opts),
    fact: w.outcome
      ? `${w.outcome} (${formatRange(w.start, w.end)}).`
      : w.winner === "draw"
      ? `It ended inconclusively (${formatRange(w.start, w.end)}).`
      : `${w.winner === "A" ? a : b} prevailed (${formatRange(w.start, w.end)}).`,
    wiki: wikiUrl(w),
  };
}

function genFlags(pool: War[], all: War[]): Question {
  const w = pick(pool);
  const distractors = sample(all.filter((x) => x.id !== w.id), 3).map((x) => ({
    label: x.name,
    correct: false,
  }));
  const options = shuffle([{ label: w.name, correct: true }, ...distractors]);
  return {
    mode: "flags",
    prompt: "Which war was fought between these sides?",
    flagsA: w.sideA,
    flagsB: w.sideB,
    options,
    fact: `${w.name} (${formatRange(w.start, w.end)})${w.outcome ? ` — ${w.outcome.toLowerCase()}` : ""}.`,
    wiki: wikiUrl(w),
  };
}

function genMap(pool: War[], all: War[]): Question {
  const w = pick(pool);
  const distractors = sample(all.filter((x) => x.id !== w.id), 3).map((x) => ({
    label: x.name,
    correct: false,
  }));
  const options = shuffle([{ label: w.name, correct: true }, ...distractors]);
  return {
    mode: "map",
    prompt: "Which war was fought in the highlighted countries?",
    flagsA: w.sideA,
    flagsB: w.sideB,
    options,
    fact: `${w.name} (${formatRange(w.start, w.end)})${w.region ? ` — mainly in ${w.region}` : ""}.`,
    wiki: wikiUrl(w),
  };
}

function genDeadlier(pool: War[]): Question {
  let a = pick(pool);
  let b = pick(pool);
  let guard = 0;
  while (
    (b.id === a.id || Math.max(a.deaths!, b.deaths!) / Math.min(a.deaths!, b.deaths!) < 1.3) &&
    guard < 50
  ) {
    b = pick(pool);
    guard++;
  }
  const aWins = a.deaths! > b.deaths!;
  const options = shuffle([
    { label: a.name, sub: formatRange(a.start, a.end), correct: aWins },
    { label: b.name, sub: formatRange(b.start, b.end), correct: !aWins },
  ]);
  return {
    mode: "deadlier",
    prompt: "Which war was deadlier?",
    options,
    fact: `${a.name}: ${formatDeaths(a.deaths!)} dead · ${b.name}: ${formatDeaths(b.deaths!)} dead.`,
    wiki: wikiUrl(aWins ? a : b),
  };
}

function genEarlier(pool: War[]): Question {
  let a = pick(pool);
  let b = pick(pool);
  let guard = 0;
  while ((b.id === a.id || a.start === b.start) && guard < 50) {
    b = pick(pool);
    guard++;
  }
  const aFirst = a.start < b.start;
  const options = shuffle([
    { label: a.name, correct: aFirst },
    { label: b.name, correct: !aFirst },
  ]);
  return {
    mode: "earlier",
    prompt: "Which war began earlier?",
    options,
    fact: `${a.name} began ${formatYear(a.start)} · ${b.name} began ${formatYear(b.start)}.`,
    wiki: wikiUrl(aFirst ? a : b),
  };
}

const REGION_SET = ["Europe", "Asia", "Africa", "Middle East", "Americas", "Oceania", "Global"];
function genRegion(pool: War[]): Question {
  const w = pick(pool);
  const distractors = sample(REGION_SET, 3, [w.region!]).map((r) => ({ label: r, correct: false }));
  const options = shuffle([{ label: w.region!, correct: true }, ...distractors]);
  return {
    mode: "region",
    prompt: `Where was the ${w.name} mainly fought?`,
    hint: formatRange(w.start, w.end),
    options,
    fact: `The ${w.name} was fought mainly in ${w.region}.`,
    wiki: wikiUrl(w),
  };
}

function build(mode: ModeId, p: Record<ModeId, War[]>, all: War[]): Question {
  switch (mode) {
    case "year":
      return genYear(p.year, all);
    case "winner":
      return genWinner(p.winner);
    case "flags":
      return genFlags(p.flags, all);
    case "map":
      return genMap(p.map, all);
    case "deadlier":
      return genDeadlier(p.deadlier);
    case "earlier":
      return genEarlier(p.earlier);
    case "region":
      return genRegion(p.region);
  }
}

const MIN: Partial<Record<ModeId, number>> = { deadlier: 2, earlier: 2 };

export function nextQuestion(wars: War[], mode: ModeId | "mixed"): Question {
  const p = pools(wars);
  if (mode === "mixed") {
    const available = ALL_MODES.filter((m) => p[m].length >= (MIN[m] ?? 1) && (m !== "flags" || wars.length >= 4));
    return build(pick(available.length ? available : ["earlier"]), p, wars);
  }
  if (p[mode].length < (MIN[mode] ?? 1)) return build("earlier", p, wars);
  return build(mode, p, wars);
}
