# Visits integration

The portfolio currently has no visitor counter. The frontend does not call the Visits API or record browser identifiers. The existing server endpoint and database remain available for optional future use.

The retained API accepts a random UUID, hashes it with SHA-256 and records only that hash. Duplicate recording is idempotent. No IP address, contact information or raw UUID is stored.

## Configuration

Copy `.env.example` to ignored `.env.local` and configure server-only `SUPABASE_URL` and `SUPABASE_SECRET_KEY`. Legacy `SUPABASE_SERVICE_ROLE_KEY` is also supported. Never prefix a server credential with `VITE_`.

`server/visits-schema.sql` is the database setup reference. It creates an isolated private counter schema with no anonymous/authenticated table grants and server-only RPC execution. The primary key makes duplicate recording idempotent. No other application data is used by the counter.

Local preview without database settings uses ignored `.data/visits.json`. Partial configuration fails visibly. Vercel production requires database configuration and never persists to an ephemeral local filesystem. API failures return an error response rather than fabricating a count.

`vercel.json` builds the frontend and deploys the API. Environment and generated deployment configuration are excluded from source control. The API validates input, origin, response shape and upstream timeouts; responses are not cacheable.

## Checks

`npm run test:visits` checks duplicate/concurrent arrivals, corrupt local data handling, hash-only database requests, failure handling, server configuration, request parsing and HTTP limits.

## Appearance defaults

First visits and Reset to defaults use the shared preset in `src/components/motion-settings-model.ts`. Changes saved by a visitor remain in that browser. Updating the shared preset requires a reviewed source change and deployment; the public Settings panel only changes personal preferences. Gallery motion defaults off on mobile, and reduced motion takes priority.
