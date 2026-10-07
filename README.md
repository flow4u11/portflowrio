# kimportflowrio

Chayathorn Chianpolsane (Kim)'s portfolio: design, games, and interactive experiences.

Live: https://kimportflowrio.vercel.app
Source: https://github.com/flow4u11/kimportflowrio (private)

## Local preview

Node.js 22.12 or later:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. The custom development server serves the frontend and `/api/visits` together. Set `PORT` to change the port.

## Experience

- Light/dark themes with a circular iris from the toggle click; an iris curtain supports browsers without native View Transitions.
- One shared animated canvas background, brighter in light mode. Particle count, pixel density, and drawing rate are bounded; hidden tabs and reduced motion pause it.
- Native scrolling, one-time section entrances, a sliding navigation highlight, a rotating typewriter phrase, and idle arrow motion.
- Pixel portrait transition on hover, focus, or touch.
- LastStand project concept and the live [School Ledger](https://school-ledger-beta.vercel.app) app, with [source](https://github.com/flow4u11/student-grade-system).
- Creative tools and technologies used across Kim's projects.
- Gmail, Discord username copy, and GitHub contact links; centered accessible dialogs.
- Footer demo baseline of 1,284 plus a separate real anonymous browser counter. The Demo label explains the baseline.

## Stack

This portfolio uses React, TypeScript, Vite, Tailwind CSS, Motion, Lucide, and a Node.js visits API backed by Supabase PostgreSQL. The technology display also includes verified technologies from School Ledger; it does not imply every listed tool runs on this portfolio.

## Visits and deployment

Set server-only `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in ignored `.env.local` for cloud-connected local development. Without either setting, local preview uses `.data/visits.json`. Production on Vercel requires both settings and never writes a counter to an ephemeral filesystem.

Visits use the existing Supabase project in a separate private schema. Only hashes of random browser identifiers are persisted. The displayed demo baseline is never added to the database. See [integration details](docs/integration.md) and `.env.example`. Keep server keys outside source control and never use a `VITE_` prefix.

`vercel.json` deploys the Vite frontend and `/api/visits` as a server function. `.vercel` and environment files are ignored.

## Validation

```sh
npm run check
npm run test:visits
npm run build
npm start
```

Production preview runs at http://127.0.0.1:4173. Backend tests cover deduplication, concurrency, validation, Supabase requests, and failure handling. Browser checks cover themes, navigation, centered dialogs, focus return, and responsive layouts.

The School Ledger cover is an original illustration; LastStand's cover is a concept, not a gameplay capture. Original component license notices are documented in `docs/animate-ui-sources.md`; the background renderer and iris transition were rewritten for this version.
