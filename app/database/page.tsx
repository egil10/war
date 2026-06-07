import type { Metadata } from "next";
import curated from "@/data/curated.json";
import type { War } from "@/lib/types";
import { Explorer } from "@/components/explorer";

const seed = (curated as War[]).map((w) => ({ ...w, featured: true }));

export const metadata: Metadata = {
  title: "the database — war quiz",
  description: "Browse every war in the set: search and filter thousands of conflicts by region and era.",
};

export default function DatabasePage() {
  return <Explorer seed={seed} />;
}
