export interface RetryOptions {
  retries: number;
  factor?: number;
  minTimeoutMs?: number;
  maxTimeoutMs?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

export const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const {
    retries,
    factor = 2,
    minTimeoutMs = 100,
    maxTimeoutMs = 5_000,
    onRetry,
  } = options;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
      const timeout = Math.min(minTimeoutMs * Math.pow(factor, attempt), maxTimeoutMs);
      onRetry?.(attempt + 1, error);
      await wait(timeout);
    }
    attempt += 1;
  }

  throw lastError;
}
