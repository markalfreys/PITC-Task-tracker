export class RequestError extends Error {
  constructor(
    message: string,
    readonly status: number | null, // null if the server couldn't be reached
  ) {
    super(message);
    this.name = "RequestError";
  }
}

export interface FetchJsonOptions extends Omit<RequestInit, "signal"> {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number; // doubles after each retry
}

const RETRYABLE_STATUSES = new Set([502, 503, 504]);

// fetch() for JSON with a timeout, retries and readable error messages.
export async function fetchJson<T>(
  url: string,
  { timeoutMs = 10_000, retries = 0, retryDelayMs = 300, ...init }: FetchJsonOptions = {},
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetchOnce<T>(url, init, timeoutMs);
    } catch (error) {
      const retryable =
        error instanceof RequestError &&
        (error.status === null || RETRYABLE_STATUSES.has(error.status));
      if (!retryable || attempt >= retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * 2 ** attempt));
    }
  }
}

async function fetchOnce<T>(url: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new RequestError(
      timedOut
        ? "The server took too long to respond. Please try again."
        : "Can't reach the server. Check your connection and try again.",
      null,
    );
  }

  if (!response.ok) {
    throw new RequestError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) return undefined as T;

  try {
    return (await response.json()) as T;
  } catch {
    throw new RequestError("The server sent a response the app couldn't read.", response.status);
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
    return body.error;
  }
  if (response.status === 429) return "Too many requests. Please wait a moment and try again.";
  if (response.status >= 500) return "The server ran into a problem. Please try again.";
  return `Request failed (${response.status}).`;
}
