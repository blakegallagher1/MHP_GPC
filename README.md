# MHP_GPC

This repository provides a comprehensive platform for manufactured housing park acquisitions, combining municipal data ingest capabilities with CRM, pipeline management, due diligence, and financial screening tools.

## Platform Components

### 1. Acquisition Backend
The foundational backend manages manufactured housing park acquisitions following the agentic architecture described in `AGENTS.md`.

**Structure:**
- `apps/api`: Express REST API exposing CRM, pipeline, diligence, finance, and reporting endpoints.
- `apps/worker`: BullMQ/cron worker handling scheduled re-scoring and automation orchestration.
- `packages/config`: Environment loading and validation utilities.
- `packages/core`: Logging, Prisma client bootstrap, and domain event bus.
- `packages/services`: Service layer with domain logic, financial engine, reporting, and workflow helpers.
- `prisma`: Database schema and migrations targeting PostgreSQL + PostGIS.
- `tests`: Vitest suite covering deterministic finance calculations.

**Key Features:**
- Rich domain schema for owners, parks, leads, deals, touchpoints, documents, tasks, risk assessments, and scenario evaluations.
- Financial screening engine with scenario analysis and buy-box evaluation.
- Due-diligence command center scaffolding (checklists, risk scoring, document snapshots).
- Direct mail and heir sourcing workflow helpers with consent logging.
- Reporting suite for executive dashboard, acquisition sheet, and DD binder assembly.
- Scheduled re-score jobs reacting to domain events and live data updates.

### 2. Ingest Pipeline
Municipal data ingest service including typed connectors, caching, storage writers, and observability primitives.

**Structure:**
- `packages/services/ingest`: Core ingest logic (connectors, jobs, cache, storage, observability).
- `packages/core`: Shared utilities (HTTP client, retry logic, metrics, logging, cache, storage abstractions).
- `packages/config`: Typed configuration schemas.
- `tests/ingest`: Vitest coverage for connectors, caching, jobs, and catalog freshness.
- `docs/ingest/`: Ingest-specific architecture documentation.

**Ingest Features:**
- **Connectors** (`packages/services/ingest/connectors`): Typed modules for each municipal dataset with shared base classes for pagination, filtering, geometry encoding, and retry behavior.
- **Caching** (`packages/services/ingest/cache`): Redis-backed cache manager for connector outputs.
- **Storage** (`packages/services/ingest/storage`): Writers for Parquet and GeoJSON outputs with S3/GCS compatibility.
- **Jobs** (`packages/services/ingest/jobs`): Orchestrates connector execution, caching, storage writes, and metrics.
- **Catalog** (`packages/services/ingest/catalog`): In-memory repository for data catalog entries with schema hashing.
- **Observability** (`packages/services/ingest/metrics`): Metrics for ingest duration, schema drift, and endpoint health.

## Getting Started

1. **Install dependencies and generate the Prisma client:**
```bash
pnpm install
pnpm prisma:generate
```

2. **Configure environment variables:**

Copy `.env.example` to `.env` and set the following variables:

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mhp_gpc

# Redis
REDIS_URL=redis://localhost:6379

# API Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug

# Ingest Configuration (optional)
INGEST_CACHE_TTL=3600
OBJECT_STORAGE_BUCKET=mhp-ingest
OBJECT_STORAGE_PREFIX=ingest
```

For detailed ingest configuration, see `docs/ingest/README.md`.

3. **Apply database migrations:**
```bash
pnpm prisma:migrate
```

4. **Run the platform locally:**
```bash
# Run API server
pnpm --filter api dev

# Run worker (in separate terminal)
pnpm --filter worker dev
```

5. **Execute tests and linting:**
```bash
pnpm lint
pnpm test
```

## Tooling

- **Language**: TypeScript (ESM)
- **Testing**: Vitest
- **Logging**: Pino
- **Metrics**: In-memory registry (extendable to Prometheus/OpenTelemetry)
- **Database**: PostgreSQL with PostGIS extension
- **Queue**: BullMQ with Redis
- **API Framework**: Express with Zod validation

## Documentation

- **Acquisition Platform Plan**: `docs/plans/2025-10-17-core-domain-foundation.md`
- **Ingest Pipeline Plan**: `docs/plans/2025-10-17-ingest-pipeline.md`
- **Ingest Service Overview**: `docs/ingest/README.md`

## Extending the Platform

### Adding New Connectors
1. Add a new connector under `packages/services/ingest/connectors` extending `SocrataConnector` or `ArcGisConnector`.
2. Provide a constructor wiring the `ConnectorContext` and resource path.
3. Implement `describeSchema()` returning canonical field definitions for drift detection.
4. Add targeted tests in `tests/ingest` verifying response mapping and pagination.

### Working with the Domain Model
The acquisition platform uses Prisma ORM with a rich domain schema. After modifying `prisma/schema.prisma`:
1. Generate a new migration: `pnpm prisma:migrate:dev --name your_migration_name`
2. Regenerate the Prisma client: `pnpm prisma:generate`
3. Update service layer logic in `packages/services/` as needed.

## Architecture Principles

- **Modular workspaces**: Clean separation between apps, packages, and domain concerns.
- **Type safety**: End-to-end TypeScript with Zod validation and Prisma type generation.
- **Observability first**: Structured logging, metrics, and event tracking from the ground up.
- **Safe by default**: Typed configuration, consent checks, and approval gates for sensitive operations.
- **Test-driven**: Comprehensive test coverage with deterministic fixtures and regression guards.

---

For questions or updates, open an issue and reference the relevant plan or domain area.
