import { ArcGisConnector } from "./arcGisConnector";
import type { Geometry } from "geojson";
import type { ConnectorContext } from "../types";

export interface CityLimitsRecord extends Record<string, unknown> {
  city_limit_id: string;
  name?: string;
  effective_date?: string;
  geometry?: Geometry;
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
