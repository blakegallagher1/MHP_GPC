import { ArcGisConnector } from "./arcGisConnector";
import type { ConnectorContext } from "../types";

export interface AdjudicatedParcelRecord {
  adjudicated_id: string;
  parcel_id?: string;
  status?: string;
  auction_date?: string;
  minimum_bid?: number;
  geometry?: GeoJSON.Geometry;
}

export class AdjudicatedParcelsConnector extends ArcGisConnector<AdjudicatedParcelRecord> {
  constructor(context: ConnectorContext) {
    super({
      context,
      resourcePath: "query",
    });
  }

  get endpointId(): string {
    return "adjudicated-parcels";
  }

  async describeSchema(): Promise<Record<string, string>> {
    return {
      adjudicated_id: "string",
      parcel_id: "string",
      status: "string",
      auction_date: "string",
      minimum_bid: "number",
      geometry: "geometry",
    };
  }
}
