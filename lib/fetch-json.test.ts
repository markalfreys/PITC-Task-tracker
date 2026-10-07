import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJson, RequestError } from "./fetch-json";

function stubFetch(...results: Array<Response | Error>) {
  const fetchMock = vi.fn<typeof fetch>();
  for (const result of results) {
    if (result instanceof Error) fetchMock.mockRejectedValueOnce(result);
    else fetchMock.mockResolvedValueOnce(result);
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function errorOf(promise: Promise<unknown>): Promise<RequestError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof RequestError) return error;
    throw error;
  }
  throw new Error("Expected the request to fail");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchJson", () => {
  it("returns the parsed JSON body", async () => {
    stubFetch(Response.json({ id: 1 }));
    await expect(fetchJson("/api/x")).resolves.toEqual({ id: 1 });
  });

  it("sends JSON headers when there is a body", async () => {
    const fetchMock = stubFetch(Response.json({}));

    await fetchJson("/api/x", { method: "POST", body: "{}" });

    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("accept")).toBe("application/json");
  });

  it("returns undefined for 204 No Content", async () => {
    stubFetch(new Response(null, { status: 204 }));
    await expect(fetchJson("/api/x")).resolves.toBeUndefined();
  });

  it("uses the server's error message", async () => {
    stubFetch(Response.json({ error: "Title is required." }, { status: 400 }));

    const error = await errorOf(fetchJson("/api/x"));

    expect(error.message).toBe("Title is required.");
    expect(error.status).toBe(400);
  });

  it("gives a readable message when the error body isn't JSON", async () => {
    stubFetch(new Response("<h1>Bad gateway</h1>", { status: 500 }));

    expect((await errorOf(fetchJson("/api/x"))).message).toBe(
      "The server ran into a problem. Please try again.",
    );
  });

  it("explains network failures", async () => {
    stubFetch(new TypeError("Failed to fetch"));

    const error = await errorOf(fetchJson("/api/x"));

    expect(error.message).toMatch(/Can't reach the server/);
    expect(error.status).toBeNull();
  });

  it("times out instead of waiting forever", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
          }),
      ),
    );

    const error = await errorOf(fetchJson("/api/x", { timeoutMs: 20 }));

    expect(error.message).toMatch(/took too long/);
  });

  it("retries network errors when asked to", async () => {
    const fetchMock = stubFetch(
      new TypeError("Failed to fetch"),
      new Response(null, { status: 503 }),
      Response.json(["ok"]),
    );

    await expect(fetchJson("/api/x", { retries: 2, retryDelayMs: 1 })).resolves.toEqual(["ok"]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not retry by default, or when the request itself was wrong", async () => {
    const fetchMock = stubFetch(
      new TypeError("Failed to fetch"),
      Response.json({ error: "Bad input" }, { status: 400 }),
    );

    await errorOf(fetchJson("/api/x"));
    await errorOf(fetchJson("/api/x", { retries: 3, retryDelayMs: 1 }));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
