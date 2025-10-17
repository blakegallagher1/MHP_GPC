import { ArcGisConnector } from "./arcGisConnector";
import type { ConnectorContext } from "../types";

export interface ZoningRecord {
  zoning_id: string;
  zoning_type?: string;
  overlay?: string;
  effective_date?: string;
  geometry?: GeoJSON.Geometry;
}

export class ZoningConnector extends ArcGisConnector<ZoningRecord> {
  constructor(context: ConnectorContext) {
    super({
      context,
      resourcePath: "query",
    });
  }

  get endpointId(): string {
    return "zoning";
  }

  async describeSchema(): Promise<Record<string, string>> {
    return {
      zoning_id: "string",
      zoning_type: "string",
      overlay: "string",
      effective_date: "string",
      geometry: "geometry",
    };
  }
}
