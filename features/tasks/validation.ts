import {
  DESCRIPTION_MAX_LENGTH,
  PRIORITIES,
  TASK_ID_PATTERN,
  TITLE_MAX_LENGTH,
} from "./constants";
import type { NewTaskInput, ParseResult, Priority, TaskChanges } from "./types";

// Only these fields are accepted, so clients can't set `id` or `createdAt`.
const NEW_TASK_FIELDS = new Set(["title", "description", "priority"]);
const CHANGE_FIELDS = new Set(["title", "description", "priority", "completed"]);

const CONTROL_CHARS = /\p{Cc}/gu;
const CONTROL_CHARS_EXCEPT_NEWLINE_AND_TAB = /[^\P{Cc}\n\t]/gu;

export function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && (PRIORITIES as readonly string[]).includes(value);
}

export function isValidTaskId(value: unknown): value is string {
  return typeof value === "string" && TASK_ID_PATTERN.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function findUnknownField(body: Record<string, unknown>, allowed: Set<string>) {
  return Object.keys(body).find((key) => !allowed.has(key));
}

function parseTitle(value: unknown): ParseResult<string> {
  if (typeof value !== "string") return fail("Title is required.");
  const title = value.replace(CONTROL_CHARS, "").trim();
  if (title === "") return fail("Title is required.");
  if (title.length > TITLE_MAX_LENGTH) {
    return fail(`Title must be ${TITLE_MAX_LENGTH} characters or fewer.`);
  }
  return { ok: true, value: title };
}

function parseDescription(value: unknown): ParseResult<string> {
  if (typeof value !== "string") return fail("Description must be text.");
  const description = value
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARS_EXCEPT_NEWLINE_AND_TAB, "")
    .trim();
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    return fail(`Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`);
  }
  return { ok: true, value: description };
}

function parsePriority(value: unknown): ParseResult<Priority> {
  if (!isPriority(value)) {
    return fail(`Priority must be one of: ${PRIORITIES.join(", ")}.`);
  }
  return { ok: true, value };
}

export function parseNewTask(body: unknown): ParseResult<NewTaskInput> {
  if (!isRecord(body)) return fail("Request body must be a JSON object.");

  const unknownField = findUnknownField(body, NEW_TASK_FIELDS);
  if (unknownField) return fail(`Unknown field "${unknownField.slice(0, 40)}".`);

  const title = parseTitle(body.title);
  if (!title.ok) return title;

  const description = parseDescription(body.description ?? "");
  if (!description.ok) return description;

  const priority = parsePriority(body.priority ?? "medium");
  if (!priority.ok) return priority;

  return {
    ok: true,
    value: { title: title.value, description: description.value, priority: priority.value },
  };
}

export function parseTaskChanges(body: unknown): ParseResult<TaskChanges> {
  if (!isRecord(body)) return fail("Request body must be a JSON object.");

  const unknownField = findUnknownField(body, CHANGE_FIELDS);
  if (unknownField) return fail(`Unknown field "${unknownField.slice(0, 40)}".`);

  const changes: TaskChanges = {};

  if (body.title !== undefined) {
    const title = parseTitle(body.title);
    if (!title.ok) return title;
    changes.title = title.value;
  }

  if (body.description !== undefined) {
    const description = parseDescription(body.description);
    if (!description.ok) return description;
    changes.description = description.value;
  }

  if (body.priority !== undefined) {
    const priority = parsePriority(body.priority);
    if (!priority.ok) return priority;
    changes.priority = priority.value;
  }

  if (body.completed !== undefined) {
    if (typeof body.completed !== "boolean") {
      return fail("Completed must be true or false.");
    }
    changes.completed = body.completed;
  }

  if (Object.keys(changes).length === 0) return fail("Nothing to update.");

  return { ok: true, value: changes };
}
