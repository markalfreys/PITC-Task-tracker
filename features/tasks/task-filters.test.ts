import { describe, expect, it } from "vitest";
import { countTasks, filterTasks } from "./task-filters";
import type { Task } from "./types";

function task(id: string, completed: boolean): Task {
  return {
    id,
    title: id,
    description: "",
    priority: "medium",
    completed,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

const tasks = [task("a", false), task("b", true), task("c", false)];

describe("filterTasks", () => {
  it("returns every task for 'all'", () => {
    expect(filterTasks(tasks, "all").map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  it("returns unfinished tasks for 'active'", () => {
    expect(filterTasks(tasks, "active").map((t) => t.id)).toEqual(["a", "c"]);
  });

  it("returns finished tasks for 'completed'", () => {
    expect(filterTasks(tasks, "completed").map((t) => t.id)).toEqual(["b"]);
  });
});

describe("countTasks", () => {
  it("counts tasks for each filter", () => {
    expect(countTasks(tasks)).toEqual({ all: 3, active: 2, completed: 1 });
  });

  it("handles an empty list", () => {
    expect(countTasks([])).toEqual({ all: 0, active: 0, completed: 0 });
  });
});
