import { SocrataConnector } from "./socrataConnector";
import type { ConnectorContext } from "../types";

export interface ThreeOneOneRecord {
  request_id: string;
  category?: string;
  status?: string;
  opened_at?: string;
  closed_at?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export class ThreeOneOneConnector extends SocrataConnector<ThreeOneOneRecord> {
  constructor(context: ConnectorContext) {
    super({
      context,
      resourcePath: "resource/311-requests.json",
    });
  }

  get endpointId(): string {
    return "311-requests";
  }

  async describeSchema(): Promise<Record<string, string>> {
    return {
      request_id: "string",
      category: "string",
      status: "string",
      opened_at: "string",
      closed_at: "string",
      latitude: "number",
      longitude: "number",
      address: "string",
    };
  }
}
