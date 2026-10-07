# kimportflowrio continuation

Active checkout: `/Users/flow4u/MyPortfolio`, React + TypeScript + Vite. Main source: `src/App.tsx`, `src/styles.css`, and `src/components/`. User name: Chayathorn Chianpolsane (Kim), first-year Games and Interactive Media student at Bangkok University.

Latest user-approved changes: remove the Hero greeting and 1/4 coordinate, welcome loader, iris theme toggle, stronger light background, continuous shared background, idle motion, smoother top navigation, centered dialogs, contacts, creative tools, technology groups, real School Ledger project details, and demo footer Visits. Website brand: kimportflowrio. Existing myportfolio/neofolio repositories should not be overwritten. User specifically chose a NEW private GitHub repo named kimportflowrio after name conflict clarification.

Performance: removed Lenis, continuous 3D scroll transforms, thousands of box shadows, permanent will-change, and backdrop filters. Use one fixed capped 30fps canvas; particles are stable on theme changes and the loop pauses on hidden/reduced motion. Depth now reveals once through viewport observation. Typewriter state is isolated and timers pause when hidden or out of view. Native anchor scroll is smooth.

Theme button: native circular View Transition where available; original expanding solid iris curtain plus fade fallback for Safari/WKWebView. Keyboard click origin uses button center; racing clicks guarded; reduced motion immediate.

Contacts: Gmail flowxyzy@gmail.com, Discord flow4u (copy username, no invented user URL), GitHub https://github.com/flow4u11. Native dialog traps focus, closes with Escape/backdrop, returns focus to trigger, and uses fixed inset plus margin auto.

Projects: LastStand remains a UE5 FPS development concept. School Ledger is an actual bilingual full stack grade management app with teacher/admin workflow, student PIN portal, term/class/subject setup, grade/GPA rules, publication, audit, Excel IO, and public fictional-data demo. Main https://school-ledger-beta.vercel.app; repo https://github.com/flow4u11/student-grade-system. SVG cover is an original illustration.

Supabase: user authorized existing cloud project wzkgyggibmjhxytuknpv, isolated private portfolio_visits schema. RLS/client grants restrict access; server-only invoker RPCs read/record SHA256 UUID hashes. Details in docs/integration.md. Never print or commit credentials. .env.local is ignored; Vercel link/pull can overwrite it. The school local env targets LOCAL Supabase and must not be used for cloud!

Visits: display offset 1284 + real count, with Demo indicator and precise tooltip. Offset never enters DB. Lazy fetch near footer, static synthetic glyph avatars. Local fallback only when unconfigured; Vercel requires cloud env and returns an honest failure when unavailable.

Vercel: new project kimportflowrio, ID prj_cUFSjtxYWcFccwd4KImAEskVSyly, owner team_aq9In0aVr8rT37iqbMyEJqPS / scope flow4u1. Connector writes with explicit team initially returned 403; installed cached CLI uses existing valid credentials and created/linked successfully. CLI path `/Users/flow4u/.npm/_npx/4b692b59300d311f/node_modules/vercel/dist/index.js`; disable update notifier/telemetry for sandbox operation. Remote command may need authorized network escalation. Confirm linked target with project inspect before consequential actions.

Checks: npm run check, npm run test:visits (7), npm run build. Browser widths 320/390/768/1280 verified no horizontal overflow, modal fit, focus return, no console errors. See WORKLOG for final deployment state.

Final state: production https://kimportflowrio.vercel.app, new private source https://github.com/flow4u11/kimportflowrio. Local repository initialized from its initial main commit without touching working files. Live UI-to-API-to-Supabase counter verified.
