# kimportflowrio

My portfolio for design, games, and interactive experiences.

[Visit the portfolio](https://kimportflowrio.vercel.app).

## Local preview

Use Node.js 22.12 or later:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. The development server serves the frontend and Visits API together.

## Experience

- Light/Dark themes with an iris transition. An About keyword experiment unlocks a separate neobrutalism design.
- English/Thai key information, short scramble transitions, genuine tool icons, and separate toolkit and technology collections, each moving in two rows ordered by category.
- Shared particle background, bounded 2.5D viewport reveals, a moving name gradient with a fixed font, and full-viewport, once-per-session paper confetti with gravity, air resistance and flutter. Motion pauses when hidden/offscreen and respects reduced-motion preferences.
- Noto Sans Thai for Thai content and a blue scalloped profile check badge.
- LastStand, my first Unreal Engine 5 FPS project; the live School Ledger app; and three layouts reserved for future projects.
- Motion settings from the top-left wordmark: star speed/count, component pace and an optional FPS estimate, saved locally. Section links use native smooth scrolling with keyboard focus handling and user interruption.
- Native gallery scrolling, centered dialogs with keyboard focus handling, contact/profile links, and a hover/focus portrait transition.

## Stack

React, TypeScript, Vite, Tailwind CSS, Motion and Lucide. An optional Node.js Visits API backed by Supabase PostgreSQL is retained. The displayed technology collection also includes tools used in other projects.

## Visits

The footer has no visitor counter, and the page does not record new visits. The existing server endpoint is retained for optional future use. Configure server-only environment values using `.env.example`. Local environment files are ignored. See [integration](docs/integration.md) for storage and API behavior.

## Verification

```sh
npm run check
npm run test:visits
npm run build
npm start
```

Production preview runs at http://127.0.0.1:4173. Builds are minified with source maps disabled; this does not make rendered design impossible to reproduce.

## Design and attribution

Original designs are created in Figma, with AI-assisted implementation. Project covers are original illustrations, not gameplay or app captures. LastStand links to the actual gameplay video; the packaged game is not included in this repository.

Original design, content, artwork and application code are reserved under [LICENSE](LICENSE). Third-party software and brand assets retain their own terms. See [component sources](docs/animate-ui-sources.md) and [icon sources](src/assets/icons/ATTRIBUTION.md).
