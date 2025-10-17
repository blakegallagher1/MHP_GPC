import { z } from "zod";

export const endpointConfigSchema = z.object({
  id: z.string(),
  baseUrl: z.string().url(),
  datasetId: z.string(),
  defaultLimit: z.number().int().positive().default(100),
});

export const ingestConfigSchema = z.object({
  redis: z.object({
    url: z.string().url().optional(),
    ttlSeconds: z.number().int().positive().default(3600),
  }),
  objectStorage: z.object({
    bucket: z.string(),
    prefix: z.string().default("ingest"),
  }),
  endpoints: z.array(endpointConfigSchema),
});

export type EndpointConfig = z.infer<typeof endpointConfigSchema>;
export type IngestConfig = z.infer<typeof ingestConfigSchema>;

export const loadIngestConfig = (env: NodeJS.ProcessEnv): IngestConfig => {
  const raw = {
    redis: {
      url: env.REDIS_URL,
      ttlSeconds: env.INGEST_CACHE_TTL ? Number(env.INGEST_CACHE_TTL) : undefined,
    },
    objectStorage: {
      bucket: env.OBJECT_STORAGE_BUCKET ?? "",
      prefix: env.OBJECT_STORAGE_PREFIX ?? "ingest",
    },
    endpoints: [],
  };

  return ingestConfigSchema.parse(raw);
};
