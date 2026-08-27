import Constants from 'expo-constants';

const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? 'https://id.izim.kz';

const DEFAULT_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class NetworkError extends Error {
  constructor(message = 'NETWORK_ERROR') {
    super(message);
    this.name = 'NetworkError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      let message = `HTTP_${response.status}`;
      try {
        const data = await response.json();
        if (typeof data?.error === 'string') message = data.error;
      } catch {
        // response had no JSON body — keep the generic message
      }
      throw new ApiError(message, response.status);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new NetworkError(error instanceof Error ? error.message : 'NETWORK_ERROR');
  } finally {
    clearTimeout(timeout);
  }
}
