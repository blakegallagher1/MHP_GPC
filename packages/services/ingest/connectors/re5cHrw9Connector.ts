import { SocrataConnector } from "./socrataConnector";
import type { ConnectorContext } from "../types";

export interface Re5cHrw9Record {
  service_request_id: string;
  status: string;
  service_name: string;
  service_code?: string;
  agency_responsible?: string;
  requested_datetime?: string;
  updated_datetime?: string;
  address?: string;
  zipcode?: string;
  latitude?: number;
  longitude?: number;
}

export class Re5cHrw9Connector extends SocrataConnector<Re5cHrw9Record> {
  constructor(context: ConnectorContext) {
    super({
      context,
      resourcePath: "resource/re5c-hrw9.json",
    });
  }

  get endpointId(): string {
    return "re5c-hrw9";
  }

  async describeSchema(): Promise<Record<string, string>> {
    return {
      service_request_id: "string",
      status: "string",
      service_name: "string",
      service_code: "string",
      agency_responsible: "string",
      requested_datetime: "string",
      updated_datetime: "string",
      address: "string",
      zipcode: "string",
      latitude: "number",
      longitude: "number",
    };
  }
}
