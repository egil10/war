# war quiz

> every war ever fought, one question at a time.

A single-page quiz over a curated dataset of ~120 wars spanning the Greco-Persian
Wars (499 BC) to the present. It starts the moment the page loads — no menu, no signup.

## game modes

- **guess the year** — when did a war begin?
- **who won?** — name the victor (or a stalemate)
- **name the war** — identify the conflict from the belligerents' flags
- **deadlier?** — which of two wars cost more lives
- **earlier?** — which of two wars began first
- **where?** — the main theatre of a war

Play **mixed** (the default) to get a random mode every question. Score, streak,
best streak and accuracy are tracked live. Answer with `1`–`4`, advance with `Enter`.

## stack

Next.js 15 (App Router) · Tailwind CSS 3 · next-themes · lucide-react. Flags via
[flagcdn](https://flagcdn.com); historical states fall back to a lettered badge.
Styling follows `BLUEPRINT.md` — one teal accent, hairline cards, lowercase labels.

## data

`data/wars.json` is hand-stitched from Wikipedia: name, dates, both sides (with
member countries), victor, outcome, region and a rough casualty estimate. Casualty
figures are historical approximations, not gospel.

## develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

Deployed on Vercel.
