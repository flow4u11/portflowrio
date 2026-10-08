# flowrio

My portfolio for design, games, and interactive experiences.

[Visit the portfolio](https://myflowrio.vercel.app).

## Local preview

Use Node.js 22.12 or later:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. The development server serves the frontend and Visits API together.

## Experience

- Light/Dark themes with an iris transition. The About theme experiment accepts `neo`, `brutalism` and `neobrutalism`, with faint inline Tab completion.
- English/Thai key information, short scramble transitions, genuine tool icons, and separate toolkit and technology collections, each moving in two rows ordered by category.
- Shared particle background, bounded 2.5D viewport reveals, a moving name gradient with a fixed font, and full-viewport, once-per-session paper confetti with gravity, air resistance and flutter. Motion pauses when hidden/offscreen and respects reduced-motion preferences.
- A minimal centered scramble loader with Shiny Text holds its completed bar before the connected Hero entrance. The profile uses a blue many-point verification star.
- A hidden Hero interaction scatters letters and components with bounded impulse physics and continued idle motion. Hold a piece to preview its dotted curved shot home, then release or click to return it. Keyboard controls, reset and inactivity restoration are included.
- Noto Sans Thai for Thai content, graduation-year counting, experience status, and Instagram contact.
- LastStand, my first Unreal Engine 5 FPS project; the live School Ledger app; and three layouts reserved for future projects.
- Nearly full-screen motion settings from the top-left wordmark: star speed/count/scale, Pixel Snow, component pace, optional FPS, portrait pixels, pointer trail, gallery animation and toolkit motion. Customize a five-stop name gradient, six color palettes, direction/speed and optional Shiny Text. Preferences are saved locally and older settings migrate automatically. Section links use finite eased scrolling with a perspective star tunnel, keyboard focus handling and user interruption.
- ReactBits WebGL FlexCarousel with five slots and native scrolling fallback, centered dialogs, a shuffled pixel portrait transition and a theme-aware pixel pointer trail.

## Stack

React, TypeScript, Vite, Tailwind CSS, Motion, Three.js, OGL and Lucide. The gallery renderer loads separately when needed. An optional Node.js Visits API backed by Supabase PostgreSQL is retained. The displayed technology collection also includes tools used in other projects.

## Visits

The footer has no visitor counter, and the page does not record new visits. The existing server endpoint is retained for optional future use. Configure server-only environment values using `.env.example`. Local environment files are ignored. See [integration](docs/integration.md) for storage and API behavior.

## Verification

```sh
npm run check
npm run test:visits
node --test src/components/hero-playground-physics.test.mjs src/components/motion-settings-model.test.mjs
npm run build
npm start
```

Production preview runs at http://127.0.0.1:4173. Builds are minified with source maps disabled; this does not make rendered design impossible to reproduce.

## Design and attribution

Original designs are created in Figma, with AI-assisted implementation. Project covers are original illustrations, not gameplay or app captures. LastStand links to the actual gameplay video; the packaged game is not included in this repository.

Original design, content, artwork and application code are reserved under [LICENSE](LICENSE). Third-party software and brand assets retain their own terms. See [component sources](docs/animate-ui-sources.md), [ReactBits sources and license](docs/react-bits-sources.md), and [icon sources](src/assets/icons/ATTRIBUTION.md).
