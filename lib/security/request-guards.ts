import "server-only";
import { ApiError } from "@/lib/api/api-error";

export const MAX_JSON_BODY_BYTES = 10_000;

const CROSS_SITE_ERROR = "Cross-site requests are not allowed.";

// CSRF protection: reject requests sent from other websites.
export function assertSameOrigin(request: Request): void {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw new ApiError(403, CROSS_SITE_ERROR);
  }

  const origin = request.headers.get("origin");
  if (origin && hostOf(origin) !== requestHost(request)) {
    throw new ApiError(403, CROSS_SITE_ERROR);
  }
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function requestHost(request: Request): string | null {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  return forwardedHost || request.headers.get("host");
}

export async function readJsonBody(
  request: Request,
  maxBytes = MAX_JSON_BODY_BYTES,
): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new ApiError(415, "Content-Type must be application/json.");
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) throw tooLarge(maxBytes);

  const text = await readTextWithLimit(request, maxBytes);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
}

function tooLarge(maxBytes: number) {
  return new ApiError(413, `Request body must be ${maxBytes} bytes or smaller.`);
}

// Content-Length can be missing or wrong, so count bytes while reading.
async function readTextWithLimit(request: Request, maxBytes: number): Promise<string> {
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw tooLarge(maxBytes);
    }
    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
}

// Client IP for rate limiting. Only reliable behind a proxy that sets X-Forwarded-For.
export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "unknown";
}
