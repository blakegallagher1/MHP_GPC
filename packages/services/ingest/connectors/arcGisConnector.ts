import { BaseConnector } from "./baseConnector";
import type { Geometry } from "geojson";
import type { ConnectorResult } from "../types";
import { resolveLatestTimestamp } from "../utils/schema";

interface ArcGisField {
  name: string;
  type: string;
}

interface ArcGisFeature {
  attributes: Record<string, unknown>;
  geometry?: Geometry;
}

interface ArcGisResponse {
  features: ArcGisFeature[];
  fields?: ArcGisField[];
}

export abstract class ArcGisConnector<T extends Record<string, unknown>> extends BaseConnector<T> {
  protected mapResponse(data: unknown): ConnectorResult<T> {
    const payload = this.normalize(data);
    const rows = payload.features.map((feature) => {
      const normalized: Record<string, unknown> = { ...feature.attributes };
      if (feature.geometry !== undefined) {
        normalized.geometry = feature.geometry;
      }
      return normalized as T;
    });

    const schema: Record<string, string> = {};
    if (payload.fields) {
      for (const field of payload.fields) {
        schema[field.name] = field.type;
      }
    } else if (rows[0]) {
      for (const [key, value] of Object.entries(rows[0] as Record<string, unknown>)) {
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
      const payload = data as {
        features?: Array<Record<string, unknown>>;
        fields?: Array<Record<string, unknown>>;
      };
      if (Array.isArray(payload.features)) {
        const features: ArcGisFeature[] = payload.features.map((feature) => {
          if (typeof feature !== "object" || feature === null) {
            return { attributes: {} };
          }
          const attributes = "attributes" in feature && typeof feature.attributes === "object" && feature.attributes !== null
            ? (feature.attributes as Record<string, unknown>)
            : (feature as Record<string, unknown>);
          const geometry = "geometry" in feature ? (feature.geometry as Geometry | undefined) : undefined;
          return { attributes, geometry };
        });
        const fields = Array.isArray(payload.fields)
          ? payload.fields
              .map((field) => {
                if (typeof field !== "object" || field === null) {
                  return undefined;
                }
                const name = (field as Record<string, unknown>).name;
                const type = (field as Record<string, unknown>).type;
                if (typeof name === "string" && typeof type === "string") {
                  return { name, type } satisfies ArcGisField;
                }
                return undefined;
              })
              .filter((field): field is ArcGisField => field !== undefined)
          : undefined;
        return { features, fields };
      }
    }
    throw new Error("Unexpected ArcGIS payload shape");
  }
}
