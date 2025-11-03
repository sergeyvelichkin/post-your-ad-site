# GitHub Project Setup

1. Create a new GitHub Project (table layout) named "Ad Board Launch".
2. Columns: `Discovery`, `Ready`, `In Progress`, `Review`, `Blocked`, `Done`.
3. Saved views:
   - **Feature Funnel:** filter `label:feature` + `state:open`.
   - **Monetization:** filter `label:monetization` + `state:open`.
   - **Infra:** filter `label:infra`.
4. Automation rules:
   - When PR merged → move linked issue to `Done`.
   - When issue marked `triage` → auto-assign PM.
   - When issue gets `blocked` label → move to `Blocked` column.
5. Labels to seed:
   - `feature`, `bug`, `infra`, `monetization`, `discovery`, `needs-design`, `needs-research`, `size/XS` ... `size/XL`, `priority/P0- P3`.
6. Templates: use the Issue templates committed in `.github/ISSUE_TEMPLATE/`.
7. Reporting: configure charts for `Issues by status`, `Cycle time`, and `Throughput`.
