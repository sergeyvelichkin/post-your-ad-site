# Contributing

## Expectations
- Keep PRs focused; link to a single GitHub issue where possible.
- Follow the PR template and include self-review notes + test evidence.
- Run `npm run lint`, `npm run typecheck`, and `npm run test` locally before opening a PR.
- Write or update docs when behaviour changes; explain risky areas and mitigations.

## Branch Strategy
- Default branch: `main`.
- Use conventional branch names, e.g. `feature/f-101-anon-canvas`, `bugfix/b-123-rate-limit`.
- Rebase over merge commits to keep history linear.

## Code Style
- TypeScript everywhere (strict mode) with explicit return types on exported functions.
- Keep modules small; prefer composition over inheritance.
- Log structured data (JSON) with context, never stack traces alone.

## Testing
- Unit tests with Vitest (UI + API).
- Contract/integration tests around HTTP endpoints and pricing maths.
- Snapshot tests sparingly; prefer semantic assertions.
- Playwright E2E planned once core flows exist.

## Security / Data Hygiene
- Never commit secrets; rely on `.env` with `.env.example` updates.
- Validate all inputs via zod schemas (server + client boundary).
- Apply rate limiting and captcha challenges on anonymous mutation endpoints.
