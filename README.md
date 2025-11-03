# Post Your Ad Board

A collaborative whiteboard marketplace where anyone can drop sketches, text ads, and premium placements across community-run boards. Visitors can jump in anonymously, upgrade to claim profiles, and board owners can monetize high-demand canvas real estate.

## Repo Layout

```
apps/
  web/   # React + Vite client
  api/   # Node/Fastify API + websocket entry point
packages/
  tsconfig/ # Shared TypeScript config
```

Key documentation lives in [`docs/`](./docs/).

## Getting Started

**Prerequisites**
- Node.js v18.17+
- npm v9+ (or pnpm/yarn if you prefer)

```bash
# Install all workspace dependencies	npm install

# Start both web and API in dev mode with Turbo	npm run dev

# Start a single workspace	npm run dev -- --filter=@post-your-ad/web
npm run dev -- --filter=@post-your-ad/api

# Type-check, lint, and test across the monorepo
npm run typecheck
npm run lint
npm run test
```

Environment variables for the API live in `.env`; see [`apps/api/.env.example`](apps/api/.env.example).

## What’s Ready
- React front door that frames the value prop, monetization tiers, and CTA copy for early adopters.
- Fastify backend shell with env validation, health check, and mocked board pricing endpoints.
- Shared tooling: Turbo, ESLint (type-aware), Prettier, Vitest setups, and Testing Library for UI.
- PR / issue templates aligned with self-review discipline and discovery-first workflow.

## Next Steps (High Level)
1. Implement realtime canvas foundation (Socket.IO channels, stroke persistence, replay snapshots).
2. Wire anonymous session tokens + optional OAuth for profile upgrades.
3. Flesh out pricing engine, availability rules, and Stripe test-mode checkout.
4. Ship board-owner dashboard with analytics, moderation, and payout ledger.
5. Stand up CI (GitHub Actions), container build, and deploy pipeline (Fly.io / Render).

For a detailed roadmap and backlog, see [`docs/product/roadmap.md`](./docs/product/roadmap.md) and [`docs/product/backlog.md`](./docs/product/backlog.md).
