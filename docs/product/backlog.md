# Backlog – Initial User Stories

## F-101 Anonymous Canvas Posting MVP
- **Persona:** Drive-by visitor who wants to drop a message instantly.
- **Outcome:** User submits drawing/text without signup and sees it appear live.
- **Acceptance Criteria:**
  - Canvas supports drawing (mouse/touch) + text notes.
  - Posts persist in database and reload on refresh.
  - Rate limits + spam filters guard against abuse.
  - Admin can clear board and archive export.
- **Instrumentation:** Track posts per hour, active sessions, clear events.
- **Dependencies:** Canvas engine, session token service, persistence schema.

## F-102 Board Owner Pricing Configuration
- **Persona:** Authenticated board owner customizing monetization.
- **Outcome:** Owner defines placement tiers (size, zone, price, duration) and sets availability windows.
- **Acceptance Criteria:**
  - CRUD for tiers with validation + preview.
  - Pricing changes versioned and logged.
  - Board catalog reflects updated pricing instantly.
- **Instrumentation:** Track tier creation, conversion per tier, price adjustments.
- **Dependencies:** Auth, board schema, pricing engine.

## F-103 Paid Placement Checkout (Stripe Test Mode)
- **Persona:** Visitor purchasing a premium slot.
- **Outcome:** User pays for desired tier; order recorded; board updates when placement starts.
- **Acceptance Criteria:**
  - Quote endpoint returns cost breakdown (base, fees, taxes).
  - Stripe checkout session created; webhook confirms payment.
  - Ledger entries for platform fee vs. board owner share.
  - Email/notification summary to purchaser + owner.
- **Instrumentation:** Checkout funnel, payment success rate, revenue per board.
- **Dependencies:** Pricing engine, Stripe integration, email service.

## F-104 Board Marketplace Directory
- **Persona:** Visitor browsing boards.
- **Outcome:** Discover boards via search/filter, view stats, choose posting destination.
- **Acceptance Criteria:**
  - Directory with filters (topic, CPM, owner rating).
  - Board detail page with live preview + availability calendar.
  - Featured/sponsored slots for revenue uplift.
- **Instrumentation:** Directory visits, filter usage, selection to conversion rate.
- **Dependencies:** Board metadata, analytics, sponsorship config.

## F-105 Moderation & Abuse Controls
- **Persona:** Moderator/board owner.
- **Outcome:** Rapidly address spam/abuse without harming honest posts.
- **Acceptance Criteria:**
  - Report flag workflow, escalation queue, audit log.
  - Automated heuristics (keyword filters, flood detection).
  - Ban/timeout controls per session/IP.
- **Instrumentation:** Reports per day, resolution time, false positives.
- **Dependencies:** Auth roles, session metadata, notification channel.

## F-106 Creator Referral Program (Credits)
- **Persona:** Board owner promoting platform.
- **Outcome:** Earn credits when invited creators purchase placements.
- **Acceptance Criteria:**
  - Referral links tied to board owner.
  - Credits applied to fees/payouts.
  - Dashboard shows referral performance.
- **Instrumentation:** Referral conversions, credit redemption, ROI.
- **Dependencies:** Billing ledger, analytics, email.

## I-201 Infrastructure & Observability Foundation
- **Scope:** GitHub Actions CI, Docker images, Fly.io staging + prod, logging & metrics.
- **Acceptance Criteria:**
  - CI runs lint/typecheck/test on PR.
  - Deploy pipelines with manual approval gates.
  - Centralized logs, uptime alerts, dashboard for KPIs.
- **Dependencies:** Containerization, secrets management, monitoring stack.

## D-301 Monetization Experimentation Discovery
- **Goal:** Validate pricing elasticity and placement tier appetite.
- **Research Tasks:**
  - Customer interviews with board owners & advertisers.
  - Competitive pricing analysis.
  - Experiment plan for tiered vs. auction pricing.
- **Deliverables:** Recommendation doc, updated pricing schema, experiment backlog.
