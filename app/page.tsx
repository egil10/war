import curated from "@/data/curated.json";
import type { War } from "@/lib/types";
import { Quiz } from "@/components/quiz";

const seed = (curated as War[]).map((w) => ({ ...w, featured: true }));

export default function Page() {
  return (
    <>
      <Quiz seed={seed} />
      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-5 text-xs text-muted">
          every war ever fought · <span className="tabular-nums">2500 BC</span> → today · data from
          wikipedia ·{" "}
          <a href="/database" className="transition-colors hover:text-accent">
            browse the database
          </a>
        </div>
      </footer>
    </>
  );
}
