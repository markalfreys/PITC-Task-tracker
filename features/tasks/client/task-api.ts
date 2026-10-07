import { fetchJson } from "@/lib/fetch-json";
import type { NewTaskInput, Task, TaskChanges } from "../types";

const taskUrl = (id: string) => `/api/tasks/${encodeURIComponent(id)}`;

export const taskApi = {
  list: () => fetchJson<Task[]>("/api/tasks", { retries: 2 }), // reads are safe to retry

  create: (input: NewTaskInput) =>
    fetchJson<Task>("/api/tasks", { method: "POST", body: JSON.stringify(input) }),

  update: (id: string, changes: TaskChanges) =>
    fetchJson<Task>(taskUrl(id), { method: "PATCH", body: JSON.stringify(changes) }),

  remove: (id: string) => fetchJson<void>(taskUrl(id), { method: "DELETE" }),
};
