import "server-only";
import { ApiError } from "@/lib/api/api-error";
import { apiHandler } from "@/lib/api/api-handler";
import type { RateLimiter } from "@/lib/security/rate-limit";
import { readJsonBody } from "@/lib/security/request-guards";
import type { ParseResult } from "../types";
import { isValidTaskId, parseNewTask, parseTaskChanges } from "../validation";
import { TaskLimitError, type TaskService } from "./task-service";

export interface TaskRouteContext {
  params: Promise<{ id: string }>;
}

export interface TaskHandlerDependencies {
  service: TaskService;
  readLimiter?: RateLimiter;
  writeLimiter?: RateLimiter;
}

function valid<T>(result: ParseResult<T>): T {
  if (!result.ok) throw new ApiError(400, result.error);
  return result.value;
}

async function taskIdFrom(context: TaskRouteContext): Promise<string> {
  const { id } = await context.params;
  if (!isValidTaskId(id)) throw new ApiError(400, "Invalid task id.");
  return id;
}

function taskNotFound() {
  return new ApiError(404, "Task not found. It may have been deleted.");
}

// Dependencies are passed in so tests can use their own.
export function createTaskHandlers({
  service,
  readLimiter,
  writeLimiter,
}: TaskHandlerDependencies) {
  const read = { rateLimiter: readLimiter };
  const write = { rateLimiter: writeLimiter };

  return {
    // GET /api/tasks
    list: apiHandler(async () => Response.json(await service.list()), read),

    // POST /api/tasks
    create: apiHandler(async (request) => {
      const input = valid(parseNewTask(await readJsonBody(request)));
      try {
        return Response.json(await service.create(input), { status: 201 });
      } catch (error) {
        if (error instanceof TaskLimitError) throw new ApiError(409, error.message);
        throw error;
      }
    }, write),

    // GET /api/tasks/:id
    get: apiHandler<TaskRouteContext>(async (_request, context) => {
      const task = await service.get(await taskIdFrom(context));
      if (!task) throw taskNotFound();
      return Response.json(task);
    }, read),

    // PATCH /api/tasks/:id
    update: apiHandler<TaskRouteContext>(async (request, context) => {
      const id = await taskIdFrom(context);
      const changes = valid(parseTaskChanges(await readJsonBody(request)));
      const task = await service.update(id, changes);
      if (!task) throw taskNotFound();
      return Response.json(task);
    }, write),

    // DELETE /api/tasks/:id
    remove: apiHandler<TaskRouteContext>(async (_request, context) => {
      const deleted = await service.remove(await taskIdFrom(context));
      if (!deleted) throw taskNotFound();
      return new Response(null, { status: 204 });
    }, write),
  };
}
