import { ArcGisConnector } from "./arcGisConnector";
import type { Geometry } from "geojson";
import type { ConnectorContext } from "../types";

export interface SubjectPropertyRecord extends Record<string, unknown> {
  property_id: string;
  owner_name?: string;
  address?: string;
  assessed_value?: number;
  land_use?: string;
  geometry?: Geometry;
}

export class SubjectPropertyConnector extends ArcGisConnector<SubjectPropertyRecord> {
  constructor(context: ConnectorContext) {
    super({
      context,
      resourcePath: "query",
    });
  }

  get endpointId(): string {
    return "subject-property";
  }

  async describeSchema(): Promise<Record<string, string>> {
    return {
      property_id: "string",
      owner_name: "string",
      address: "string",
      assessed_value: "number",
      land_use: "string",
      geometry: "geometry",
    };
  }
}
