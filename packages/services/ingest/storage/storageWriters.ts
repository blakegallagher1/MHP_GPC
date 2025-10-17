import { GeoJsonWriter, ParquetWriter, type GeoJsonWriterOptions, type ObjectStorageClient, type ObjectStorageLocation, type ParquetWriterOptions } from "../../../core/storage/objectStorage";

export interface StorageWriters {
  parquet: ParquetWriter;
  geojson: GeoJsonWriter;
}

export const createStorageWriters = (
  client: ObjectStorageClient,
  parquetOptions: ParquetWriterOptions,
  geoJsonOptions: GeoJsonWriterOptions = {},
): StorageWriters => ({
  parquet: new ParquetWriter(client, parquetOptions),
  geojson: new GeoJsonWriter(client, geoJsonOptions),
});

export const buildLocation = (
  bucket: string,
  prefix: string,
  endpointId: string,
  extension: string,
): ObjectStorageLocation => ({
  bucket,
  key: `${prefix.replace(/\/$/, "")}/${endpointId}.${extension}`,
});
