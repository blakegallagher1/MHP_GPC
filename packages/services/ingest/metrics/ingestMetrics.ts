import { metricsRegistry } from "../../../core/metrics/metrics";

const ingestDuration = metricsRegistry.histogram({
  name: "ingest_duration_ms",
  description: "Duration of ingest runs in milliseconds",
});

const schemaDriftCounter = metricsRegistry.counter({
  name: "schema_drift_events",
  description: "Number of schema drift detections",
});

const endpointHealthCounter = metricsRegistry.counter({
  name: "endpoint_health_status",
  description: "Counts endpoint health degradations",
});

export const recordIngestDuration = (endpointId: string, durationMs: number): void => {
  ingestDuration.record(durationMs, { endpointId });
};

export const recordSchemaDrift = (endpointId: string): void => {
  schemaDriftCounter.increment(1, { endpointId });
};

export const recordEndpointHealth = (endpointId: string, status: "healthy" | "degraded"): void => {
  endpointHealthCounter.increment(1, { endpointId, status });
};
