"use client";

import { ExternalLink, ArrowRight, Trophy } from "lucide-react";
import type { Question, War } from "@/lib/types";
import { formatRange, formatYear, formatDeaths, wikiUrl } from "@/lib/quiz";
import { countryIds } from "@/lib/geo";
import { Flag } from "./flag";
import { WorldMap } from "./world-map";

const GREEN = "text-emerald-600 dark:text-emerald-400";
const RED = "text-red-600 dark:text-red-400";

function ids(w: War) {
  return [...new Set([...countryIds(w.sideA), ...countryIds(w.sideB)])];
}

export function Reveal({
  q,
  correct,
  userOrder,
  note,
  auto,
  answered,
  onNext,
}: {
  q: Question;
  correct: boolean;
  userOrder?: War[];
  note?: string;
  auto: number;
  answered: number;
  onNext: () => void;
}) {
  return (
    <div className="mt-5 border-t border-border pt-4">
      {/* verdict */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className={`text-sm font-semibold ${correct ? GREEN : RED}`}>
          {correct ? "correct" : "not quite"}
        </span>
        <span className="text-sm text-muted">
          answer: <span className="font-medium text-fg">{q.answer}</span>
        </span>
        {note && <span className="text-xs text-muted">· {note}</span>}
      </div>

      {/* body */}
      {q.warA && q.warB ? (
        <Comparison q={q} />
      ) : q.mode === "order" && userOrder ? (
        <OrderReveal q={q} userOrder={userOrder} />
      ) : q.war ? (
        <div className="mt-3">
          <WarCard w={q.war} showMap={q.mode !== "map"} showSides={q.mode !== "flags"} />
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">{q.fact}</p>
      )}

      {/* footer */}
      <div className="mt-4 flex items-center justify-between">
        <a
          href={q.wiki}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
        >
          read on wikipedia <ExternalLink size={12} />
        </a>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
        >
          next <ArrowRight size={14} />
        </button>
      </div>
      {auto > 0 && (
        <div className="mt-4 h-0.5 w-full overflow-hidden rounded-full bg-border">
          <div
            key={`${q.prompt}-${answered}`}
            className="h-full bg-accent"
            style={{ animation: `shrink ${auto}s linear forwards` }}
          />
        </div>
      )}
    </div>
  );
}

/* ---------- comparison modes: the two wars, compared side by side ---------- */

function Comparison({ q }: { q: Question }) {
  const a = q.warA!;
  const b = q.warB!;
  const isDeaths = q.mode === "deadlier";
  const aWin = isDeaths ? a.deaths! > b.deaths! : a.start < b.start;

  let takeaway: string;
  if (isDeaths) {
    const hi = aWin ? a : b;
    const lo = aWin ? b : a;
    const ratio = hi.deaths! / lo.deaths!;
    takeaway = `${hi.name} was ~${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}× deadlier than ${lo.name}.`;
  } else {
    const e = aWin ? a : b;
    const l = aWin ? b : a;
    const diff = l.start - e.start;
    takeaway = `${e.name} began ${diff} year${diff === 1 ? "" : "s"} before ${l.name}.`;
  }

  const max = isDeaths ? Math.max(a.deaths!, b.deaths!) : 0;

  return (
    <div className="mt-3">
      {/* the comparable headline: metric · flags · map, aligned in two columns */}
      <div className="grid grid-cols-2 gap-3">
        <CompareCol w={a} isDeaths={isDeaths} win={aWin} barPct={isDeaths ? (a.deaths! / max) * 100 : 0} />
        <CompareCol w={b} isDeaths={isDeaths} win={!aWin} barPct={isDeaths ? (b.deaths! / max) * 100 : 0} />
      </div>

      <p className="mt-3 text-center text-sm">
        <span className="text-muted">so: </span>
        {takeaway}
      </p>

      {/* everything else, below */}
      <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] leading-relaxed text-muted">
        <Detail w={a} />
        <Detail w={b} />
      </div>
    </div>
  );
}

function CompareCol({
  w,
  isDeaths,
  win,
  barPct,
}: {
  w: War;
  isDeaths: boolean;
  win: boolean;
  barPct: number;
}) {
  const mapIds = ids(w);
  return (
    <div
      className={`flex flex-col rounded-lg border p-3 ${
        win ? "border-accent/60 bg-accent/[0.05]" : "border-border bg-bg/40"
      }`}
    >
      <a
        href={wikiUrl(w)}
        target="_blank"
        rel="noreferrer"
        className="truncate text-xs font-semibold leading-tight transition-colors hover:text-accent"
      >
        {w.name}
      </a>
      {/* big comparable metric */}
      <div className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${win ? "text-accent" : "text-fg"}`}>
        {isDeaths ? formatDeaths(w.deaths!).replace(/^~/, "") : formatYear(w.start)}
      </div>
      <div className="text-[9px] uppercase tracking-wider text-muted">{isDeaths ? "deaths" : "began"}</div>
      {isDeaths && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div className={`h-full ${win ? "bg-accent" : "bg-muted"}`} style={{ width: `${barPct}%` }} />
        </div>
      )}
      {/* flags */}
      <div className="mt-3">
        <MiniSides w={w} />
      </div>
      {/* map */}
      {mapIds.length > 0 && (
        <div className="mt-3">
          <WorldMap primary={countryIds(w.sideA)} secondary={countryIds(w.sideB)} height={104} />
        </div>
      )}
    </div>
  );
}

function MiniSides({ w }: { w: War }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px]">
      <SidePart names={w.sideA} label={w.sideAName} win={w.winner === "A"} />
      <span className="text-[9px] uppercase tracking-wider text-muted">vs</span>
      <SidePart names={w.sideB} label={w.sideBName} win={w.winner === "B"} />
    </div>
  );
}

/* ---------- single-war modes: sides side by side, map, then details -------- */

function WarCard({ w, showMap, showSides }: { w: War; showMap: boolean; showSides: boolean }) {
  const mapIds = ids(w);
  const mapOk = showMap && mapIds.length > 0;
  return (
    <div className="rounded-lg border border-border bg-bg/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <a
          href={wikiUrl(w)}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold leading-tight transition-colors hover:text-accent"
        >
          {w.name}
        </a>
        <span className="shrink-0 font-mono text-xs tabular-nums text-muted">{formatRange(w.start, w.end)}</span>
      </div>

      {/* the two sides, side by side */}
      {showSides && (
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <SideCol names={w.sideA} label={w.sideAName} win={w.winner === "A"} align="left" />
          <span className="text-[10px] uppercase tracking-wider text-muted">vs</span>
          <SideCol names={w.sideB} label={w.sideBName} win={w.winner === "B"} align="right" />
        </div>
      )}

      {/* casualties, highlighted */}
      {typeof w.deaths === "number" && (
        <div className="mt-3 text-center">
          <span className="font-mono text-xl font-semibold tabular-nums text-fg">{formatDeaths(w.deaths)}</span>
          <span className="ml-1.5 text-[10px] uppercase tracking-wider text-muted">est. deaths</span>
        </div>
      )}

      {/* map */}
      {mapOk && (
        <div className="mt-3">
          <WorldMap primary={countryIds(w.sideA)} secondary={countryIds(w.sideB)} height={168} />
        </div>
      )}

      {/* additional info below */}
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {w.region && <Tag>{w.region.toLowerCase()}</Tag>}
        {w.outcome ? (
          <Tag accent>{w.outcome.toLowerCase()}</Tag>
        ) : (
          <Tag accent>{w.winner === "draw" ? "stalemate" : "decisive result"}</Tag>
        )}
      </div>
    </div>
  );
}

function SideCol({
  names,
  label,
  win,
  align,
}: {
  names: string[];
  label?: string;
  win: boolean;
  align: "left" | "right";
}) {
  const text = label || (names.length ? names.join(" / ") : "—");
  return (
    <div className={`min-w-0 ${align === "right" ? "text-right" : "text-left"}`}>
      <div className={`flex flex-wrap items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
        {win && <Trophy size={12} className="shrink-0 text-accent" />}
        {names.slice(0, 4).map((n, i) => (
          <Flag key={`${n}-${i}`} name={n} size={16} hideUnknown />
        ))}
      </div>
      <div className={`mt-1 text-xs ${win ? "font-semibold text-fg" : "text-muted"}`}>{text}</div>
    </div>
  );
}

function SidePart({ names, label, win }: { names: string[]; label?: string; win: boolean }) {
  const text = label || (names.length ? names.join(" / ") : "—");
  return (
    <span className="inline-flex items-center gap-1">
      {win && <Trophy size={11} className="shrink-0 text-accent" />}
      {names.slice(0, 2).map((n, i) => (
        <Flag key={`${n}-${i}`} name={n} size={12} hideUnknown />
      ))}
      <span className={win ? "font-semibold text-fg" : "text-muted"}>{text}</span>
    </span>
  );
}

function Detail({ w }: { w: War }) {
  return (
    <div>
      <span className="font-mono tabular-nums">{formatRange(w.start, w.end)}</span>
      {w.region && ` · ${w.region.toLowerCase()}`}
      {w.outcome && ` · ${w.outcome.toLowerCase()}`}
    </div>
  );
}

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] ${
        accent ? "border-accent/40 text-accent" : "border-border text-muted"
      }`}
    >
      {children}
    </span>
  );
}

/* ---------- order mode ---------- */

function OrderReveal({ q, userOrder }: { q: Question; userOrder: War[] }) {
  const correctOrder = q.items!;
  const isDeaths = q.orderBy === "deaths";
  return (
    <div className="mt-3">
      <p className="mb-2 text-xs text-muted">correct order — {q.orderLabel}:</p>
      <div className="space-y-1.5">
        {correctOrder.map((w, i) => {
          const right = userOrder[i]?.id === w.id;
          return (
            <div
              key={w.id}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${
                right ? "border-emerald-500/50 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5"
              }`}
            >
              <span className="font-mono text-xs text-muted">{i + 1}</span>
              <span className="inline-flex gap-1">
                {w.sideA.slice(0, 2).map((n, k) => (
                  <Flag key={k} name={n} size={13} hideUnknown />
                ))}
              </span>
              <a
                href={wikiUrl(w)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 truncate text-sm font-medium transition-colors hover:text-accent"
              >
                {w.name}
              </a>
              <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-fg">
                {isDeaths ? formatDeaths(w.deaths!) : formatYear(w.start)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
