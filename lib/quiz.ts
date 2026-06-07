import type { War, Question, ModeId, Option } from "./types";

export const MODES: { id: ModeId; label: string; blurb: string }[] = [
  { id: "year", label: "guess the year", blurb: "when did it begin?" },
  { id: "winner", label: "who won?", blurb: "name the victor" },
  { id: "flags", label: "name the war", blurb: "from the belligerents" },
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

// --- generators -------------------------------------------------------------

function genYear(wars: War[]): Question {
  const w = pick(wars);
  const correct = w.start;
  const nearby = wars
    .map((x) => x.start)
    .filter((y) => y !== correct && Math.abs(y - correct) <= 120 && Math.abs(y - correct) >= 3);
  const distractSet = new Set<number>(sample([...new Set(nearby)], 3));
  // top up with offsets if not enough distinct nearby years
  const offsets = [3, 5, 8, 11, 17, 24];
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
    hint: `${w.sideAName} vs ${w.sideBName}`,
    options,
    fact: `The ${w.name} ran ${formatRange(w.start, w.end)} — ${w.outcome.toLowerCase()}.`,
    wiki: w.wiki,
  };
}

function genWinner(wars: War[]): Question {
  const w = pick(wars);
  const opts: Option[] = [
    { label: w.sideAName, correct: w.winner === "A" },
    { label: w.sideBName, correct: w.winner === "B" },
    { label: "Stalemate / inconclusive", correct: w.winner === "draw" },
  ];
  return {
    mode: "winner",
    prompt: `Who came out on top in the ${w.name}?`,
    hint: formatRange(w.start, w.end),
    options: shuffle(opts),
    fact: `${w.outcome} (${formatRange(w.start, w.end)}).`,
    wiki: w.wiki,
  };
}

function genFlags(wars: War[]): Question {
  const w = pick(wars);
  const distractors = sample(
    wars.filter((x) => x.id !== w.id),
    3
  ).map((x) => ({ label: x.name, correct: false }));
  const options = shuffle([{ label: w.name, correct: true }, ...distractors]);
  return {
    mode: "flags",
    prompt: "Which war was fought between these sides?",
    hint: `${w.sideAName}  vs  ${w.sideBName}`,
    flagsA: w.sideA,
    flagsB: w.sideB,
    options,
    fact: `${w.name} (${formatRange(w.start, w.end)}) — ${w.outcome.toLowerCase()}.`,
    wiki: w.wiki,
  };
}

function genDeadlier(wars: War[]): Question {
  let a = pick(wars);
  let b = pick(wars);
  let guard = 0;
  while ((b.id === a.id || Math.max(a.deaths, b.deaths) / Math.min(a.deaths, b.deaths) < 1.3) && guard < 50) {
    b = pick(wars);
    guard++;
  }
  const aWins = a.deaths > b.deaths;
  const options = shuffle([
    { label: a.name, sub: formatRange(a.start, a.end), correct: aWins },
    { label: b.name, sub: formatRange(b.start, b.end), correct: !aWins },
  ]);
  return {
    mode: "deadlier",
    prompt: "Which war was deadlier?",
    options,
    fact: `${a.name}: ${formatDeaths(a.deaths)} dead · ${b.name}: ${formatDeaths(b.deaths)} dead.`,
    wiki: (aWins ? a : b).wiki,
  };
}

function genEarlier(wars: War[]): Question {
  let a = pick(wars);
  let b = pick(wars);
  let guard = 0;
  while ((b.id === a.id || a.start === b.start) && guard < 50) {
    b = pick(wars);
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
    wiki: (aFirst ? a : b).wiki,
  };
}

function genRegion(wars: War[]): Question {
  const w = pick(wars);
  const regions = [...new Set(wars.map((x) => x.region))];
  const distractors = sample(regions, 3, [w.region]).map((r) => ({ label: r, correct: false }));
  const options = shuffle([{ label: w.region, correct: true }, ...distractors]);
  return {
    mode: "region",
    prompt: `Where was the ${w.name} mainly fought?`,
    hint: formatRange(w.start, w.end),
    options,
    fact: `The ${w.name} was fought mainly in ${w.region}.`,
    wiki: w.wiki,
  };
}

const GENERATORS: Record<ModeId, (wars: War[]) => Question> = {
  year: genYear,
  winner: genWinner,
  flags: genFlags,
  deadlier: genDeadlier,
  earlier: genEarlier,
  region: genRegion,
};

export function nextQuestion(wars: War[], mode: ModeId | "mixed"): Question {
  const m = mode === "mixed" ? pick(ALL_MODES) : mode;
  return GENERATORS[m](wars);
}
