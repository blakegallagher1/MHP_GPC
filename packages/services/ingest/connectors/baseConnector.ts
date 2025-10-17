import { retry } from "../../../core/retry/exponentialBackoff";
import type { HttpClient, HttpPageRequestOptions } from "../../../core/http/httpClient";
import type { ConnectorContext, ConnectorQuery, ConnectorResult, EndpointConnector, Pagination } from "../types";

export interface BaseConnectorOptions<T> {
  context: ConnectorContext;
  resourcePath: string;
  transformResponse?: (data: unknown) => ConnectorResult<T>;
}

export abstract class BaseConnector<T> implements EndpointConnector<T> {
  protected readonly httpClient: HttpClient;
  protected readonly endpointUrl: string;

  constructor(protected readonly options: BaseConnectorOptions<T>) {
    this.httpClient = options.context.httpClient as HttpClient;
    this.endpointUrl = `${options.context.endpoint.baseUrl}/${options.resourcePath}`.replace(/\/+/g, "/");
  }

  abstract get endpointId(): string;
  protected abstract mapResponse(data: unknown): ConnectorResult<T>;
  abstract describeSchema(): Promise<Record<string, string>>;

  async fetch(query: ConnectorQuery = {}): Promise<ConnectorResult<T>> {
    const pagination: Required<Pagination> = {
      limit: query.pagination?.limit ?? this.options.context.endpoint.defaultLimit,
      offset: query.pagination?.offset ?? 0,
      page: query.pagination?.page ?? 0,
    };
    const accumulator: ConnectorResult<T> = { rows: [], schema: {}, rowCount: 0 };

    let hasMore = true;
    while (hasMore) {
      const pageResult = await this.fetchPage(query, pagination);
      accumulator.rows.push(...pageResult.rows);
      accumulator.rowCount += pageResult.rowCount;
      accumulator.schema = { ...accumulator.schema, ...pageResult.schema };
      accumulator.latestUpdatedAt = this.resolveLatest(accumulator.latestUpdatedAt, pageResult.latestUpdatedAt);
      if (pageResult.rowCount < pagination.limit) {
        hasMore = false;
      } else {
        pagination.offset += pagination.limit;
      }
    }

    return accumulator;
  }

  async fetchPage(query: ConnectorQuery, pagination: Required<Pagination>): Promise<ConnectorResult<T>> {
    const requestOptions = this.buildRequestOptions(query, pagination);
    const response = await retry(
      async () => {
        const result = await this.httpClient.get<unknown>(this.endpointUrl, requestOptions);
        if (result.status >= 500) {
          throw new Error(`Server error ${result.status}`);
        }
        return result;
      },
      this.options.context.retryOptions,
    );

    const data = this.options.transformResponse
      ? this.options.transformResponse(response.data)
      : this.mapResponse(response.data);

    return data;
  }

  protected buildRequestOptions(query: ConnectorQuery, pagination: Required<Pagination>): HttpPageRequestOptions {
    const params: Record<string, unknown> = {
      limit: pagination.limit,
      offset: pagination.offset,
      ...query.filters,
    };
    if (query.orderBy) {
      params.order = query.orderBy;
    }
    if (query.geometry?.geometry) {
      params.geometry = JSON.stringify(query.geometry.geometry);
      params.spatialRel = query.geometry.spatialRel ?? "intersects";
    }
    return {
      query: params,
    } satisfies HttpPageRequestOptions;
  }

  protected resolveLatest(previous: string | undefined, next: string | undefined): string | undefined {
    if (!previous) return next;
    if (!next) return previous;
    return new Date(next) > new Date(previous) ? next : previous;
  }
}
