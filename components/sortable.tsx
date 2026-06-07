"use client";

import { useRef, useState } from "react";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";
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
  const [dragId, setDragId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // a hint that doesn't give away the sort key
  const hint = (w: War) => (orderBy === "deaths" ? formatRange(w.start, w.end) : w.region || w.sideA[0] || "");

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const move = (i: number, dir: -1 | 1) => reorder(i, i + dir);

  // which slot is the pointer hovering, by row midpoints
  const slotFromY = (clientY: number) => {
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-row]") ?? []);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect();
      if (clientY < r.top + r.height / 2) return i;
    }
    return rows.length - 1;
  };

  return (
    <div className="mt-5">
      <div ref={listRef} className="space-y-2">
        {items.map((w, i) => {
          const dragging = dragId === w.id;
          return (
            <div
              key={w.id}
              data-row
              className={`flex items-center gap-2 rounded-lg border bg-surface px-2 py-2.5 transition-shadow ${
                dragging ? "border-accent/60 shadow-lg" : "border-border"
              }`}
            >
              <button
                aria-label="drag to reorder"
                onPointerDown={(e) => {
                  setDragId(w.id);
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (dragId !== w.id) return;
                  const from = items.findIndex((x) => x.id === w.id);
                  const to = slotFromY(e.clientY);
                  if (from !== -1 && to !== -1 && from !== to) reorder(from, to);
                }}
                onPointerUp={(e) => {
                  setDragId(null);
                  try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  } catch {}
                }}
                onPointerCancel={() => setDragId(null)}
                className="cursor-grab touch-none text-muted transition-colors hover:text-accent active:cursor-grabbing"
              >
                <GripVertical size={16} />
              </button>
              <span className="w-4 text-center font-mono text-xs text-muted">{i + 1}</span>
              <span className="inline-flex shrink-0 gap-1">
                {w.sideA.slice(0, 2).map((n, k) => (
                  <Flag key={k} name={n} size={14} hideUnknown />
                ))}
              </span>
              <div className="min-w-0 flex-1 select-none">
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
          );
        })}
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">drag the ⠿ handle or use the arrows</p>
      <button
        onClick={onLock}
        className="mt-3 w-full rounded-lg border border-accent/40 bg-accent/10 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
      >
        lock in order
      </button>
    </div>
  );
}
