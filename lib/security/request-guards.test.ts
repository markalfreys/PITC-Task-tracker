import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/api-error";
import { assertSameOrigin, getClientKey, readJsonBody } from "./request-guards";

const ENDPOINT = "http://localhost:3000/api/tasks";

function post(headers: Record<string, string>, body: BodyInit = "{}") {
  return new Request(ENDPOINT, { method: "POST", headers: { host: "localhost:3000", ...headers }, body });
}

function streamingRequest(chunks: string[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Request(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    duplex: "half",
  } as RequestInit);
}

async function statusOf(promise: Promise<unknown>): Promise<number | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    return error instanceof ApiError ? error.status : -1;
  }
}

describe("assertSameOrigin", () => {
  it("allows requests without browser headers (curl, scripts)", () => {
    expect(() => assertSameOrigin(post({}))).not.toThrow();
  });

  it("allows same-origin requests", () => {
    const request = post({ origin: "http://localhost:3000", "sec-fetch-site": "same-origin" });
    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it.each([
    ["another site's Origin", { origin: "https://evil.example" }],
    ["a different port", { origin: "http://localhost:4000" }],
    ["an opaque 'null' Origin", { origin: "null" }],
    ["Sec-Fetch-Site: cross-site", { "sec-fetch-site": "cross-site" }],
    ["Sec-Fetch-Site: same-site", { "sec-fetch-site": "same-site" }],
  ])("rejects %s", (_label, headers) => {
    expect(() => assertSameOrigin(post(headers))).toThrow(ApiError);
  });
});

describe("readJsonBody", () => {
  it("parses a JSON body", async () => {
    const request = post({ "content-type": "application/json; charset=utf-8" }, '{"a":1}');
    await expect(readJsonBody(request)).resolves.toEqual({ a: 1 });
  });

  it("rejects other content types with 415", async () => {
    expect(await statusOf(readJsonBody(post({ "content-type": "text/plain" })))).toBe(415);
    expect(await statusOf(readJsonBody(post({})))).toBe(415);
  });

  it("rejects a body over the limit with 413", async () => {
    const request = post({ "content-type": "application/json" }, JSON.stringify("x".repeat(200)));
    expect(await statusOf(readJsonBody(request, 100))).toBe(413);
  });

  it("stops reading a streamed body once it passes the limit", async () => {
    const request = streamingRequest(['"', "x".repeat(60), "x".repeat(60), '"']);
    expect(await statusOf(readJsonBody(request, 100))).toBe(413);
  });

  it("reads a streamed body under the limit", async () => {
    await expect(readJsonBody(streamingRequest(['{"tit', 'le":"hi"}']))).resolves.toEqual({
      title: "hi",
    });
  });

  it("rejects an empty or malformed body with 400", async () => {
    expect(await statusOf(readJsonBody(post({ "content-type": "application/json" }, "")))).toBe(400);
    expect(await statusOf(readJsonBody(post({ "content-type": "application/json" }, "{")))).toBe(400);
  });
});

describe("getClientKey", () => {
  it("uses the first X-Forwarded-For address", () => {
    expect(getClientKey(post({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("falls back to X-Real-IP, then 'unknown'", () => {
    expect(getClientKey(post({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(getClientKey(post({}))).toBe("unknown");
  });
});
