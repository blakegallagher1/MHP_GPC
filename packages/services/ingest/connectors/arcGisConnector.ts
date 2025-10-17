import { BaseConnector } from "./baseConnector";
import type { ConnectorResult } from "../types";
import { resolveLatestTimestamp } from "../utils/schema";

interface ArcGisField {
  name: string;
  type: string;
}

interface ArcGisFeature {
  attributes: Record<string, unknown>;
  geometry?: GeoJSON.Geometry;
}

interface ArcGisResponse {
  features: ArcGisFeature[];
  fields?: ArcGisField[];
}

export abstract class ArcGisConnector<T extends Record<string, unknown>> extends BaseConnector<T> {
  protected mapResponse(data: unknown): ConnectorResult<T> {
    const payload = this.normalize(data);
    const rows = payload.features.map((feature) => ({
      ...feature.attributes,
      geometry: feature.geometry,
    })) as T[];

    const schema: Record<string, string> = {};
    if (payload.fields) {
      for (const field of payload.fields) {
        schema[field.name] = field.type;
      }
    } else if (rows[0]) {
      for (const [key, value] of Object.entries(rows[0])) {
        schema[key] = typeof value;
      }
    }

    const latestUpdatedAt = resolveLatestTimestamp(rows as Array<Record<string, unknown>>);

    return {
      rows,
      schema,
      rowCount: rows.length,
      latestUpdatedAt,
    };
  }

  private normalize(data: unknown): ArcGisResponse {
    if (typeof data === "object" && data !== null) {
      const payload = data as Partial<ArcGisResponse>;
      if (Array.isArray(payload.features)) {
        return {
          features: payload.features as ArcGisFeature[],
          fields: payload.fields,
        };
      }
    }
    throw new Error("Unexpected ArcGIS payload shape");
  }
}
