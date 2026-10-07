import { useState } from "react";
import { RequestError } from "@/lib/fetch-json";
import type { NewTaskInput, Task } from "../types";
import { taskApi } from "./task-api";

// The list only changes after the server accepts a change.
export function useTasks(initialTasks: Task[]) {
  const [tasks, setTasks] = useState(initialTasks);
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  function setBusy(id: string, busy: boolean) {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleError(err: unknown) {
    setError(err instanceof Error ? err.message : "Something went wrong.");

    // Task was deleted elsewhere: reload the list.
    if (err instanceof RequestError && err.status === 404) {
      try {
        setTasks(await taskApi.list());
      } catch {
        // keep the current list
      }
    }
  }

  async function runForTask(id: string, action: () => Promise<void>) {
    setError(null);
    setBusy(id, true);
    try {
      await action();
    } catch (err) {
      await handleError(err);
    } finally {
      setBusy(id, false);
    }
  }

  async function addTask(input: NewTaskInput): Promise<boolean> {
    setError(null);
    try {
      const task = await taskApi.create(input);
      setTasks((prev) => [task, ...prev]);
      return true;
    } catch (err) {
      await handleError(err);
      return false;
    }
  }

  function toggleTask(task: Task) {
    return runForTask(task.id, async () => {
      const updated = await taskApi.update(task.id, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    });
  }

  function deleteTask(task: Task) {
    return runForTask(task.id, async () => {
      await taskApi.remove(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    });
  }

  return {
    tasks,
    busyIds,
    error,
    dismissError: () => setError(null),
    addTask,
    toggleTask,
    deleteTask,
  };
}
