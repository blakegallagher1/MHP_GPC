import { BaseConnector } from "./baseConnector";
import type { ConnectorResult } from "../types";
import { inferSchemaFromRow, resolveLatestTimestamp } from "../utils/schema";

interface SocrataResponse<T> {
  data: T[];
  schema?: Record<string, string>;
  count?: number;
  latest?: string;
}

export abstract class SocrataConnector<T extends Record<string, unknown>> extends BaseConnector<T> {
  protected mapResponse(data: unknown): ConnectorResult<T> {
    const payload = this.normalize(data);
    const rows = payload.data ?? [];
    const schema = payload.schema ?? (rows[0] ? inferSchemaFromRow(rows[0]) : {});
    const latestUpdatedAt = payload.latest ?? resolveLatestTimestamp(rows);

    return {
      rows,
      schema,
      rowCount: payload.count ?? rows.length,
      latestUpdatedAt,
    };
  }

  private normalize(data: unknown): SocrataResponse<T> {
    if (Array.isArray(data)) {
      return { data: data as T[] };
    }
    if (typeof data === "object" && data !== null) {
      const maybe = data as Partial<SocrataResponse<T>> & Record<string, unknown>;
      if (Array.isArray(maybe.data)) {
        return {
          data: maybe.data as T[],
          schema: (maybe.schema as Record<string, string>) ?? undefined,
          count: typeof maybe.count === "number" ? maybe.count : maybe.data.length,
          latest: typeof maybe.latest === "string" ? maybe.latest : undefined,
        };
      }
      if (Array.isArray(maybe.results)) {
        return {
          data: maybe.results as T[],
          count: typeof maybe.result_count === "number" ? maybe.result_count : maybe.results.length,
        };
      }
    }
    throw new Error("Unexpected Socrata payload shape");
  }
}
