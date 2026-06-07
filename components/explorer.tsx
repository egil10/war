"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Swords, Search, ExternalLink, ArrowUpDown } from "lucide-react";
import type { War } from "@/lib/types";
import { loadWars, cachedWars } from "@/lib/load-wars";
import { formatRange } from "@/lib/quiz";
import { Flag } from "./flag";
import { ThemeToggle } from "./theme-toggle";

const REGIONS = ["Europe", "Asia", "Africa", "Middle East", "Americas", "Oceania", "Global"];
const ERAS: { id: string; label: string; test: (y: number) => boolean }[] = [
  { id: "ancient", label: "ancient (–499)", test: (y) => y < 500 },
  { id: "medieval", label: "medieval (500–1499)", test: (y) => y >= 500 && y < 1500 },
  { id: "earlymod", label: "early modern (1500–1799)", test: (y) => y >= 1500 && y < 1800 },
  { id: "c19", label: "1800s", test: (y) => y >= 1800 && y < 1900 },
  { id: "c20", label: "1900s", test: (y) => y >= 1900 && y < 2000 },
  { id: "c21", label: "2000s", test: (y) => y >= 2000 },
];
const CAP = 400;

export function Explorer({ seed }: { seed: War[] }) {
  const [wars, setWars] = useState<War[]>(() => cachedWars() ?? seed);
  const [loaded, setLoaded] = useState<boolean>(() => !!cachedWars());
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string | null>(null);
  const [era, setEra] = useState<string | null>(null);
  const [desc, setDesc] = useState(false);

  useEffect(() => {
    let alive = true;
    loadWars().then((all) => {
      if (alive) {
        setWars(all);
        setLoaded(true);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const eraDef = era ? ERAS.find((e) => e.id === era) : null;
    const out = wars.filter((w) => {
      if (region && w.region !== region) return false;
      if (eraDef && !eraDef.test(w.start)) return false;
      if (needle) {
        const hay = (w.name + " " + w.sideA.join(" ") + " " + w.sideB.join(" ")).toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    out.sort((a, b) => (desc ? b.start - a.start : a.start - b.start));
    return out;
  }, [wars, q, region, era, desc]);

  const toggle = <T,>(cur: T | null, v: T, set: (x: T | null) => void) =>
    set(cur === v ? null : v);

  return (
    <main className="min-h-screen">
      <header className="grain border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  window.location.href = "/";
                }}
                title="reset & reload"
                className="flex items-center gap-2 transition-opacity hover:opacity-70"
              >
                <Swords size={16} className="text-accent" />
                <span className="text-sm font-semibold tracking-tight">war quiz</span>
              </button>
              <Link href="/" className="ml-1 text-xs text-muted transition-colors hover:text-accent">
                ← back to quiz
              </Link>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">the database</h1>
        <p className="mt-1 text-sm text-muted">
          every war in the set — <span className="tabular-nums">{wars.length.toLocaleString()}</span>{" "}
          conflicts from antiquity to today{loaded ? "" : " (loading…)"}.
        </p>

        {/* search */}
        <div className="mt-5 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2">
          <Search size={15} className="text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search a war, a country, an empire…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-xs text-muted hover:text-fg">
              clear
            </button>
          )}
        </div>

        {/* filters */}
        <div className="mt-4 space-y-2">
          <FilterRow label="region">
            {REGIONS.map((r) => (
              <Chip key={r} active={region === r} onClick={() => toggle(region, r, setRegion)}>
                {r.toLowerCase()}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label="era">
            {ERAS.map((e) => (
              <Chip key={e.id} active={era === e.id} onClick={() => toggle(era, e.id, setEra)}>
                {e.label}
              </Chip>
            ))}
          </FilterRow>
        </div>

        {/* count + sort */}
        <div className="mt-5 flex items-center justify-between text-xs text-muted">
          <span>
            <span className="tabular-nums text-fg">{filtered.length.toLocaleString()}</span> match
            {filtered.length === 1 ? "" : "es"}
            {filtered.length > CAP && (
              <span> · showing first {CAP.toLocaleString()}</span>
            )}
          </span>
          <button
            onClick={() => setDesc((d) => !d)}
            className="inline-flex items-center gap-1 transition-colors hover:text-fg"
          >
            <ArrowUpDown size={12} /> {desc ? "newest first" : "oldest first"}
          </button>
        </div>

        {/* table */}
        <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="hidden grid-cols-[88px_1fr_120px] gap-3 border-b border-border px-4 py-2 text-[10px] uppercase tracking-wider text-muted sm:grid">
            <span>years</span>
            <span>conflict · belligerents</span>
            <span className="text-right">region</span>
          </div>
          {filtered.slice(0, CAP).map((w) => (
            <Row key={w.id} w={w} />
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted">no wars match that.</div>
          )}
        </div>
      </div>
    </main>
  );
}

function Row({ w }: { w: War }) {
  const aWon = w.winner === "A";
  const bWon = w.winner === "B";
  const sideText = (names: string[], named?: string) =>
    named || (names.length ? names.join(" / ") : "—");
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border px-4 py-3 last:border-0 transition-colors hover:bg-accent/[0.03] sm:grid-cols-[88px_1fr_120px] sm:gap-3">
      <div className="font-mono text-xs tabular-nums text-muted sm:pt-0.5">
        {formatRange(w.start, w.end)}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {w.wiki ? (
            <a
              href={w.wiki}
              target="_blank"
              rel="noreferrer"
              className="truncate text-sm font-medium transition-colors hover:text-accent"
            >
              {w.name}
            </a>
          ) : (
            <span className="truncate text-sm font-medium">{w.name}</span>
          )}
          {w.wiki && <ExternalLink size={11} className="shrink-0 text-muted" />}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
          <FlagStrip names={w.sideA} />
          <span className={aWon ? "font-medium text-fg" : "text-muted"}>
            {sideText(w.sideA, w.sideAName)}
          </span>
          <span className="text-muted">vs</span>
          <FlagStrip names={w.sideB} />
          <span className={bWon ? "font-medium text-fg" : "text-muted"}>
            {sideText(w.sideB, w.sideBName)}
          </span>
          {w.winner === "draw" && <span className="text-muted">· stalemate</span>}
        </div>
      </div>
      <div className="sm:text-right">
        {w.region && (
          <span className="inline-block rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">
            {w.region.toLowerCase()}
          </span>
        )}
      </div>
    </div>
  );
}

function FlagStrip({ names }: { names: string[] }) {
  const flags = names.slice(0, 3);
  return (
    <span className="inline-flex items-center gap-1">
      {flags.map((n, i) => (
        <Flag key={`${n}-${i}`} name={n} size={12} hideUnknown />
      ))}
    </span>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[10px] uppercase tracking-wider text-muted">{label}</span>
      {children}
    </div>
  );
}

function Chip({
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
      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
        active
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-border bg-surface text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
