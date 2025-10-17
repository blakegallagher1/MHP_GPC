import { recordSchemaDrift } from "../metrics/ingestMetrics";
import type { ConnectorResult, EndpointConnector } from "../types";
import type { DataCatalogRepository, DataCatalogEntry } from "../catalog/dataCatalog";
import { computeSchemaHash } from "../catalog/dataCatalog";
import type { Logger } from "../../../core/logging/logger";

export interface SchemaMigration {
  migrate(previous: DataCatalogEntry | undefined, next: DataCatalogEntry): Promise<void>;
  alert(previous: DataCatalogEntry | undefined, next: DataCatalogEntry): Promise<void>;
}

export class NoopSchemaMigration implements SchemaMigration {
  async migrate(): Promise<void> {
    // no-op
  }

  async alert(): Promise<void> {
    // no-op
  }
}

export interface FreshnessCheckerOptions {
  source: string;
  catalog: DataCatalogRepository;
  logger: Logger;
  schemaMigration: SchemaMigration;
}

export class FreshnessChecker {
  constructor(private readonly options: FreshnessCheckerOptions) {}

  async record<T extends Record<string, unknown>>(
    connector: EndpointConnector<T>,
    result: ConnectorResult<T>,
    ingestJobId: string,
  ): Promise<void> {
    const schemaHash = computeSchemaHash(result.schema);
    const existing = await this.options.catalog.findByEndpoint(connector.endpointId);

    const entry: DataCatalogEntry = {
      source: this.options.source,
      dataset_id: connector.endpointId,
      endpoint: connector.endpointId,
      last_seen_updated_at: result.latestUpdatedAt,
      schema_hash: schemaHash,
      row_count: result.rowCount,
      ingest_job_id: ingestJobId,
      recorded_at: new Date().toISOString(),
    };

    if (existing && existing.schema_hash !== schemaHash) {
      recordSchemaDrift(connector.endpointId);
      await this.options.schemaMigration.migrate(existing, entry);
      await this.options.schemaMigration.alert(existing, entry);
      this.options.logger.warn(
        { endpointId: connector.endpointId, previous: existing.schema_hash, next: schemaHash },
        "Schema drift detected",
      );
    }

    await this.options.catalog.upsert(entry);
    this.options.logger.info({ endpointId: connector.endpointId, rowCount: result.rowCount }, "Freshness recorded");
  }
}
