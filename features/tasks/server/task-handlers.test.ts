import { afterEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { createInMemoryTaskRepository } from "./task-repository";
import { SEED_TASKS } from "./seed-tasks";
import { createTaskHandlers, type TaskHandlerDependencies } from "./task-handlers";
import { createTaskService, type TaskService } from "./task-service";

const BASE_URL = "http://localhost:3000/api/tasks";

function setup(overrides: Partial<TaskHandlerDependencies> = {}) {
  const service = createTaskService(createInMemoryTaskRepository(SEED_TASKS));
  return { service, handlers: createTaskHandlers({ service, ...overrides }) };
}

function jsonRequest(
  method: string,
  body: unknown,
  { url = BASE_URL, headers = {} }: { url?: string; headers?: Record<string, string> } = {},
) {
  return new Request(url, {
    method,
    headers: { host: "localhost:3000", "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const routeFor = (id: string) => ({ params: Promise.resolve({ id }) });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/tasks", () => {
  it("lists the tasks and marks the response as not cacheable", async () => {
    const { handlers } = setup();

    const response = await handlers.list(new Request(BASE_URL), undefined);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toHaveLength(SEED_TASKS.length);
  });
});

describe("POST /api/tasks", () => {
  it("creates a task", async () => {
    const { handlers, service } = setup();

    const response = await handlers.create(jsonRequest("POST", { title: "New task" }), undefined);

    expect(response.status).toBe(201);
    const task = await response.json();
    expect(task).toMatchObject({ title: "New task", priority: "medium", completed: false });
    expect(await service.get(task.id)).toBeDefined();
  });

  it("returns 400 with a message for invalid input", async () => {
    const { handlers } = setup();

    const response = await handlers.create(jsonRequest("POST", { title: "" }), undefined);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Title is required." });
  });

  it("returns 400 for malformed JSON", async () => {
    const { handlers } = setup();

    const response = await handlers.create(jsonRequest("POST", "{oops"), undefined);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Request body must be valid JSON." });
  });

  it("returns 415 unless the body is JSON", async () => {
    const { handlers } = setup();
    const request = jsonRequest("POST", "title=hi", {
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });

    expect((await handlers.create(request, undefined)).status).toBe(415);
  });

  it("returns 413 for a body that is too large", async () => {
    const { handlers } = setup();
    const request = jsonRequest("POST", { title: "x", description: "y".repeat(20_000) });

    expect((await handlers.create(request, undefined)).status).toBe(413);
  });

  it("returns 409 when the task limit is reached", async () => {
    const service = createTaskService(createInMemoryTaskRepository(), { maxTasks: 1 });
    const handlers = createTaskHandlers({ service });
    await handlers.create(jsonRequest("POST", { title: "One" }), undefined);

    const response = await handlers.create(jsonRequest("POST", { title: "Two" }), undefined);

    expect(response.status).toBe(409);
  });
});

describe("CSRF protection", () => {
  it("rejects a request sent from another website", async () => {
    const { handlers } = setup();
    const request = jsonRequest("POST", { title: "x" }, {
      headers: { origin: "https://evil.example" },
    });

    const response = await handlers.create(request, undefined);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Cross-site requests are not allowed." });
  });

  it("rejects a request the browser marks as cross-site", async () => {
    const { handlers } = setup();
    const request = jsonRequest("DELETE", "", {
      url: `${BASE_URL}/welcome`,
      headers: { "sec-fetch-site": "cross-site" },
    });

    expect((await handlers.remove(request, routeFor("welcome"))).status).toBe(403);
  });

  it("accepts a request from the app's own pages", async () => {
    const { handlers } = setup();
    const request = jsonRequest("POST", { title: "x" }, {
      headers: { origin: "http://localhost:3000", "sec-fetch-site": "same-origin" },
    });

    expect((await handlers.create(request, undefined)).status).toBe(201);
  });
});

describe("rate limiting", () => {
  it("returns 429 with Retry-After once a client goes over the limit", async () => {
    const { handlers } = setup({
      writeLimiter: createRateLimiter({ limit: 2, windowMs: 60_000 }),
    });
    const send = () =>
      handlers.create(
        jsonRequest("POST", { title: "x" }, { headers: { "x-forwarded-for": "203.0.113.7" } }),
        undefined,
      );

    expect((await send()).status).toBe(201);
    expect((await send()).status).toBe(201);
    const limited = await send();

    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("60");
  });
});

describe("/api/tasks/:id", () => {
  it("returns one task", async () => {
    const { handlers } = setup();

    const response = await handlers.get(new Request(`${BASE_URL}/welcome`), routeFor("welcome"));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: "welcome" });
  });

  it("updates a task", async () => {
    const { handlers } = setup();
    const request = jsonRequest("PATCH", { completed: false }, { url: `${BASE_URL}/welcome` });

    const response = await handlers.update(request, routeFor("welcome"));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: "welcome", completed: false });
  });

  it("deletes a task, then reports it as missing", async () => {
    const { handlers } = setup();
    const remove = () =>
      handlers.remove(new Request(`${BASE_URL}/welcome`, { method: "DELETE" }), routeFor("welcome"));

    expect((await remove()).status).toBe(204);
    expect((await remove()).status).toBe(404);
  });

  it("returns 404 for an unknown task", async () => {
    const { handlers } = setup();

    const response = await handlers.get(new Request(`${BASE_URL}/missing`), routeFor("missing"));

    expect(response.status).toBe(404);
  });

  it("returns 400 for a malformed id", async () => {
    const { handlers } = setup();

    const response = await handlers.get(new Request(BASE_URL), routeFor("../../etc/passwd"));

    expect(response.status).toBe(400);
  });
});

describe("unexpected errors", () => {
  it("returns a generic 500 and never leaks the real error to the client", async () => {
    const failingService = {
      list: async () => {
        throw new Error("database password is hunter2");
      },
    } as unknown as TaskService;
    const handlers = createTaskHandlers({ service: failingService });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await handlers.list(new Request(BASE_URL), undefined);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: "Something went wrong on the server. Please try again." });
    expect(JSON.stringify(body)).not.toContain("hunter2");
    expect(log).toHaveBeenCalled();
  });
});
