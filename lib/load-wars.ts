import type { War } from "./types";

// session-wide cache of the full war set (shipped in public/, fetched on demand)
let cache: War[] | null = null;
let inflight: Promise<War[]> | null = null;

export function loadWars(): Promise<War[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/wars.json")
      .then((r) => r.json())
      .then((d: War[]) => {
        cache = d;
        return d;
      });
  }
  return inflight;
}

export function cachedWars(): War[] | null {
  return cache;
}
