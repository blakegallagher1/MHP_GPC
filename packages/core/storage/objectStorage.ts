import type { FeatureCollection, Geometry } from "geojson";

export interface ObjectStorageLocation {
  bucket: string;
  key: string;
}

export interface ObjectStorageClient {
  putObject(location: ObjectStorageLocation, body: Buffer | string): Promise<void>;
}

export interface ParquetWriterOptions {
  schema: Record<string, string>;
}

export interface GeoJsonWriterOptions {
  featureCollectionName?: string;
}

export class ParquetWriter {
  constructor(private readonly client: ObjectStorageClient, private readonly options: ParquetWriterOptions) {}

  async write(location: ObjectStorageLocation, rows: Record<string, unknown>[]): Promise<void> {
    const payload = JSON.stringify({ schema: this.options.schema, rows });
    await this.client.putObject(location, payload);
  }
}

export class GeoJsonWriter {
  constructor(private readonly client: ObjectStorageClient, private readonly options: GeoJsonWriterOptions = {}) {}

  async write<G extends Geometry | null = Geometry>(
    location: ObjectStorageLocation,
    features: FeatureCollection<G>,
  ): Promise<void> {
    const payload = JSON.stringify({ name: this.options.featureCollectionName, ...features });
    await this.client.putObject(location, payload);
  }
}
