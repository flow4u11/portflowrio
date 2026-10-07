# kimportflowrio integrations

## Visit counter

The footer shows a **1,284 presentation offset plus recorded anonymous browsers**. The owner requested removing the visible Demo badge on 2026-10-07; tooltip and accessibility text still explain the split. The offset is presentation data only: it is never inserted into Supabase. Glyph avatars are generated shapes rather than visitor photos.

The browser keeps one random UUID under `portfolio-visitor-v1` in local storage. When the footer comes within 600 px of the viewport, the page sends that UUID once to the same-origin `/api/visits` endpoint. The server hashes it before storage. Refreshing the same browser does not increase its unique count. Clearing storage or using another browser creates another identifier; this is a browser count rather than verified people. No IP address, email, or raw UUID is stored.

## Supabase

The existing project `wzkgyggibmjhxytuknpv` holds visits in the isolated `portfolio_visits.visitors` table. Its table has RLS enabled and no anonymous or authenticated grants. The two `public.kimportflowrio_*` RPCs use `SECURITY INVOKER`, an empty search path, and grant execution only to `service_role`. The server role receives only SELECT and INSERT on this table. The primary key makes duplicate and concurrent recording idempotent.

The exact applied setup is in `server/visits-schema.sql`; the remote migration is named `kimportflowrio_private_visits`. This file is a reviewed SQL setup reference, not a locally generated migration-history file. Existing student-grade-system tables, authentication, and functions are not modified.

Set these server environment variables in Vercel and, optionally, `.env.local` for local development:

```dotenv
SUPABASE_URL=https://wzkgyggibmjhxytuknpv.supabase.co
SUPABASE_SECRET_KEY=your-server-only-secret-key
```

Legacy service-role JWTs are accepted as `SUPABASE_SERVICE_ROLE_KEY`. Modern `sb_secret_` keys are preferred. Neither variable may use a `VITE_` prefix or appear in source control or frontend code. The frontend does not need a Supabase key. A publishable-only configuration cannot access this private counter.

If the database is unavailable, the footer retains its labeled demo value and offers Retry. It never invents a real count or writes to a serverless filesystem. Local development without any Supabase settings keeps the existing `.data/visits.json` fallback; partially configured settings fail visibly instead of silently switching storage.

## Vercel and GitHub

`vercel.json` builds the Vite frontend and deploys `api/visits.mjs` as a Node function. The API supports Vercel's parsed request body as well as the local streaming request body. JSON, UUID, origin, request size, response shape, and upstream timeout are checked. API responses cannot be cached.

Production is live at https://kimportflowrio.vercel.app with server variables configured. Source is pushed to the new private `flow4u11/kimportflowrio` repository. Both frontend and API deploy together; no frontend keys or database passwords are necessary.

The official Vercel GitHub App is installed with access limited to `kimportflowrio`, after the owner approved access and completed GitHub Mobile verification. The Vercel project is connected to `flow4u11/kimportflowrio`; production branch is `main`, and fork protection remains enabled. Pushes to `main` trigger production deployments. Production Supabase variables are already configured; preview deployments intentionally have no database credential.

## Verification

`npm run test:visits` covers deduplication, concurrent local arrivals, corrupt-file handling, Supabase hash-only requests, error responses, production configuration, Vercel JSON parsing, and HTTP input limits. Remote verification also recorded one isolated test hash twice concurrently as `service_role`, confirmed one row, checked that `anon` and `authenticated` lack counter access, then deleted only that test row.

Supabase's RLS-without-policy informational notice is intentional for this server-only private table. The table has no grants to client roles; `service_role` bypasses RLS. Existing school-app advisor notices remain outside the scope of this portfolio change.

References: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [securing the Data API](https://supabase.com/docs/guides/api/securing-your-api), [database functions](https://supabase.com/docs/guides/database/functions), [Vercel Node runtime](https://vercel.com/docs/functions/runtimes/node-js).
