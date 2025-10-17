# Ingest Service Overview

This document summarizes the ingest service scaffolding introduced on 2025-10-17.

## Architecture
- **Connectors** (`packages/services/ingest/connectors`): Typed modules for each municipal dataset. Shared base classes provide pagination, filter handling, geometry encoding, and retry behavior.
- **Caching** (`packages/services/ingest/cache`): A Redis-backed cache manager stores connector outputs keyed by endpoint and query payload.
- **Storage** (`packages/services/ingest/storage`): Writers for Parquet (JSON placeholder) and GeoJSON outputs leverage an abstract object storage client for S3/GCS compatibility.
- **Jobs** (`packages/services/ingest/jobs`): The `IngestJob` orchestrates connector execution, caching, storage writes, and metrics. The `FreshnessChecker` records dataset metadata and triggers schema drift workflows.
- **Catalog** (`packages/services/ingest/catalog`): In-memory repository for `data_catalog` entries, including schema hashing utilities.
- **Observability** (`packages/services/ingest/metrics`, `.../observability`): Metrics for ingest duration, schema drift, and endpoint health plus a degraded-state monitor.

## Extending Connectors
1. Add a new connector under `packages/services/ingest/connectors` extending `SocrataConnector` or `ArcGisConnector` (or create a specialized base class).
2. Provide a constructor that wires the `ConnectorContext` and resource path.
3. Implement `describeSchema()` returning the canonical field definitions for drift detection.
4. Add targeted tests in `tests/ingest` verifying response mapping and pagination.

## Configuration
Runtime configuration is typed via `packages/config/ingest.ts`. Environment variables:
- `REDIS_URL`: Optional connection string for Redis cache.
- `INGEST_CACHE_TTL`: TTL override for cached connector results.
- `OBJECT_STORAGE_BUCKET`: Destination bucket for cold storage outputs.
- `OBJECT_STORAGE_PREFIX`: Prefix path for stored datasets (default `ingest`).

## Testing
Run `pnpm install` followed by `pnpm test` to execute the Vitest suite covering connectors, caching, jobs, and catalog freshness tracking.
