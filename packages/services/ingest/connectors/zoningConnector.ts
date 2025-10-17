import { ArcGisConnector } from "./arcGisConnector";
import type { Geometry } from "geojson";
import type { ConnectorContext } from "../types";

export interface ZoningRecord extends Record<string, unknown> {
  zoning_id: string;
  zoning_type?: string;
  overlay?: string;
  effective_date?: string;
  geometry?: Geometry;
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
