# Plan: Ingest Data Pipeline Scaffold (2025-10-17)

## Goal
Establish the backend ingest pipeline scaffolding, connectors, storage, and observability to support multiple municipal datasets with consistent metadata tracking.

## Objectives
- Scaffold packages/services/ingest with modular architecture for connectors, storage, caching, and jobs.
- Implement typed connectors for all required endpoints with pagination, filters, geometry, and retry support.
- Add caching (Redis) and cold storage writers (S3/GCS parquet or GeoJSON) for connector outputs.
- Implement a freshness checker job persisting metadata to `data_catalog` with schema drift handling.
- Wire observability for ingest duration, schema drift, endpoint health, retries, and degraded states.

## Assumptions
- Node.js/TypeScript stack with pnpm tooling per repo defaults.
- Redis and object storage clients are available via environment configuration; use mocks/adapters for local dev.
- `data_catalog` persistence can be represented via a service abstraction without actual database connectivity.
- Tests will use in-memory or mocked dependencies to avoid network calls.

## Approach
1. Define directory structure under `packages/services/ingest` for connectors, caching, storage, jobs, and observability utilities.
2. Implement connector base classes and typed modules for each endpoint with shared pagination/filter/geometry/retry logic.
3. Create caching layer using Redis client abstraction and cold storage writers for S3/GCS targeting Parquet/GeoJSON outputs.
4. Implement freshness checker job tracking metadata and handling schema drift via migration strategy and alert hooks.
5. Add observability utilities (metrics, logging, degraded state tracking) and integrate across connectors and jobs.
6. Add configuration schemas, tests, and documentation updates.

## Files to Change/Create
- `packages/services/ingest/` (multiple new files and subdirectories)
- `packages/config/` additions for ingest settings (if absent, create)
- `packages/core/` utilities for retries, logging, metrics (as needed)
- `docs/` updates (plan already here, add ingest README)
- `tests/` for unit/integration coverage of connectors and jobs
- `PLAN.md` to track live progress

## Tests
- Unit tests for connector request building, pagination, and retry logic.
- Unit tests for caching and storage writers using in-memory mocks.
- Unit tests for freshness checker job verifying metadata persistence and schema drift handling.
- Integration-style test for ingest pipeline orchestrating connectors with mocks.

## Risks
- Complexity of scaffolding may exceed 400 line guidance; mitigate by modularizing and focusing on minimal viable implementations.
- External service schemas may change; ensure schema hashing and drift detection robust.
- Redis/S3 clients may require configuration not available in tests; use dependency injection and mocks.

## Mitigations
- Use shared abstractions and base classes to reduce duplication.
- Provide clear interfaces for external dependencies; include fallback no-op implementations for local dev.
- Document assumptions and extension points in README.

## Deliverables
- Ingest service scaffold with connectors, caching, storage, jobs, and observability utilities.
- Tests covering key modules.
- Documentation describing architecture and usage.

## Test Plan Summary
Execute `pnpm test` after adding targeted unit tests; include lint/typecheck once available.

## Rollback Strategy
Revert the feature branch or remove the new ingest service directories if issues arise; connectors and jobs are modular and can be disabled via configuration flags.

## Timeline (Estimated)
1. Scaffold directories and base abstractions — 0.5 day.
2. Implement endpoint connectors with pagination/filtering — 1 day.
3. Add caching, storage writers, and configuration — 0.5 day.
4. Implement freshness checker job with schema drift handling — 0.5 day.
5. Integrate observability and add tests/docs — 0.5 day.
