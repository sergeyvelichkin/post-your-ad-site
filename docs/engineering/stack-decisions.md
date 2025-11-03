# Stack Decisions

## Frontend
- **React + Vite:** Fast DX with modern tooling, easy to co-locate tests and storybook (future).
- **TypeScript Strict Mode:** Enforce explicit types on exports; prevents implicit `any`.
- **Styling:** Tailwind vs. CSS Modules TBD; current prototype uses handcrafted CSS, will migrate to Tailwind once component inventory is known.
- **State Management:** Zustand (preferred) or Redux Toolkit once real-time state grows.

## Backend
- **Fastify:** High-performance HTTP server with first-class TypeScript support and plugin ecosystem.
- **fastify-type-provider-zod:** Typed route schemas shared via zod for runtime + compile-time safety.
- **zod:** Shared schema validation across API + client.
- **Socket.IO (planned):** Reliable WebSocket abstraction with fallbacks and room management.
- **Prisma (planned):** Developer-friendly ORM for PostgreSQL with migration tooling.

## Tooling
- **Turbo:** Orchestrates scripts across workspaces in parallel.
- **Vitest:** Fast unit/integration tests for both client and server.
- **ESLint (type-aware) + Prettier:** Enforce consistent style and catch issues early.
- **CI/CD:** GitHub Actions pipeline planned for lint/test/build + container publish.

## Alternatives Considered
- **Next.js** for SSR; deferred to keep API independent and highlight backend design.
- **NestJS** for backend; chosen Fastify for lighter weight and direct control over modules.
- **Yarn/Pnpm:** Staying with npm workspaces for recruiter familiarity, but project is workspace-agnostic.

## Risks & Mitigations
- **Real-time Scalability:** Socket.IO may require horizontal scaling; plan to introduce Redis adapter early.
- **Payments Complexity:** Stripe Connect adds compliance overhead; mitigate with staged rollout (test mode → manual payouts → automated).
- **Moderation Load:** Spam/abuse may spike; invest in tooling + automation in Phase 3.
