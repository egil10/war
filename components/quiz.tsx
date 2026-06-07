"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Swords, RotateCcw } from "lucide-react";
import type { War, Question, ModeId } from "@/lib/types";
import { MODES, nextQuestion } from "@/lib/quiz";
import { countryIds } from "@/lib/geo";
import { loadWars, cachedWars } from "@/lib/load-wars";
import { Flag, FlagRow } from "./flag";
import { WorldMap } from "./world-map";
import { ThemeToggle } from "./theme-toggle";
import { Reveal } from "./reveal";
import { TimelineSlider, TimelineResult } from "./timeline";
import { Sortable } from "./sortable";

type Mode = ModeId | "mixed";
const AUTO_STEPS = [
  { value: 0, label: "manual" },
  { value: 1, label: "1s" },
  { value: 3, label: "3s" },
  { value: 5, label: "5s" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Quiz({ seed }: { seed: War[] }) {
  const [mounted, setMounted] = useState(false);
  const [pool, setPool] = useState<War[]>(() => cachedWars() ?? seed);
  const [mode, setMode] = useState<Mode>("mixed");
  const [auto, setAuto] = useState(0);
  const [q, setQ] = useState<Question | null>(null);
  const [done, setDone] = useState(false);
  const [correctNow, setCorrectNow] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [guessYear, setGuessYear] = useState<number | null>(null);
  const [order, setOrder] = useState<War[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);

  // load a question and atomically set up its input state (avoids a flash of the
  // correct order in sort mode, or a stale slider value in pin mode)
  const startQuestion = useCallback((nq: Question) => {
    setQ(nq);
    setDone(false);
    setCorrectNow(false);
    setPicked(null);
    if (nq.mode === "pin" && nq.domain) setGuessYear(Math.round((nq.domain[0] + nq.domain[1]) / 2));
    else setGuessYear(null);
    if (nq.mode === "order" && nq.items) {
      let s = shuffle(nq.items);
      let g = 0;
      while (g < 20 && s.every((w, i) => w.id === nq.items![i].id)) {
        s = shuffle(nq.items);
        g++;
      }
      setOrder(s);
    } else {
      setOrder([]);
    }
  }, []);

  // first question from the bundled seed → quiz starts immediately
  useEffect(() => {
    setMounted(true);
    startQuestion(nextQuestion(cachedWars() ?? seed, "mixed"));
  }, [seed, startQuestion]);

  // pull in the full set in the background
  useEffect(() => {
    let alive = true;
    loadWars().then((all) => {
      if (alive) setPool(all);
    });
    return () => {
      alive = false;
    };
  }, []);

  const commit = useCallback((isCorrect: boolean) => {
    setDone(true);
    setCorrectNow(isCorrect);
    setAnswered((a) => a + 1);
    if (isCorrect) {
      setScore((s) => s + 1);
      setCorrect((c) => c + 1);
      setStreak((s) => {
        const ns = s + 1;
        setBest((b) => Math.max(b, ns));
        return ns;
      });
    } else {
      setStreak(0);
    }
  }, []);

  const advance = useCallback(
    (m: Mode) => {
      startQuestion(nextQuestion(pool, m));
    },
    [pool, startQuestion]
  );

  const choose = useCallback(
    (i: number) => {
      if (!q || done) return;
      setPicked(i);
      commit(q.options[i].correct);
    },
    [q, done, commit]
  );

  const lockPin = useCallback(() => {
    if (!q || done || guessYear == null || !q.war) return;
    commit(Math.abs(guessYear - q.war.start) <= (q.tolerance ?? 15));
  }, [q, done, guessYear, commit]);

  const lockOrder = useCallback(() => {
    if (!q || done || !q.items) return;
    commit(order.every((w, i) => w.id === q.items![i].id));
  }, [q, done, order, commit]);

  const selectMode = (m: Mode) => {
    setMode(m);
    advance(m);
  };

  // auto-advance
  useEffect(() => {
    if (!done || auto === 0) return;
    const t = setTimeout(() => advance(mode), auto * 1000);
    return () => clearTimeout(t);
  }, [done, auto, mode, advance]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!q) return;
      if (done) {
        if (e.key === "Enter" || e.key === "ArrowRight") {
          e.preventDefault();
          advance(mode);
        }
        return;
      }
      if (q.mode === "pin") {
        if (e.key === "Enter") {
          e.preventDefault();
          lockPin();
        }
        return;
      }
      if (q.mode === "order") {
        if (e.key === "Enter") {
          e.preventDefault();
          lockOrder();
        }
        return;
      }
      const n = parseInt(e.key, 10);
      if (!isNaN(n) && n >= 1 && n <= q.options.length) choose(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, done, mode, choose, advance, lockPin, lockOrder]);

  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
  const hardReset = () => {
    window.location.href = "/";
  };
  const resetScore = () => {
    setScore(0);
    setStreak(0);
    setBest(0);
    setAnswered(0);
    setCorrect(0);
    advance(mode);
  };

  const note =
    done && q?.mode === "pin" && guessYear != null && q.war
      ? `${Math.abs(guessYear - q.war.start)} years off`
      : done && q?.mode === "order" && q.items
      ? `${order.filter((w, i) => w.id === q.items![i].id).length}/${q.items.length} in place`
      : undefined;

  return (
    <main className="min-h-screen">
      {/* header — brand + live KPIs */}
      <header className="grain border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={hardReset}
                title="reset & reload"
                className="flex items-center gap-2 transition-opacity hover:opacity-70"
              >
                <Swords size={16} className="text-accent" />
                <span className="text-sm font-semibold tracking-tight">war quiz</span>
              </button>
              <Link
                href="/database"
                className="ml-1 hidden text-xs text-muted transition-colors hover:text-accent sm:inline"
              >
                database →
              </Link>
            </div>
            <div className="flex items-center gap-3 sm:gap-5">
              <Kpi label="score" value={score} highlight />
              <Kpi label="streak" value={streak} />
              <Kpi label="best" value={best} />
              <Kpi label="acc" value={`${accuracy}%`} />
              {answered > 0 && (
                <button
                  onClick={resetScore}
                  title="reset score"
                  className="text-muted transition-colors hover:text-fg"
                >
                  <RotateCcw size={13} />
                </button>
              )}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* controls: mode + auto */}
      <div className="mx-auto mt-6 max-w-3xl px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Pill active={mode === "mixed"} onClick={() => selectMode("mixed")}>
              mixed
            </Pill>
            {MODES.map((m) => (
              <Pill key={m.id} active={mode === m.id} onClick={() => selectMode(m.id)}>
                {m.label}
              </Pill>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted">auto</span>
            <div className="inline-flex items-center rounded-full border border-border bg-surface p-0.5">
              {AUTO_STEPS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setAuto(s.value)}
                  className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                    auto === s.value ? "bg-accent/15 text-accent" : "text-muted hover:text-fg"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* question card */}
      <div className="mx-auto mt-4 max-w-3xl px-6 pb-20">
        {!mounted || !q ? (
          <div className="h-72 animate-pulse rounded-xl border border-border bg-surface" />
        ) : (
          <div
            key={`${q.prompt}-${answered}`}
            className="animate-pop rounded-xl border border-border bg-surface p-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted">
                {MODES.find((m) => m.id === q.mode)?.label ?? q.mode}
              </span>
              {q.hint && q.mode !== "flags" && (
                <span className="text-[10px] uppercase tracking-wider text-muted">{q.hint}</span>
              )}
            </div>

            <h2 className="mt-3 text-xl font-semibold leading-snug tracking-tight md:text-2xl">
              {q.prompt}
            </h2>

            {q.mode === "flags" && q.flagsA && q.flagsB && (
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SideBox label="one" names={q.flagsA} />
                <SideBox label="two" names={q.flagsB} />
              </div>
            )}

            {q.mode === "map" && q.flagsA && q.flagsB && (
              <div className="mt-5">
                <WorldMap primary={countryIds(q.flagsA)} secondary={countryIds(q.flagsB)} height={260} />
              </div>
            )}

            {/* input by mode */}
            {q.mode === "winner" ? (
              <WinnerOptions q={q} picked={picked} done={done} onChoose={choose} />
            ) : q.mode === "pin" && q.domain ? (
              done && q.war ? (
                <TimelineResult domain={q.domain} guess={guessYear ?? q.domain[0]} actual={q.war.start} />
              ) : (
                <TimelineSlider
                  domain={q.domain}
                  value={guessYear ?? Math.round((q.domain[0] + q.domain[1]) / 2)}
                  onChange={setGuessYear}
                  onLock={lockPin}
                />
              )
            ) : q.mode === "order" ? (
              !done && (
                <Sortable
                  items={order.length ? order : q.items ?? []}
                  orderBy={q.orderBy ?? "year"}
                  onChange={setOrder}
                  onLock={lockOrder}
                />
              )
            ) : (
              q.options.length > 0 && <OptionsGrid q={q} picked={picked} done={done} onChoose={choose} />
            )}

            {done && (
              <Reveal
                q={q}
                correct={correctNow}
                userOrder={order}
                note={note}
                auto={auto}
                answered={answered}
                onNext={() => advance(mode)}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function optionClass(done: boolean, isPicked: boolean, isCorrect: boolean) {
  if (done && isCorrect) return "border-emerald-500/70 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (done && isPicked) return "border-red-500/70 bg-red-500/10 text-red-600 dark:text-red-400";
  if (done) return "border-border opacity-45";
  return "border-border hover:border-accent/50 hover:bg-accent/[0.04]";
}

function OptionsGrid({
  q,
  picked,
  done,
  onChoose,
}: {
  q: Question;
  picked: number | null;
  done: boolean;
  onChoose: (i: number) => void;
}) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {q.options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onChoose(i)}
          disabled={done}
          className={`group flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${optionClass(
            done,
            picked === i,
            opt.correct
          )}`}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border font-mono text-[10px] text-muted group-hover:border-accent/50">
            {i + 1}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium leading-tight">{opt.label}</span>
            {opt.sub && <span className="block text-xs text-muted">{opt.sub}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

function WinnerOptions({
  q,
  picked,
  done,
  onChoose,
}: {
  q: Question;
  picked: number | null;
  done: boolean;
  onChoose: (i: number) => void;
}) {
  const sideA = q.war?.sideA ?? [];
  const sideB = q.war?.sideB ?? [];
  return (
    <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
      <button
        onClick={() => onChoose(0)}
        disabled={done}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border px-3 py-5 text-center transition-colors ${optionClass(
          done,
          picked === 0,
          q.options[0].correct
        )}`}
      >
        <FlagStrip names={sideA} />
        <span className="text-sm font-medium leading-tight">{q.options[0].label}</span>
      </button>
      <button
        onClick={() => onChoose(1)}
        disabled={done}
        className={`flex flex-col items-center justify-center rounded-lg border px-4 py-5 text-center transition-colors ${optionClass(
          done,
          picked === 1,
          q.options[1].correct
        )}`}
      >
        <span className="text-xs font-medium leading-tight">stalemate</span>
        <span className="text-[10px] text-muted">inconclusive</span>
      </button>
      <button
        onClick={() => onChoose(2)}
        disabled={done}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border px-3 py-5 text-center transition-colors ${optionClass(
          done,
          picked === 2,
          q.options[2].correct
        )}`}
      >
        <FlagStrip names={sideB} />
        <span className="text-sm font-medium leading-tight">{q.options[2].label}</span>
      </button>
    </div>
  );
}

function FlagStrip({ names }: { names: string[] }) {
  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-1">
      {names.slice(0, 4).map((n, i) => (
        <Flag key={`${n}-${i}`} name={n} size={20} hideUnknown />
      ))}
    </span>
  );
}

function Kpi({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="text-right leading-none">
      <div className="text-[9px] uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 text-lg font-semibold tabular-nums ${highlight ? "text-accent" : "text-fg"}`}>
        {value}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-border bg-surface text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function SideBox({ label, names }: { label: string; names: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-bg/40 p-3">
      <div className="mb-2 text-[10px] uppercase tracking-wider text-muted">side {label}</div>
      <FlagRow names={names} size={24} />
    </div>
  );
}
