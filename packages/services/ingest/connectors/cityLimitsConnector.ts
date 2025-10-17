import { ArcGisConnector } from "./arcGisConnector";
import type { ConnectorContext } from "../types";

export interface CityLimitsRecord {
  city_limit_id: string;
  name?: string;
  effective_date?: string;
  geometry?: GeoJSON.Geometry;
}

export class CityLimitsConnector extends ArcGisConnector<CityLimitsRecord> {
  constructor(context: ConnectorContext) {
    super({
      context,
      resourcePath: "query",
    });
  }

  get endpointId(): string {
    return "city-limits";
  }

  async describeSchema(): Promise<Record<string, string>> {
    return {
      city_limit_id: "string",
      name: "string",
      effective_date: "string",
      geometry: "geometry",
    };
  }
}
