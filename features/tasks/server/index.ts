import "server-only";
import { globalSingleton } from "@/lib/global-singleton";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { SEED_TASKS } from "./seed-tasks";
import { createTaskHandlers } from "./task-handlers";
import { createInMemoryTaskRepository } from "./task-repository";
import { createTaskService } from "./task-service";

const repository = globalSingleton("tasks:repository", () =>
  createInMemoryTaskRepository(SEED_TASKS),
);

export const taskService = createTaskService(repository);

export const taskHandlers = createTaskHandlers({
  service: taskService,
  readLimiter: globalSingleton("tasks:read-limit", () =>
    createRateLimiter({ limit: 120, windowMs: 60_000 }),
  ),
  writeLimiter: globalSingleton("tasks:write-limit", () =>
    createRateLimiter({ limit: 30, windowMs: 60_000 }),
  ),
});
