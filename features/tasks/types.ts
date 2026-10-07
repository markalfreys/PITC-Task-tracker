import type { PRIORITIES } from "./constants";

export type Priority = (typeof PRIORITIES)[number];

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  completed: boolean;
  createdAt: string; // ISO date
}

export type NewTaskInput = Pick<Task, "title" | "description" | "priority">;

export type TaskChanges = Partial<Pick<Task, "title" | "description" | "priority" | "completed">>;

export type TaskFilter = "all" | "active" | "completed";

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };
