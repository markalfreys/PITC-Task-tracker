export const PRIORITIES = ["low", "medium", "high"] as const;

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
} as const satisfies Record<(typeof PRIORITIES)[number], string>;

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;
export const MAX_TASKS = 100;
export const TASK_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
