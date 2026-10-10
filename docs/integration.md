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

## Nagi website guide and optional AI

Nagi works without a provider: suggested questions and typed Thai/English questions use the public facts in `src/data/nagi-knowledge.json`. Unknown questions explain guide mode rather than pretending to generate an AI response. Conversations stay in page memory and clear when the page reloads; the app does not write prompts to storage, analytics or application logs.

`GET /api/nagi` reports `guide` or `ai`. `POST /api/nagi` accepts up to eight user/assistant messages, 1,200 characters each and 6,000 in total, with a 12 KB body limit. System/tool roles are rejected. Local development and production preview route this endpoint through the same handler as the Vercel Function. Visits remains separate.

AI is disabled by default. To connect it later, configure **server-only** environment variables in the existing Vercel project (and an ignored local environment file for development):

1. Create a Vercel AI Gateway service/key and choose an available model from its current catalog. Set `AI_GATEWAY_API_KEY` and `NAGI_MODEL` (provider/model identifier). No model is selected automatically. Review the provider pricing and Gateway budget before enabling public access.
2. Configure an Upstash-compatible Redis REST endpoint using `NAGI_REDIS_REST_URL` (HTTPS) and `NAGI_REDIS_REST_TOKEN`. The atomic limiter allows at most 10 generations per client per 60-second window, 60 globally per window, and 300 globally per 24-hour window. Counter keys contain salted hashes, never raw IP addresses; they expire automatically. If the limiter fails, generation is blocked. These request caps supplement your provider spending budget.
3. Set `NAGI_AI_ENABLED=1` only after both services are ready, then deploy. All variables are required for AI mode. Never expose them with a `VITE_` prefix or commit them. The supplied example contains blank placeholders.
4. Verify the endpoint reports `ai` and send a test question. The UI marks AI mode and explains that messages go to the AI service. Suggested answers remain local.

The connector uses AI SDK `generateText` with public portfolio knowledge, no tools, a 600-token response ceiling, no automatic retries, and an 18-second timeout. Provider error details are never returned to visitors. Replies render as plain text. `npm run test:nagi` verifies guide-only operation, validation, durable rate limits and failure behavior using a fake provider; it does not assert a live model connection.

References: [AI Gateway](https://vercel.com/docs/ai-gateway), [AI SDK generateText](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text).
