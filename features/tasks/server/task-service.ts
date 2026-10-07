import "server-only";
import { MAX_TASKS } from "../constants";
import type { NewTaskInput, Task, TaskChanges } from "../types";
import type { TaskRepository } from "./task-repository";

export class TaskLimitError extends Error {
  constructor(readonly limit: number) {
    super(`You can have at most ${limit} tasks. Delete some before adding more.`);
    this.name = "TaskLimitError";
  }
}

export interface TaskServiceOptions {
  maxTasks?: number;
  now?: () => Date;
  generateId?: () => string;
}

export type TaskService = ReturnType<typeof createTaskService>;

export function createTaskService(
  repository: TaskRepository,
  {
    maxTasks = MAX_TASKS,
    now = () => new Date(),
    generateId = () => crypto.randomUUID(),
  }: TaskServiceOptions = {},
) {
  return {
    async list(): Promise<Task[]> {
      const tasks = await repository.findAll();
      return tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // newest first
    },

    get(id: string): Promise<Task | undefined> {
      return repository.findById(id);
    },

    async create(input: NewTaskInput): Promise<Task> {
      if ((await repository.count()) >= maxTasks) {
        throw new TaskLimitError(maxTasks);
      }
      return repository.insert({
        id: generateId(),
        title: input.title,
        description: input.description,
        priority: input.priority,
        completed: false,
        createdAt: now().toISOString(),
      });
    },

    update(id: string, changes: TaskChanges): Promise<Task | undefined> {
      return repository.update(id, changes);
    },

    remove(id: string): Promise<boolean> {
      return repository.delete(id);
    },
  };
}
