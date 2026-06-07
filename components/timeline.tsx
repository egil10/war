"use client";

import { formatYear } from "@/lib/quiz";

const ACCENT = { accentColor: "rgb(var(--accent))" } as React.CSSProperties;

function pct(year: number, [min, max]: [number, number]) {
  return Math.max(0, Math.min(100, ((year - min) / (max - min)) * 100));
}

// interactive: slide to pick a year, then lock in
export function TimelineSlider({
  domain,
  value,
  onChange,
  onLock,
}: {
  domain: [number, number];
  value: number;
  onChange: (y: number) => void;
  onLock: () => void;
}) {
  return (
    <div className="mt-5">
      <div className="mb-3 text-center">
        <div className="font-mono text-4xl font-semibold tabular-nums text-accent">
          {formatYear(value)}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted">your guess</div>
      </div>
      <input
        type="range"
        min={domain[0]}
        max={domain[1]}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={ACCENT}
        className="w-full cursor-pointer"
        aria-label="year"
      />
      <div className="mt-1 flex justify-between font-mono text-[10px] tabular-nums text-muted">
        <span>{formatYear(domain[0])}</span>
        <span>{formatYear(Math.round((domain[0] + domain[1]) / 2))}</span>
        <span>{formatYear(domain[1])}</span>
      </div>
      <button
        onClick={onLock}
        className="mt-5 w-full rounded-lg border border-accent/40 bg-accent/10 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
      >
        lock in {formatYear(value)}
      </button>
    </div>
  );
}

// static: show where the guess landed vs the truth
export function TimelineResult({
  domain,
  guess,
  actual,
}: {
  domain: [number, number];
  guess: number;
  actual: number;
}) {
  const gp = pct(guess, domain);
  const ap = pct(actual, domain);
  return (
    <div className="mt-5">
      <div className="relative h-12">
        <div className="absolute top-7 h-0.5 w-full rounded-full bg-border" />
        {/* guess */}
        <Pin pos={gp} top className="text-muted" label={formatYear(guess)} dot="bg-muted" />
        {/* actual */}
        <Pin pos={ap} className="text-accent" label={formatYear(actual)} dot="bg-accent" />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] tabular-nums text-muted">
        <span>{formatYear(domain[0])}</span>
        <span>{formatYear(domain[1])}</span>
      </div>
    </div>
  );
}

function Pin({
  pos,
  label,
  dot,
  className,
  top,
}: {
  pos: number;
  label: string;
  dot: string;
  className: string;
  top?: boolean;
}) {
  return (
    <div
      className={`absolute flex w-0 flex-col items-center ${className}`}
      style={{ left: `${pos}%`, top: top ? 0 : 24 }}
    >
      {top && <span className="mb-1 whitespace-nowrap font-mono text-[10px] tabular-nums">{label}</span>}
      <span className={`h-2.5 w-2.5 rounded-full ${dot} ring-2 ring-bg`} />
      {!top && <span className="mt-1 whitespace-nowrap font-mono text-[10px] font-semibold tabular-nums">{label}</span>}
    </div>
  );
}
