import { describe, expect, it } from "vitest";
import type { NewTaskInput } from "../types";
import { createInMemoryTaskRepository } from "./task-repository";
import { createTaskService, TaskLimitError, type TaskServiceOptions } from "./task-service";

const input: NewTaskInput = { title: "Write report", description: "", priority: "high" };

function setup(options: TaskServiceOptions = {}) {
  let nextId = 0;
  let clock = Date.parse("2026-01-01T00:00:00.000Z");
  return createTaskService(createInMemoryTaskRepository(), {
    generateId: () => `task-${++nextId}`,
    now: () => new Date((clock += 1000)),
    ...options,
  });
}

describe("task service", () => {
  it("creates a task and sets the server-controlled fields", async () => {
    const service = setup();

    expect(await service.create(input)).toEqual({
      id: "task-1",
      title: "Write report",
      description: "",
      priority: "high",
      completed: false,
      createdAt: "2026-01-01T00:00:01.000Z",
    });
  });

  it("lists tasks newest first", async () => {
    const service = setup();
    await service.create({ ...input, title: "First" });
    await service.create({ ...input, title: "Second" });

    expect((await service.list()).map((t) => t.title)).toEqual(["Second", "First"]);
  });

  it("updates only the given fields", async () => {
    const service = setup();
    const task = await service.create(input);

    const updated = await service.update(task.id, { completed: true });

    expect(updated).toEqual({ ...task, completed: true });
  });

  it("deletes tasks", async () => {
    const service = setup();
    const task = await service.create(input);

    expect(await service.remove(task.id)).toBe(true);
    expect(await service.get(task.id)).toBeUndefined();
  });

  it("reports unknown ids instead of throwing", async () => {
    const service = setup();

    expect(await service.get("missing")).toBeUndefined();
    expect(await service.update("missing", { completed: true })).toBeUndefined();
    expect(await service.remove("missing")).toBe(false);
  });

  it("refuses to store more than the task limit", async () => {
    const service = setup({ maxTasks: 2 });
    await service.create(input);
    await service.create(input);

    await expect(service.create(input)).rejects.toBeInstanceOf(TaskLimitError);
    expect(await service.list()).toHaveLength(2);
  });

  it("returns copies, so changing a result doesn't change stored data", async () => {
    const service = setup();
    const task = await service.create(input);

    task.title = "Changed outside the service";
    (await service.list())[0]!.completed = true;

    expect(await service.get(task.id)).toMatchObject({ title: "Write report", completed: false });
  });
});
