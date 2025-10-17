# Plan: Resolve TypeScript type safety gaps (2025-10-18)

## Goal
Restore full TypeScript type safety for the ingest pipeline by resolving the open errors surfaced by `pnpm typecheck`, ensuring all connectors, jobs, and shared utilities comply with the project's typings.

## Objectives
- Eliminate `GeoJSON` namespace lookup failures by adopting explicit type imports.
- Align connector record interfaces with the `Record<string, unknown>` constraint enforced by shared generics.
- Refine `ArcGisConnector` response normalization to satisfy strict typing without unsafe casts.
- Ensure HTTP request parameter construction adheres to `HttpPageRequestOptions` contracts.
- Confirm the ingest job geojson writer uses typed geometry annotations.

## Assumptions
- `@types/geojson` remains the authoritative source for GeoJSON definitions.
- Connector record shapes only include JSON-serializable primitives plus optional `geometry` fields.
- Adjusting types will not require runtime logic changes beyond safe casting/normalization.

## Approach
1. Import GeoJSON types explicitly in modules referencing the namespace and propagate `import type { FeatureCollection, Geometry } from "geojson"` as needed.
2. Update connector record interfaces (and any other shape definitions) to extend `Record<string, unknown>` while preserving optional fields.
3. Refactor `ArcGisConnector` to describe its feature payload generically, normalizing attributes plus geometry into objects typed as `Record<string, unknown>` before casting to `T`.
4. Tighten `BaseConnector.buildRequestOptions` to emit `Record<string, string | number | boolean | undefined>` values, converting geometry payloads to JSON strings explicitly.
5. Annotate GeoJSON feature construction in `IngestJob` with imported types and non-mutating object spreads that satisfy the compiler.
6. Run `pnpm typecheck` and `pnpm test` to verify type and runtime coverage.

## Files to Change/Create
- `packages/services/ingest/connectors/*.ts`
- `packages/services/ingest/jobs/ingestJob.ts`
- `packages/services/ingest/types.ts`
- `packages/services/ingest/utils/schema.ts` (if additional typing helpers required)
- `packages/core/storage/objectStorage.ts`
- `packages/services/ingest/connectors/baseConnector.ts`
- `packages/services/ingest/connectors/arcGisConnector.ts`
- `tests/ingest/ingestPipeline.test.ts` (type adjustments only if necessary)
- `PLAN.md` to track live progress

## Tests
- `pnpm typecheck`
- `pnpm test`

## Risks
- Overly strict typings could require substantial fixture updates if connectors rely on loosely typed attributes.
- Geometry typing changes may ripple into tests if mocks lack geometry fields.
- Refactoring the ArcGIS normalization path must preserve runtime behavior to keep tests passing.

## Mitigations
- Favor incremental typing changes with minimal runtime impact, validating after each adjustment.
- Maintain existing test fixtures; if updates are needed, adjust mocks to satisfy new types while verifying expectations.
- Use targeted generics and helper types to avoid repeated type assertions.

## Deliverables
- Updated TypeScript modules with passing `pnpm typecheck` and `pnpm test` runs.
- Live plan (`PLAN.md`) reflecting task progress.

## Rollback Strategy
Revert the branch to the pre-change commit to restore prior lax typing if downstream consumers encounter regressions.

## Timeline (Estimated)
1. Import GeoJSON types and update record interfaces — 0.5h.
2. Refactor `ArcGisConnector` and base request typing — 0.5h.
3. Adjust ingest job geojson typing and rerun tests/typecheck — 0.5h.
