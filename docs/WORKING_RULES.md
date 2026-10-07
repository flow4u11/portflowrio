# Portfolio working rules

Owner instructions, 2026-10-07. Keep these rules and source links available across context handoffs.

- Check account usage at the start, after implementation, and before deployment. Log readings with Bangkok time in WORKLOG. Readings are shared account limits, not a precise per-task token budget. Prioritize required changes and preserve a reserve; do not start optional work that the remaining budget cannot cover.
- Record completed work, pending work, validation, and deployment status before stopping or approaching limits.
- Keep the final response focused on the working site and material limitations. Do not send unnecessary screenshots, video, or other artifacts the owner can inspect directly.
- Use supplied references as ideas; keep the portfolio original and never copy the reference website.
- Prefer bounded opacity/transform animations. Pause idle work when hidden/offscreen; support reduced motion. Avoid continuous React updates or layout reads on page scroll.
- Requested model: GPT-6.1 Sol Ultra. Use this model/effort for delegated coding when available; do not claim to have changed the current chat model through code.
- Current brand text: `flowrio.` and `portflorio.`; website/project/repository name remains `kimportflowrio`.

## Sources and owner data

- Iris interaction: https://motion.dev/examples/react-curtains-iris-click
- Portfolio reference, inspiration only, copying forbidden: https://renlenon.vercel.app
- School Ledger live: https://school-ledger-beta.vercel.app
- School Ledger source: https://github.com/flow4u11/student-grade-system
- Owner: Gmail flowxyzy@gmail.com; Discord flow4u; GitHub https://github.com/flow4u11
- Screenshot supplied 2026-10-07 identifies the About aside to remove: large star and “A curious mind. An eye for the details.”
- Live portfolio: https://kimportflowrio.vercel.app
- Private source: https://github.com/flow4u11/kimportflowrio; main automatically deploys to Vercel.
- Supabase uses the existing school project with an isolated private Visits schema; keep school data intact and all server secrets out of source/frontend/output.
