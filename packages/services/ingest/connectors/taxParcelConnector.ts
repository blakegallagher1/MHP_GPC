import { ArcGisConnector } from "./arcGisConnector";
import type { ConnectorContext } from "../types";

export interface TaxParcelRecord {
  parcel_id: string;
  owner_name?: string;
  situs_address?: string;
  land_value?: number;
  improvement_value?: number;
  total_value?: number;
  updated_at?: string;
  geometry?: GeoJSON.Geometry;
}

export class TaxParcelConnector extends ArcGisConnector<TaxParcelRecord> {
  constructor(context: ConnectorContext) {
    super({
      context,
      resourcePath: "query",
    });
  }

  get endpointId(): string {
    return "tax-parcel-map-service";
  }

  async describeSchema(): Promise<Record<string, string>> {
    return {
      parcel_id: "string",
      owner_name: "string",
      situs_address: "string",
      land_value: "number",
      improvement_value: "number",
      total_value: "number",
      updated_at: "string",
      geometry: "geometry",
    };
  }
}
