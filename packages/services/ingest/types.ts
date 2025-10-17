import type { EndpointConfig } from "../../config/ingest";
import type { HttpClientResponse } from "../../core/http/httpClient";

export interface Pagination { limit?: number; offset?: number; page?: number; }

export interface GeometryQuery {
  geometry?: GeoJSON.Geometry;
  spatialRel?: "intersects" | "contains" | "within";
}

export interface ConnectorContext {
  endpoint: EndpointConfig;
  httpClient: {
    get<T>(url: string, options?: Record<string, unknown>): Promise<HttpClientResponse<T>>;
  };
  retryOptions: {
    retries: number;
    factor?: number;
    minTimeoutMs?: number;
    maxTimeoutMs?: number;
  };
}

export interface ConnectorResult<T> {
  rows: T[];
  schema: Record<string, string>;
  rowCount: number;
  latestUpdatedAt?: string;
}

export interface ConnectorQuery {
  filters?: Record<string, string | number | boolean | undefined>;
  pagination?: Pagination;
  geometry?: GeometryQuery;
  orderBy?: string;
}

export interface EndpointConnector<T> {
  readonly endpointId: string;
  fetch(query?: ConnectorQuery): Promise<ConnectorResult<T>>;
  fetchPage(query: ConnectorQuery, pagination: Required<Pagination>): Promise<ConnectorResult<T>>;
  describeSchema(): Promise<Record<string, string>>;
}
