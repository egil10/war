import warsData from "@/data/wars.json";
import type { War } from "@/lib/types";
import { Quiz } from "@/components/quiz";

const wars = warsData as War[];

export default function Page() {
  return (
    <>
      <Quiz wars={wars} />
      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-5 text-xs text-muted">
          {wars.length} wars · <span className="tabular-nums">499 BC</span> → today · data from
          wikipedia
        </div>
      </footer>
    </>
  );
}
