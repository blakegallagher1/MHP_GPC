# MHP_GPC Ingest Pipeline

This repository contains scaffolding for a municipal data ingest service including typed connectors, caching, storage writers, and observability primitives.

## Getting Started
1. Install dependencies with `pnpm install`.
2. Run tests with `pnpm test`.
3. Review plan documentation in `docs/plans/2025-10-17-ingest-pipeline.md` and the ingest overview in `docs/ingest/README.md`.

## Project Structure
- `packages/services/ingest`: Core ingest logic (connectors, jobs, cache, storage, observability).
- `packages/core`: Shared utilities (HTTP client, retry logic, metrics, logging, cache, storage abstractions).
- `packages/config`: Typed configuration schemas.
- `tests/ingest`: Vitest coverage for connectors, caching, jobs, and catalog freshness.
- `docs/`: Plans and architecture documentation.

## Tooling
- **Language**: TypeScript (ESM)
- **Testing**: Vitest
- **Logging**: Pino
- **Metrics**: In-memory registry (extendable to Prometheus/OpenTelemetry)

Environment variables for ingest configuration are documented in `docs/ingest/README.md` and validated via `packages/config/ingest.ts`.
