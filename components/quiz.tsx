"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Swords, Flame, Target, Trophy, ExternalLink, ArrowRight, RotateCcw } from "lucide-react";
import type { War, Question, ModeId } from "@/lib/types";
import { MODES, nextQuestion } from "@/lib/quiz";
import { FlagRow } from "./flag";
import { ThemeToggle } from "./theme-toggle";

type Mode = ModeId | "mixed";

export function Quiz({ wars }: { wars: War[] }) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("mixed");
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);

  // generate the very first question on the client → quiz starts immediately
  useEffect(() => {
    setMounted(true);
    setQ(nextQuestion(wars, "mixed"));
  }, [wars]);

  const advance = useCallback(
    (m: Mode) => {
      setPicked(null);
      setQ(nextQuestion(wars, m));
    },
    [wars]
  );

  const choose = useCallback(
    (i: number) => {
      if (!q || picked !== null) return;
      setPicked(i);
      setAnswered((a) => a + 1);
      if (q.options[i].correct) {
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
    },
    [q, picked]
  );

  const selectMode = (m: Mode) => {
    setMode(m);
    advance(m);
  };

  // keyboard: 1-4 to answer, Enter / → for next
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!q) return;
      if (picked === null) {
        const n = parseInt(e.key, 10);
        if (!isNaN(n) && n >= 1 && n <= q.options.length) choose(n - 1);
      } else if (e.key === "Enter" || e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        advance(mode);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, picked, mode, choose, advance]);

  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;

  return (
    <main className="min-h-screen">
      {/* hero */}
      <section className="grain border-b border-border">
        <div className="mx-auto max-w-3xl px-6 pt-8 pb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Swords size={14} className="text-accent" />
              <span className="font-medium text-fg">war quiz</span>
              <span className="text-border">·</span>
              <span className="tabular-nums">{wars.length} wars</span>
              <span className="text-border">·</span>
              <span>3000 years</span>
            </div>
            <ThemeToggle />
          </div>

          <h1 className="mt-7 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            every war ever fought,{" "}
            <span className="text-accent">one question at a time</span>.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            from the Greco-Persian Wars to last year&apos;s headlines — guess the year, the
            victor, the belligerents and the body count. no signup, no menu: it&apos;s already
            started.
          </p>
        </div>
      </section>

      {/* stat strip */}
      <div className="mx-auto -mt-6 max-w-3xl px-6">
        <div className="grid grid-cols-4 gap-3">
          <Stat icon={Target} label="score" value={score} highlight />
          <Stat icon={Flame} label="streak" value={streak} />
          <Stat icon={Trophy} label="best" value={best} />
          <Stat icon={Swords} label="accuracy" value={`${accuracy}%`} />
        </div>
      </div>

      {/* mode pills */}
      <div className="mx-auto mt-8 max-w-3xl px-6">
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
      </div>

      {/* question card */}
      <div className="mx-auto mt-4 max-w-3xl px-6 pb-20">
        {!mounted || !q ? (
          <div className="h-72 animate-pulse rounded-xl border border-border bg-surface" />
        ) : (
          <div key={`${q.prompt}-${answered}`} className="animate-pop rounded-xl border border-border bg-surface p-6">
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

            <div
              className={`mt-5 grid gap-2.5 ${
                q.options.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
              }`}
            >
              {q.options.map((opt, i) => {
                const isPicked = picked === i;
                const reveal = picked !== null;
                let cls = "border-border hover:border-accent/50 hover:bg-accent/[0.04]";
                if (reveal && opt.correct)
                  cls = "border-accent bg-accent/10 text-accent";
                else if (reveal && isPicked && !opt.correct)
                  cls = "border-rose-400/60 bg-rose-500/10 text-rose-500";
                else if (reveal) cls = "border-border opacity-55";
                return (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    disabled={reveal}
                    className={`group flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${cls}`}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border font-mono text-[10px] text-muted group-hover:border-accent/50">
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium leading-tight">{opt.label}</span>
                      {opt.sub && <span className="block text-xs text-muted">{opt.sub}</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* feedback */}
            {picked !== null && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-sm">
                  <span
                    className={
                      q.options[picked].correct
                        ? "font-semibold text-accent"
                        : "font-semibold text-rose-500"
                    }
                  >
                    {q.options[picked].correct ? "correct" : "not quite"}
                  </span>
                  <span className="text-muted"> — {q.fact}</span>
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <a
                    href={q.wiki}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
                  >
                    read on wikipedia <ExternalLink size={12} />
                  </a>
                  <button
                    onClick={() => advance(mode)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
                  >
                    next <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between text-xs text-muted">
          <span>
            press <kbd className="rounded border border-border px-1">1</kbd>–
            <kbd className="rounded border border-border px-1">4</kbd> to answer,{" "}
            <kbd className="rounded border border-border px-1">enter</kbd> for next
          </span>
          {answered > 0 && (
            <button
              onClick={() => {
                setScore(0);
                setStreak(0);
                setBest(0);
                setAnswered(0);
                setCorrect(0);
                advance(mode);
              }}
              className="inline-flex items-center gap-1 transition-colors hover:text-fg"
            >
              <RotateCcw size={12} /> reset
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-surface p-3 ${
        highlight ? "border-accent/40" : "border-border"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
        <Icon size={12} className={highlight ? "text-accent" : ""} />
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          highlight ? "text-accent" : "text-fg"
        }`}
      >
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
