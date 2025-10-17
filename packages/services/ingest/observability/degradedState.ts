import { recordEndpointHealth } from "../metrics/ingestMetrics";

export interface DegradedState {
  endpointId: string;
  reason: string;
  detectedAt: string;
}

export class DegradedStateMonitor {
  private readonly degraded = new Map<string, DegradedState>();

  setDegraded(endpointId: string, reason: string): void {
    const state: DegradedState = {
      endpointId,
      reason,
      detectedAt: new Date().toISOString(),
    };
    this.degraded.set(endpointId, state);
    recordEndpointHealth(endpointId, "degraded");
  }

  clear(endpointId: string): void {
    if (this.degraded.has(endpointId)) {
      this.degraded.delete(endpointId);
      recordEndpointHealth(endpointId, "healthy");
    }
  }

  getState(endpointId: string): DegradedState | undefined {
    return this.degraded.get(endpointId);
  }
}
