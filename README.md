# MHP_GPC Platform

This repository provides the foundational backend for managing manufactured housing park acquisitions. It follows the agentic architecture described in `AGENTS.md` with a pnpm workspace housing API, worker, and shared service packages.

## Structure

- `apps/api`: Express REST API exposing CRM, pipeline, diligence, finance, and reporting endpoints.
- `apps/worker`: BullMQ/cron worker handling scheduled re-scoring and automation orchestration.
- `packages/config`: Environment loading and validation utilities.
- `packages/core`: Logging, Prisma client bootstrap, and domain event bus.
- `packages/services`: Service layer with domain logic, financial engine, reporting, and workflow helpers.
- `prisma`: Database schema and migrations targeting PostgreSQL + PostGIS.
- `tests`: Vitest suite covering deterministic finance calculations.

## Getting Started

1. Install dependencies and generate the Prisma client.

```bash
pnpm install
pnpm prisma:generate
```

2. Copy `.env.example` to `.env` and set the following variables:

```
DATABASE_URL=postgresql://user:password@localhost:5432/mhp_gpc
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
```

3. Apply database migrations.

```bash
pnpm prisma:migrate
```

4. Run the API and worker locally.

```bash
pnpm --filter api dev
pnpm --filter worker dev
```

5. Execute tests and linting.

```bash
pnpm lint
pnpm test
```

## Key Features

- Rich domain schema for owners, parks, leads, deals, touchpoints, documents, tasks, risk assessments, and scenario evaluations.
- Financial screening engine with scenario analysis and buy-box evaluation.
- Due-diligence command center scaffolding (checklists, risk scoring, document snapshots).
- Direct mail and heir sourcing workflow helpers with consent logging.
- Reporting suite for executive dashboard, acquisition sheet, and DD binder assembly.
- Scheduled re-score jobs reacting to domain events and live data updates.

## Plan Reference

- `docs/plans/2025-10-17-core-domain-foundation.md`
