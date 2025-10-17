import crypto from "crypto";

export interface DataCatalogEntry {
  source: string;
  dataset_id: string;
  endpoint: string;
  last_seen_updated_at?: string;
  schema_hash: string;
  row_count: number;
  ingest_job_id: string;
  recorded_at: string;
}

export interface DataCatalogRepository {
  upsert(entry: DataCatalogEntry): Promise<void>;
  findByEndpoint(endpoint: string): Promise<DataCatalogEntry | undefined>;
}

export class InMemoryDataCatalogRepository implements DataCatalogRepository {
  private readonly store = new Map<string, DataCatalogEntry>();

  async upsert(entry: DataCatalogEntry): Promise<void> {
    this.store.set(entry.endpoint, entry);
  }

  async findByEndpoint(endpoint: string): Promise<DataCatalogEntry | undefined> {
    return this.store.get(endpoint);
  }
}

export const computeSchemaHash = (schema: Record<string, string>): string => {
  const canonical = Object.keys(schema)
    .sort()
    .map((key) => `${key}:${schema[key]}`)
    .join("|");
  return crypto.createHash("sha256").update(canonical).digest("hex");
};
