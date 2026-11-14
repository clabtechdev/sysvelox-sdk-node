import { randomUUID } from 'node:crypto';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorCode: string | null = null,
    public readonly body: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = [250, 750, 1500];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class HttpClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = 'https://api.sysvelox.com',
    private readonly timeoutMs: number = 30_000,
  ) {}

  async get(path: string, query: Record<string, string | number> = {}): Promise<any> {
    const url = new URL(this.baseUrl + path);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, String(value));
    }

    return this.request('GET', url.toString());
  }

  async post(path: string, body?: Record<string, unknown>, idempotencyKey?: string): Promise<any> {
    return this.request('POST', this.baseUrl + path, body, idempotencyKey);
  }

  async put(path: string, body?: Record<string, unknown>): Promise<any> {
    return this.request('PUT', this.baseUrl + path, body);
  }

  private async request(
    method: string,
    url: string,
    body?: Record<string, unknown>,
    idempotencyKey?: string,
  ): Promise<any> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'sysvelox-fiscal-sdk-node',
    };
    if (idempotencyKey !== undefined) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    let attempt = 0;

    while (true) {
      attempt++;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      let response: Response;
      try {
        response = await fetch(url, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
      } catch (networkError) {
        clearTimeout(timeout);
        if (attempt <= MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS[attempt - 1] ?? 1500);
          continue;
        }
        throw new ApiError(`Falha de rede ao chamar a API Fiscal: ${(networkError as Error).message}`, 0);
      }
      clearTimeout(timeout);

      const isRetryableStatus = response.status === 429 || response.status >= 500;
      if (isRetryableStatus && attempt <= MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS[attempt - 1] ?? 1500);
        continue;
      }

      const text = await response.text();
      const decoded = text !== '' ? JSON.parse(text) : {};

      if (response.status >= 400) {
        throw new ApiError(
          decoded.message ?? `Erro HTTP ${response.status}`,
          response.status,
          decoded.error ?? decoded.code ?? null,
          decoded,
        );
      }

      return decoded;
    }
  }
}

export function gerarIdempotencyKey(): string {
  return randomUUID();
}
