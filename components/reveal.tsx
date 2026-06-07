"use client";

import { ExternalLink, ArrowRight, Trophy } from "lucide-react";
import type { Question, War } from "@/lib/types";
import { formatRange, formatYear, formatDeaths, wikiUrl } from "@/lib/quiz";
import { countryIds } from "@/lib/geo";
import { Flag } from "./flag";
import { WorldMap } from "./world-map";

const GREEN = "text-emerald-600 dark:text-emerald-400";
const RED = "text-red-600 dark:text-red-400";

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

function WarCard({
  w,
  showMap,
  showSides,
  highlight,
  compact,
}: {
  w: War;
  showMap: boolean;
  showSides: boolean;
  highlight?: boolean;
  compact?: boolean;
}) {
  const ids = [...new Set([...countryIds(w.sideA), ...countryIds(w.sideB)])];
  const mapOk = showMap && ids.length > 0;
  return (
    <div
      className={`rounded-lg border bg-bg/40 p-4 ${highlight ? "border-accent/60" : "border-border"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <a
          href={wikiUrl(w)}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold leading-tight transition-colors hover:text-accent"
        >
          {w.name}
        </a>
        <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
          {formatRange(w.start, w.end)}
        </span>
      </div>
      {showSides && <Sides w={w} />}
      {mapOk && (
        <div className="mt-3">
          <WorldMap
            primary={countryIds(w.sideA)}
            secondary={countryIds(w.sideB)}
            height={compact ? 120 : 168}
          />
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {w.region && <Tag>{w.region.toLowerCase()}</Tag>}
        {typeof w.deaths === "number" && <Tag>{formatDeaths(w.deaths)} dead</Tag>}
        {w.outcome ? (
          <Tag accent>{w.outcome.toLowerCase()}</Tag>
        ) : (
          <Tag accent>{w.winner === "draw" ? "stalemate" : "decisive result"}</Tag>
        )}
      </div>
    </div>
  );
}

function Sides({ w }: { w: War }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <SidePart names={w.sideA} label={w.sideAName} win={w.winner === "A"} />
      <span className="text-[10px] uppercase tracking-wider text-muted">vs</span>
      <SidePart names={w.sideB} label={w.sideBName} win={w.winner === "B"} />
    </div>
  );
}

function SidePart({ names, label, win }: { names: string[]; label?: string; win: boolean }) {
  const text = label || (names.length ? names.join(" / ") : "—");
  return (
    <span className="inline-flex items-center gap-1.5">
      {win && <Trophy size={12} className="shrink-0 text-accent" />}
      {names.slice(0, 3).map((n, i) => (
        <Flag key={`${n}-${i}`} name={n} size={13} hideUnknown />
      ))}
      <span className={win ? "font-semibold text-fg" : "text-muted"}>{text}</span>
    </span>
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

function Comparison({ q }: { q: Question }) {
  const a = q.warA!;
  const b = q.warB!;
  const isDeaths = q.mode === "deadlier";
  let takeaway: string;
  let aWin: boolean;
  if (isDeaths) {
    aWin = a.deaths! > b.deaths!;
    const hi = aWin ? a : b;
    const lo = aWin ? b : a;
    const ratio = hi.deaths! / lo.deaths!;
    takeaway = `${hi.name} was ~${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}× deadlier than ${lo.name}.`;
  } else {
    aWin = a.start < b.start;
    const e = aWin ? a : b;
    const l = aWin ? b : a;
    const diff = l.start - e.start;
    takeaway = `${e.name} began ${diff} year${diff === 1 ? "" : "s"} before ${l.name}.`;
  }
  return (
    <div className="mt-3">
      <p className="mb-3 text-sm">
        <span className="text-muted">so: </span>
        {takeaway}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <WarCard w={a} showMap showSides compact highlight={aWin} />
        <WarCard w={b} showMap showSides compact highlight={!aWin} />
      </div>
    </div>
  );
}

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
              <span className="shrink-0 font-mono text-xs tabular-nums text-fg">
                {isDeaths ? formatDeaths(w.deaths!) : formatYear(w.start)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
