import warsData from "@/data/wars.json";
import type { War } from "@/lib/types";
import { Quiz } from "@/components/quiz";

const wars = warsData as War[];

export default function Page() {
  return (
    <>
      <Quiz wars={wars} />
      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-6 text-xs text-muted">
          a curated quiz over {wars.length} wars from {" "}
          <span className="tabular-nums">499 BC</span> to today. data hand-stitched from
          wikipedia; casualty figures are rough historical estimates. made for the love of
          history, not as a textbook.
        </div>
      </footer>
    </>
  );
}
