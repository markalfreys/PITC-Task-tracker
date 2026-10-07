import "server-only";
import type { RateLimiter } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientKey } from "@/lib/security/request-guards";
import { ApiError } from "./api-error";

export type RouteHandler<Context = unknown> = (
  request: Request,
  context: Context,
) => Promise<Response>;

export interface ApiHandlerOptions {
  rateLimiter?: RateLimiter;
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Adds CSRF check, rate limiting, error handling and no-cache to a route handler.
export function apiHandler<Context = unknown>(
  handler: RouteHandler<Context>,
  { rateLimiter }: ApiHandlerOptions = {},
): RouteHandler<Context> {
  return async (request, context) => {
    let response: Response;

    try {
      if (UNSAFE_METHODS.has(request.method)) assertSameOrigin(request);
      if (rateLimiter) enforceRateLimit(rateLimiter, request);
      response = await handler(request, context);
    } catch (error) {
      response = errorResponse(error);
    }

    response.headers.set("Cache-Control", "no-store");
    return response;
  };
}

function enforceRateLimit(rateLimiter: RateLimiter, request: Request) {
  const { allowed, retryAfterSeconds } = rateLimiter.check(getClientKey(request));
  if (!allowed) {
    throw new ApiError(
      429,
      `Too many requests. Please wait ${retryAfterSeconds} seconds and try again.`,
      { "Retry-After": String(retryAfterSeconds) },
    );
  }
}

function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      { error: error.message },
      { status: error.status, headers: error.headers },
    );
  }

  // Log the real error, but don't send its details to the client.
  console.error("Unexpected API error:", error);
  return Response.json(
    { error: "Something went wrong on the server. Please try again." },
    { status: 500 },
  );
}
