# Architecture Overview

## High-Level System Map
- **Web (React + Vite)** renders the real-time canvas, placement catalog, and pricing UI. It manages optimistic updates locally (Zustand/Redux TBD) and synchronises over Socket.IO.
- **API (Fastify + Websocket)** exposes REST + WebSocket endpoints. It handles validation (Fastify + Zod type provider), rate limiting, pricing calculations, persistence orchestration, and broadcast fan-out.
- **Persistence (Planned)**
  - PostgreSQL: canonical store for boards, placements, orders, audit history.
  - Redis: ephemeral pub/sub for live canvas events, rate limits, queue buffering.
  - S3-compatible storage: optional snapshot exports and media uploads.
- **Payments (Planned)**
  - Stripe for placement checkout, Connect for board-owner payouts.
  - Internal ledger to track balances, service fees, and pending payouts.

## Request / Event Flows
1. **Anonymous Post (Free Tier)**
   - Client collects stroke/text payload → REST `POST /canvas-events` (auth optional).
   - API validates payload (zod) and stores event log.
   - Event is published to Redis channel → broadcast to connected clients.
   - Nightly job prunes expired events and generates board snapshots for SEO.

2. **Paid Placement**
   - Client hits `GET /boards/:slug/tiers` for available inventory and pricing.
   - User selects tier → `POST /boards/:slug/quote` returns pricing breakdown.
   - Checkout session initiated via Stripe; upon webhook success, API confirms booking, stores order, schedules start/end windows, and credits board-owner ledger.

3. **Board Owner Payout**
   - Owner triggers payout request in dashboard.
   - API validates balance, creates Stripe transfer, stores transaction + fee breakdown.
   - Notifications + analytics event emitted for reporting.

## Modules & Responsibilities
- `apps/web`
  - Presentation (React), drawing/text tools, board marketplace UX.
  - State: global session/user, board selection, optimistic cache of events.
  - Service layer for REST/WebSocket clients.
  - Testing: Vitest + Testing Library, Playwright for E2E (planned).
- `apps/api`
  - Routing (Fastify) with typed schemas via zod provider.
  - Modules: auth, boards, pricing, placements, orders, payouts, moderation.
  - Cross-cutting: logging (pino), metrics (Prometheus exporter), error handling, rate limiting middleware.
  - Testing: Vitest unit/integration + k6 load profile (planned).
- `packages`
  - Shared TypeScript configs today; future: shared types (`@post-your-ad/types`), SDK clients, UI kit.

## Observability & Ops (Target State)
- Structured logging with request correlation IDs.
- Metrics: request rates, latency, failed placements, revenue per board, churn.
- Alerts: payment webhook failures, payout discrepancies, rate-limit spikes.
- Deploys: CI (GitHub Actions) → container build → staging + prod on Fly.io/Render.
- Feature flags: config-driven to gate monetization experiments.

## Security & Compliance Considerations
- Optional auth with JWT + refresh tokens; anonymous sessions tracked with signed cookies.
- Spam controls: captcha fallback, rate limiting, moderation queue.
- Payment compliance: PCI handled by Stripe; store only references/receipts.
- Data retention: purge anonymous content per retention policy; GDPR/CCPA data export pipeline.

## Open Questions
- Level of real-time collaboration required (cursor presence vs. event streaming only).
- Monetization experiments needed at launch (tiered pricing vs. auction model).
- Governance for community-run boards (revenue share, moderation rights, dispute handling).
