# Visits integration

The footer combines a presentation baseline of 1,284 with recorded anonymous browsers. The baseline is never stored in the database. The counter does not claim to measure verified people.

The browser creates a random UUID and sends it to the same-origin `/api/visits` endpoint when the footer approaches. Only a SHA-256 hash is persisted. Reloading the same browser does not increase the count; clearing storage or using a different browser creates a new identifier. No IP address, contact information, or raw UUID is stored.

## Configuration

Copy `.env.example` to ignored `.env.local` and configure server-only `SUPABASE_URL` and `SUPABASE_SECRET_KEY`. Legacy `SUPABASE_SERVICE_ROLE_KEY` is also supported. Never prefix a server credential with `VITE_`.

`server/visits-schema.sql` is the database setup reference. It creates an isolated private counter schema with no anonymous/authenticated table grants and server-only RPC execution. The primary key makes duplicate recording idempotent. No other application data is used by the counter.

Local preview without database settings uses ignored `.data/visits.json`. Partial configuration fails visibly. Vercel production requires database configuration and never persists to an ephemeral local filesystem. An unavailable counter retains the presentation baseline and offers Retry.

`vercel.json` builds the frontend and deploys the API. Environment and generated deployment configuration are excluded from source control. The API validates input, origin, response shape and upstream timeouts; responses are not cacheable.

## Checks

`npm run test:visits` checks duplicate/concurrent arrivals, corrupt local data handling, hash-only database requests, failure handling, server configuration, request parsing and HTTP limits.
