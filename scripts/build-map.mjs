// Precompute SVG country paths from a world topojson so the app ships a static,
// dependency-free locator map (no d3/topojson at runtime). Run: node scripts/build-map.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import { geoEqualEarth, geoPath } from "d3-geo";

const WIDTH = 800;
const HEIGHT = 380;

const topo = JSON.parse(readFileSync("scripts/world-110m.json", "utf8"));
const fc = feature(topo, topo.objects.countries);

const projection = geoEqualEarth().fitSize([WIDTH, HEIGHT], fc);
const path = geoPath(projection);

const countries = fc.features
  .map((f) => ({ id: String(f.id), d: path(f) }))
  .filter((c) => c.d);

writeFileSync(
  "public/world-paths.json",
  JSON.stringify({ width: WIDTH, height: HEIGHT, countries })
);

console.log(`wrote public/world-paths.json — ${countries.length} countries`);
