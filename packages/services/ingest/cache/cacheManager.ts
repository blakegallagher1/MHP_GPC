import crypto from "crypto";
import { RedisCache, type RedisLikeClient } from "../../../core/cache/redisCache";
import type { ConnectorQuery, ConnectorResult } from "../types";

export class CacheManager {
  private readonly cache: RedisCache<ConnectorResult<unknown>>;

  constructor(client: RedisLikeClient, options: { ttlSeconds?: number; namespace?: string }) {
    this.cache = new RedisCache(client, options);
  }

  async get<T>(endpointId: string, query: ConnectorQuery): Promise<ConnectorResult<T> | null> {
    const key = this.buildKey(endpointId, query);
    const result = await this.cache.get(key);
    return (result as ConnectorResult<T> | null) ?? null;
  }

  async set<T>(endpointId: string, query: ConnectorQuery, value: ConnectorResult<T>): Promise<void> {
    const key = this.buildKey(endpointId, query);
    await this.cache.set(key, value);
  }

  private buildKey(endpointId: string, query: ConnectorQuery): string {
    const payload = JSON.stringify(query);
    const hash = crypto.createHash("sha256").update(payload).digest("hex");
    return `${endpointId}:${hash}`;
  }
}
