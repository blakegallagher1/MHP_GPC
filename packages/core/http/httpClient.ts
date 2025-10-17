export interface HttpRequestOptions {
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

export interface HttpPageRequestOptions extends HttpRequestOptions {
  limit?: number;
  offset?: number;
}

export interface HttpClientResponse<T> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

export interface HttpClient {
  get<T>(url: string, options?: HttpRequestOptions): Promise<HttpClientResponse<T>>;
}

export class FetchHttpClient implements HttpClient {
  async get<T>(url: string, options: HttpRequestOptions = {}): Promise<HttpClientResponse<T>> {
    const { headers = {}, query, signal } = options;
    const urlObj = new URL(url);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          urlObj.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(urlObj, { headers, signal });
    const data = (await response.json()) as T;
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      status: response.status,
      data,
      headers: responseHeaders,
    };
  }
}
