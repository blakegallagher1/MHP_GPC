import { ArcGisConnector } from "./arcGisConnector";
import type { Geometry } from "geojson";
import type { ConnectorContext } from "../types";

export interface LotLookupRecord extends Record<string, unknown> {
  lot_number: string;
  parcel_id?: string;
  zoning?: string;
  council_district?: string;
  neighborhood?: string;
  geometry?: Geometry;
}

export class LotLookupConnector extends ArcGisConnector<LotLookupRecord> {
  constructor(context: ConnectorContext) {
    super({
      context,
      resourcePath: "query",
    });
  }

  get endpointId(): string {
    return "lot-lookup";
  }

  async describeSchema(): Promise<Record<string, string>> {
    return {
      lot_number: "string",
      parcel_id: "string",
      zoning: "string",
      council_district: "string",
      neighborhood: "string",
      geometry: "geometry",
    };
  }
}
