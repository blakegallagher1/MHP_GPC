import { ArcGisConnector } from "./arcGisConnector";
import type { Geometry } from "geojson";
import type { ConnectorContext } from "../types";

export interface AdjudicatedParcelRecord extends Record<string, unknown> {
  adjudicated_id: string;
  parcel_id?: string;
  status?: string;
  auction_date?: string;
  minimum_bid?: number;
  geometry?: Geometry;
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
