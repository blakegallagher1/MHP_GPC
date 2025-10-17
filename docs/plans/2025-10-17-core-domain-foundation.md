# Plan: Core Domain Foundation

## Goal
Establish the foundational backend scaffolding for the MHP acquisition pipeline, covering domain models, persistence, APIs/workers skeletons, and supporting infrastructure for financial screening and diligence workflows.

## Objectives
1. Scaffold a TypeScript/Node monorepo structure under `apps/` and `packages/` aligned with AGENTS guidelines.
2. Define initial Prisma schema for Postgres/PostGIS capturing owners, parks, leads, deals, touchpoints, documents, tasks, and risk artifacts.
3. Generate initial migration for the schema and configure database client with typed accessors in `packages/services`.
4. Implement service-layer modules encapsulating domain logic and pipeline operations with placeholder implementations ready for expansion.
5. Expose REST API endpoints and worker job handlers for key pipeline stages (intake, screening, diligence, post-close) with structured DTOs and validation.
6. Add a financial screening engine module supporting scenario configuration and evaluation outputs (buy-box checks, rate shock sensitivity) with unit tests covering core calculations.
7. Stub DD command center workflows (checklists, risk scoring, file handling) and consent-logged direct mail/heir sourcing automation hooks.
8. Provide dashboard/report builders (executive summary, acquisition sheet, DD binder) and schedule placeholder re-score jobs reacting to domain events.

## Approach
- Use pnpm workspace with TypeScript targeting Node 20. Configure `packages/config` for environment management and `packages/core` for shared utilities.
- Adopt Prisma ORM with PostgreSQL + PostGIS extension. Utilize migration scripts under `prisma/migrations` managed via `pnpm prisma migrate dev`.
- Model domain entities with relational structure and enum types per acquisition lifecycle. Include auditing metadata for compliance.
- Implement service modules as classes/functions under `packages/services` separated by bounded context (crm, pipeline, diligence, finance, reporting).
- Create Express-based API app (`apps/api`) wiring routes to services with zod-based input validation. Provide worker app (`apps/worker`) using BullMQ for job orchestration.
- Implement financial screening engine as deterministic service with scenario definitions, calculators, and aggregator outputs.
- Provide in-memory document vault abstraction plus placeholders for S3 integration.
- Use node-cron (or BullMQ repeatables) for scheduled re-score jobs triggered via event emitter.
- Write targeted unit tests with Vitest focusing on financial screening calculations and service contracts.
- Document public API in README plus inline doc comments; update repo README with overview and setup instructions.

## Files to Create/Modify
- `package.json`, `pnpm-workspace.yaml`, `.npmrc`
- `tsconfig.json`, `tsconfig.*.json`
- `apps/api/*` (Express server, routes, controllers)
- `apps/worker/*` (job processor entrypoints)
- `packages/core/*` (config, logging, database client)
- `packages/services/*` (crm, pipeline, diligence, finance, reporting modules)
- `packages/config/*` (environment schema)
- `packages/tools/*` (placeholders for integrations)
- `prisma/schema.prisma`, `prisma/migrations/*`
- `tests/*` (unit tests for services)
- `README.md` updates, `docs/` additions as needed

## Assumptions
- Node.js 20, pnpm available.
- PostgreSQL/PostGIS accessible in deployment; local development uses connection string via `.env`.
- Use Prisma for ORM due to strong TS typing and migration support.
- Worker queue uses Redis; for now, stub with in-memory fallback for tests.

## Risks & Mitigations
- **Scope Creep:** Large feature set. Mitigate by scaffolding modules with TODOs and minimal viable logic.
- **Database Complexity:** PostGIS functions unused initially; include extension enabling script but gate usage with feature flags.
- **Security Compliance:** Ensure PII fields flagged and sanitized; use typed config to avoid missing envs.
- **Testing Coverage:** Focus on finance engine to ensure numerical correctness; mark integration tests pending.
- **Time Constraints:** Provide extendable architecture with placeholders clearly documented for future enhancement.

## Deliverables
- Functional monorepo skeleton with core domain schema and generated migration.
- Express API with placeholder endpoints returning structured responses.
- Worker entrypoint with stubbed job processors.
- Financial screening engine with scenario calculations and tests.
- Documentation updates: repo README with setup, architecture summary, plan reference.

## Test Plan
1. `pnpm lint` for code style (ESLint + Prettier configuration).
2. `pnpm test` running Vitest suite (focus on finance engine scenarios).
3. Optional: `pnpm prisma validate` to ensure schema correctness.

## Rollback Strategy
- Revert to previous git commit to remove scaffolding if unstable.
- Drop created migrations if not yet deployed; otherwise, create compensating migration.

## Timeline (Estimated)
1. Repo scaffolding & configs — 2h.
2. Prisma schema & migration — 3h.
3. Services + API/worker stubs — 4h.
4. Financial engine + tests — 3h.
5. DD workflows & reporting scaffolds — 3h.
6. Documentation & polish — 1h.

