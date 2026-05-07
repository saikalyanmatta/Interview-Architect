# InterviewAI

A full-stack AI-powered interview platform with an employer portal for creating interviews and a candidate portal for taking AI-adaptive interviews with voice-guided questions, coding challenges, and automatic scoring.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `SESSION_SECRET`, `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifact: `artifacts/ai-interview`, port 23688)
- API: Express 5 (artifact: `artifacts/api-server`, port 8080)
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec`)
- Build: esbuild (CJS bundle)
- AI: OpenAI via Replit AI Integrations (`@workspace/integrations-openai-ai-server`)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all routes)
- `lib/api-zod/src/generated/api.ts` — Zod schemas for backend validation
- `lib/api-client-react/src/generated/api.ts` — React Query hooks for frontend
- `lib/db/src/schema/` — Drizzle ORM schema files
- `artifacts/api-server/src/routes/` — Backend route handlers
  - `auth.ts` — register, login, logout, me
  - `employer.ts` — job profiles, interviews, invitations, sessions, stats
  - `candidate.ts` — access check, sessions, questions, answers, coding
  - `interview.ts` — TTS, coding question generation
  - `openai/index.ts` — conversations, messages
- `artifacts/ai-interview/src/pages/` — Frontend pages
  - `candidate/` — landing, setup, interview-room, coding-challenge, results
  - `employer/` — login, register, dashboard, job-profiles/*, interviews/*

## Architecture decisions

- Auth uses simple Base64-encoded JWT-like token stored in localStorage under `auth_token`. The custom-fetch in `@workspace/api-client-react` reads it automatically as a Bearer token.
- OpenAI integration is handled via Replit AI Integrations proxy — no direct API key management needed.
- Adaptive question difficulty: backend adjusts difficulty based on rolling average of last 3 answer scores.
- Interview phases: intro → behavioral → technical → coding → completed. Each phase is tracked in the session record.
- TTS uses `@workspace/integrations-openai-ai-server/audio`'s `textToSpeech` function; tone maps to OpenAI voice (alloy, nova, onyx, shimmer).
- `pnpm --filter @workspace/api-spec run codegen` runs orval then `typecheck:libs`. The typecheck:libs step may fail due to template TS bugs in `integrations-openai-ai-server/react` — this doesn't affect the generated output (orval runs first).

## Product

- **Candidate portal**: Enter interview ID + email to access, configure difficulty/tone/language, answer adaptive AI-generated questions with voice playback, complete coding challenges, and view scored results.
- **Employer portal**: Register/login, create job profiles with weighted skills, schedule interviews, invite candidates by email, monitor sessions and review detailed scored answers.

## User preferences

- Deep navy/electric blue dark theme throughout.
- No emojis in UI.
- Dense, information-rich layouts for employer views; focused, immersive for candidate views.

## Gotchas

- Run `pnpm --filter @workspace/db run push` after schema changes.
- The codegen typecheck:libs step may fail on `integrations-openai-ai-server` template bugs — run `pnpm --filter @workspace/api-spec exec orval` directly if you only want to regenerate hooks.
- The `conversations` and `messages` DB tables do NOT have a `Table` suffix (unlike `usersTable`, `jobProfilesTable` etc.).
- Wouter `Link` renders as `<a>` — never nest `<a>` inside `<Link>`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
