import type { Task } from "../types";

export const SEED_TASKS: readonly Task[] = [
  {
    id: "welcome",
    title: "Read the project README",
    description: "It explains where React, Next.js and TypeScript are used in this app.",
    priority: "high",
    completed: true,
    createdAt: "2026-10-01T09:00:00.000Z",
  },
  {
    id: "first-task",
    title: "Add your first task",
    description: "Use the form above the list to create a new task.",
    priority: "medium",
    completed: false,
    createdAt: "2026-10-02T09:00:00.000Z",
  },
  {
    id: "filters",
    title: "Try the filters",
    description: "Switch between All, Active and Completed tasks.",
    priority: "low",
    completed: false,
    createdAt: "2026-10-03T09:00:00.000Z",
  },
];
