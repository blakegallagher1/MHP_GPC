import { describe, expect, it, vi, beforeEach } from "vitest";
import type { HttpClientResponse } from "../../packages/core/http/httpClient";
import { Re5cHrw9Connector } from "../../packages/services/ingest/connectors/re5cHrw9Connector";
import { TaxParcelConnector } from "../../packages/services/ingest/connectors/taxParcelConnector";
import { CacheManager } from "../../packages/services/ingest/cache/cacheManager";
import { IngestJob } from "../../packages/services/ingest/jobs/ingestJob";
import { InMemoryDataCatalogRepository } from "../../packages/services/ingest/catalog/dataCatalog";
import { FreshnessChecker } from "../../packages/services/ingest/jobs/freshnessChecker";
import { createLogger } from "../../packages/core/logging/logger";
import { DegradedStateMonitor } from "../../packages/services/ingest/observability/degradedState";
import type { ConnectorContext } from "../../packages/services/ingest/types";

class MockHttpClient {
  constructor(private readonly response: HttpClientResponse<unknown>) {}

  async get<T>(): Promise<HttpClientResponse<T>> {
    return this.response as HttpClientResponse<T>;
  }
}

class MockRedisClient {
  private readonly store = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }
  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }
}

class MockObjectStorageClient {
  public writes: Array<{ bucket: string; key: string; body: string | Buffer }> = [];
  async putObject(location: { bucket: string; key: string }, body: Buffer | string): Promise<void> {
    this.writes.push({ bucket: location.bucket, key: location.key, body });
  }
}

describe("Ingest connectors", () => {
  let context: ConnectorContext;

  beforeEach(() => {
    context = {
      endpoint: {
        id: "re5c-hrw9",
        baseUrl: "https://data.example.com",
        datasetId: "re5c-hrw9",
        defaultLimit: 100,
      },
      httpClient: new MockHttpClient({
        status: 200,
        data: [
          {
            service_request_id: "1",
            status: "open",
            service_name: "Pothole",
            updated_datetime: "2024-01-01T00:00:00Z",
          },
        ],
        headers: {},
      }),
      retryOptions: { retries: 0 },
    };
  });

  it("fetches Socrata data with pagination support", async () => {
    const connector = new Re5cHrw9Connector(context);
    const result = await connector.fetch({ filters: { status: "open" } });

    expect(result.rowCount).toBe(1);
    expect(result.rows[0].service_name).toBe("Pothole");
    expect(result.schema.service_request_id).toBe("string");
  });

  it("maps ArcGIS features to records", async () => {
    const arcContext: ConnectorContext = {
      ...context,
      endpoint: {
        id: "tax-parcel",
        baseUrl: "https://gis.example.com",
        datasetId: "tax-parcel",
        defaultLimit: 100,
      },
      httpClient: new MockHttpClient({
        status: 200,
        data: {
          features: [
            {
              attributes: {
                parcel_id: "123",
                total_value: 1000,
              },
              geometry: { type: "Point", coordinates: [0, 0] },
            },
          ],
          fields: [
            { name: "parcel_id", type: "esriFieldTypeString" },
            { name: "total_value", type: "esriFieldTypeDouble" },
          ],
        },
        headers: {},
      }),
    };

    const connector = new TaxParcelConnector(arcContext);
    const result = await connector.fetch({});

    expect(result.rowCount).toBe(1);
    expect(result.rows[0].parcel_id).toBe("123");
    expect(result.schema.total_value).toContain("Double");
  });
});

describe("Cache manager", () => {
  it("stores and retrieves cached results", async () => {
    const redis = new MockRedisClient();
    const cacheManager = new CacheManager(redis, { namespace: "test" });
    await cacheManager.set("endpoint", { filters: { status: "open" } }, { rows: [], schema: {}, rowCount: 0 });
    const cached = await cacheManager.get("endpoint", { filters: { status: "open" } });
    expect(cached).toEqual({ rows: [], schema: {}, rowCount: 0 });
  });
});

describe("Freshness checker", () => {
  it("records catalog entries and handles schema drift", async () => {
    const catalog = new InMemoryDataCatalogRepository();
    const logger = createLogger({ name: "test", enabled: false });
    const migration = { migrate: vi.fn(), alert: vi.fn() };
    const checker = new FreshnessChecker({
      source: "city",
      catalog,
      logger,
      schemaMigration: migration,
    });

    const context: ConnectorContext = {
      endpoint: {
        id: "re5c-hrw9",
        baseUrl: "https://data.example.com",
        datasetId: "re5c-hrw9",
        defaultLimit: 100,
      },
      httpClient: new MockHttpClient({ status: 200, data: [], headers: {} }),
      retryOptions: { retries: 0 },
    };
    const connector = new Re5cHrw9Connector(context);

    const initialResult = {
      rows: [{ service_request_id: "1", status: "open" }],
      schema: { service_request_id: "string", status: "string" },
      rowCount: 1,
      latestUpdatedAt: "2024-01-01T00:00:00Z",
    };

    await checker.record(connector, initialResult, "job-1");

    const driftResult = {
      ...initialResult,
      schema: { service_request_id: "string", status: "string", priority: "string" },
    };

    await checker.record(connector, driftResult, "job-2");

    expect(migration.migrate).toHaveBeenCalled();
    expect(migration.alert).toHaveBeenCalled();
  });
});

describe("Ingest job", () => {
  it("writes to storage and caches results", async () => {
    const redis = new MockRedisClient();
    const cacheManager = new CacheManager(redis, { namespace: "job" });
    const storage = new MockObjectStorageClient();
    const logger = createLogger({ name: "ingest", enabled: false });

    const context: ConnectorContext = {
      endpoint: {
        id: "re5c-hrw9",
        baseUrl: "https://data.example.com",
        datasetId: "re5c-hrw9",
        defaultLimit: 100,
      },
      httpClient: new MockHttpClient({
        status: 200,
        data: [
          {
            service_request_id: "1",
            status: "open",
            service_name: "Pothole",
            geometry: { type: "Point", coordinates: [0, 0] },
          },
        ],
        headers: {},
      }),
      retryOptions: { retries: 0 },
    };

    const connector = new Re5cHrw9Connector(context);
    const job = new IngestJob(connector, {
      objectStorageClient: storage,
      cacheManager,
      logger,
      bucket: "city-data",
      prefix: "ingest",
    });

    await job.run({ filters: { status: "open" } });

    expect(storage.writes).toHaveLength(2);
    expect(storage.writes[0].bucket).toBe("city-data");
    expect(storage.writes[1].key).toContain("re5c-hrw9");

    const cached = await cacheManager.get("re5c-hrw9", { filters: { status: "open" } });
    expect(cached?.rowCount).toBe(1);
  });
});

describe("Degraded state monitor", () => {
  it("tracks degraded endpoints", () => {
    const monitor = new DegradedStateMonitor();
    monitor.setDegraded("re5c-hrw9", "Timeout");
    expect(monitor.getState("re5c-hrw9")?.reason).toBe("Timeout");
    monitor.clear("re5c-hrw9");
    expect(monitor.getState("re5c-hrw9")).toBeUndefined();
  });
});
