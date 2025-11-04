# Local Development Playbook

## Commands
| Task | Command |
| --- | --- |
| Install deps | `nvm use 20 && npm install` |
| Start all apps | `npm run dev` |
| Start web only | `npm run dev -- --filter=@post-your-ad/web` |
| Start API only | `npm run dev -- --filter=@post-your-ad/api` |
| Lint | `nvm use 20 && npm run lint` |
| Type-check | `nvm use 20 && npm run typecheck` |
| Tests | `nvm use 20 && npm run test` |
| Format | `npm run format` |

## API Environment
- Copy `apps/api/.env.example` → `apps/api/.env`.
- For local testing leave Stripe keys empty; routes gracefully handle missing keys until monetization lands.
- Set `CANVAS_ADMIN_TOKEN` for privileged actions (e.g., board clear). Example: `CANVAS_ADMIN_TOKEN=dev-secret` and use `curl -X POST http://localhost:4000/api/boards/downtown-wall/canvas/clear -H 'x-admin-token: dev-secret'`.
- `SESSION_COOKIE_NAME` defaults to `pyas_session`; update if you need to avoid collisions with other local apps.

## Data Stores (Upcoming)
- PostgreSQL via Docker Compose (`docker compose up db redis`).
- Prisma migrations in `apps/api/prisma/migrations` (to be added).
- Seed scripts for sample boards and pricing fixtures.

## Dev Notes
- Use `tsx` for fast TypeScript execution in dev (`npm run dev -- --filter=@post-your-ad/api`).
- Prefer `vitest` integration tests for HTTP endpoints; avoid hitting live Stripe in unit tests.
- Keep feature flags in `apps/api/src/config/flags.ts` (planned) for toggling experiments.
- Canvas MVP stores events in-memory; expect reset on server restart. Tests use the shared reset helper in `canvas-store`.

## Quality Gates
- Every PR must pass lint, typecheck, tests.
- Add targeted unit tests for bug fixes.
- Record manual QA steps in the PR template under "Testing".
