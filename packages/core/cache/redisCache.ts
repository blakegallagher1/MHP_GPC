export interface RedisLikeClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, durationSeconds?: number): Promise<unknown>;
}

export interface CacheOptions {
  ttlSeconds?: number;
  namespace?: string;
}

export class RedisCache<T> {
  constructor(private readonly client: RedisLikeClient, private readonly options: CacheOptions = {}) {}

  private buildKey(key: string): string {
    const namespace = this.options.namespace ? `${this.options.namespace}:` : "";
    return `${namespace}${key}`;
  }

  async get(key: string): Promise<T | null> {
    const result = await this.client.get(this.buildKey(key));
    if (!result) {
      return null;
    }
    return JSON.parse(result) as T;
  }

  async set(key: string, value: T): Promise<void> {
    const payload = JSON.stringify(value);
    const ttl = this.options.ttlSeconds;
    if (ttl) {
      await this.client.set(this.buildKey(key), payload, "EX", ttl);
    } else {
      await this.client.set(this.buildKey(key), payload);
    }
  }
}
