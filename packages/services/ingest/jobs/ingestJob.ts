import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { ObjectStorageClient } from "../../../core/storage/objectStorage";
import type { Logger } from "../../../core/logging/logger";
import type { CacheManager } from "../cache/cacheManager";
import type { EndpointConnector, ConnectorQuery } from "../types";
import { recordIngestDuration } from "../metrics/ingestMetrics";
import { buildLocation, createStorageWriters } from "../storage/storageWriters";

export interface IngestJobOptions {
  objectStorageClient: ObjectStorageClient;
  cacheManager: CacheManager;
  logger: Logger;
  bucket: string;
  prefix: string;
}

export class IngestJob<T extends Record<string, unknown>> {
  constructor(private readonly connector: EndpointConnector<T>, private readonly options: IngestJobOptions) {}

  async run(query: ConnectorQuery = {}): Promise<void> {
    const start = Date.now();
    const cached = await this.options.cacheManager.get<T>(this.connector.endpointId, query);
    const result = cached ?? (await this.connector.fetch(query));

    if (!cached) {
      await this.options.cacheManager.set(this.connector.endpointId, query, result);
    }

    const writers = createStorageWriters(this.options.objectStorageClient, {
      schema: result.schema,
    });

    const parquetLocation = buildLocation(this.options.bucket, this.options.prefix, this.connector.endpointId, "parquet.json");
    const geoJsonLocation = buildLocation(this.options.bucket, this.options.prefix, this.connector.endpointId, "geojson");

    await writers.parquet.write(parquetLocation, result.rows);

    const features: Array<Feature<Geometry | null>> = result.rows.map((row) => {
      const { geometry, ...properties } = row as Record<string, unknown> & { geometry?: unknown };
      const featureGeometry: Geometry | null = (geometry as Geometry | undefined) ?? null;
      return {
        type: "Feature",
        geometry: featureGeometry,
        properties,
      } satisfies Feature<Geometry | null>;
    });

    const geojsonFeatureCollection: FeatureCollection<Geometry | null> = {
      type: "FeatureCollection",
      features,
    };

    await writers.geojson.write(geoJsonLocation, geojsonFeatureCollection);

    const durationMs = Date.now() - start;
    recordIngestDuration(this.connector.endpointId, durationMs);
    this.options.logger.info({ endpointId: this.connector.endpointId, durationMs }, "Ingest job completed");
  }
}
