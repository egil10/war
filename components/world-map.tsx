"use client";

import { useEffect, useState } from "react";

type MapData = { width: number; height: number; countries: { id: string; d: string }[] };

// fetch + cache the precomputed paths once for the whole session
let cache: MapData | null = null;
let inflight: Promise<MapData> | null = null;
function loadMap(): Promise<MapData> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/world-paths.json")
      .then((r) => r.json())
      .then((d: MapData) => {
        cache = d;
        return d;
      });
  }
  return inflight;
}

export function WorldMap({
  primary = [],
  secondary = [],
  height = 230,
}: {
  primary?: string[];
  secondary?: string[];
  height?: number;
}) {
  const [data, setData] = useState<MapData | null>(cache);

  useEffect(() => {
    let alive = true;
    loadMap().then((d) => {
      if (alive) setData(d);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!data) {
    return (
      <div
        className="w-full animate-pulse rounded-lg border border-border bg-bg/40"
        style={{ height }}
      />
    );
  }

  const prim = new Set(primary);
  const sec = new Set(secondary);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-bg/40">
      <svg
        viewBox={`0 0 ${data.width} ${data.height}`}
        style={{ width: "100%", height }}
        role="img"
        aria-label="locator map"
      >
        {data.countries.map((c) => {
          const isPrim = prim.has(c.id);
          const isSec = sec.has(c.id);
          const fill = isPrim
            ? "rgb(var(--accent))"
            : isSec
            ? "rgb(var(--accent) / 0.45)"
            : "rgb(var(--border) / 0.55)";
          return (
            <path
              key={c.id}
              d={c.d}
              fill={fill}
              stroke="rgb(var(--bg))"
              strokeWidth={isPrim || isSec ? 0.6 : 0.4}
            />
          );
        })}
      </svg>
    </div>
  );
}
