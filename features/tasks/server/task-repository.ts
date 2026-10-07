import "server-only";
import type { Task, TaskChanges } from "../types";

// Storage for tasks. A database version could replace the in-memory one.
export interface TaskRepository {
  findAll(): Promise<Task[]>;
  findById(id: string): Promise<Task | undefined>;
  count(): Promise<number>;
  insert(task: Task): Promise<Task>;
  update(id: string, changes: TaskChanges): Promise<Task | undefined>;
  delete(id: string): Promise<boolean>;
}

// Data resets when the server restarts.
export function createInMemoryTaskRepository(seed: readonly Task[] = []): TaskRepository {
  // Return copies so callers can't change stored tasks.
  const copy = (task: Task): Task => ({ ...task });
  const tasks = new Map(seed.map((task) => [task.id, copy(task)]));

  return {
    async findAll() {
      return [...tasks.values()].map(copy);
    },

    async findById(id) {
      const task = tasks.get(id);
      return task && copy(task);
    },

    async count() {
      return tasks.size;
    },

    async insert(task) {
      tasks.set(task.id, copy(task));
      return copy(task);
    },

    async update(id, changes) {
      const task = tasks.get(id);
      if (!task) return undefined;

      const updated: Task = {
        ...task,
        title: changes.title ?? task.title,
        description: changes.description ?? task.description,
        priority: changes.priority ?? task.priority,
        completed: changes.completed ?? task.completed,
      };
      tasks.set(id, updated);
      return copy(updated);
    },

    async delete(id) {
      return tasks.delete(id);
    },
  };
}
