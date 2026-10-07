import type { Task, TaskFilter } from "./types";

export function filterTasks(tasks: readonly Task[], filter: TaskFilter): Task[] {
  switch (filter) {
    case "active":
      return tasks.filter((task) => !task.completed);
    case "completed":
      return tasks.filter((task) => task.completed);
    case "all":
      return [...tasks];
  }
}

export function countTasks(tasks: readonly Task[]): Record<TaskFilter, number> {
  const completed = tasks.filter((task) => task.completed).length;
  return { all: tasks.length, active: tasks.length - completed, completed };
}
