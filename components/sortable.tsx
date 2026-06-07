"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import type { War } from "@/lib/types";
import { formatRange } from "@/lib/quiz";
import { Flag } from "./flag";

export function Sortable({
  items,
  orderBy,
  onChange,
  onLock,
}: {
  items: War[];
  orderBy: "year" | "deaths";
  onChange: (next: War[]) => void;
  onLock: () => void;
}) {
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  // a hint that doesn't give away the sort key
  const hint = (w: War) => (orderBy === "deaths" ? formatRange(w.start, w.end) : w.region || w.sideA[0] || "");

  return (
    <div className="mt-5">
      <div className="space-y-2">
        {items.map((w, i) => (
          <div
            key={w.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
          >
            <span className="w-4 text-center font-mono text-xs text-muted">{i + 1}</span>
            <span className="inline-flex shrink-0 gap-1">
              {w.sideA.slice(0, 2).map((n, k) => (
                <Flag key={k} name={n} size={14} hideUnknown />
              ))}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{w.name}</div>
              <div className="text-[11px] lowercase text-muted">{hint(w)}</div>
            </div>
            <div className="flex flex-col">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="move up"
                className="text-muted transition-colors hover:text-accent disabled:opacity-30"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                aria-label="move down"
                className="text-muted transition-colors hover:text-accent disabled:opacity-30"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onLock}
        className="mt-5 w-full rounded-lg border border-accent/40 bg-accent/10 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
      >
        lock in order
      </button>
    </div>
  );
}
