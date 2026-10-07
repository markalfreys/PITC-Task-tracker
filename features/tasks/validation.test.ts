import { describe, expect, it } from "vitest";
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from "./constants";
import { isValidTaskId, parseNewTask, parseTaskChanges } from "./validation";

describe("parseNewTask", () => {
  it("accepts a valid task and trims the text", () => {
    expect(
      parseNewTask({ title: "  Buy milk  ", description: " 2 litres ", priority: "high" }),
    ).toEqual({
      ok: true,
      value: { title: "Buy milk", description: "2 litres", priority: "high" },
    });
  });

  it("fills in defaults for the optional fields", () => {
    expect(parseNewTask({ title: "Buy milk" })).toEqual({
      ok: true,
      value: { title: "Buy milk", description: "", priority: "medium" },
    });
  });

  it.each([
    ["a missing title", {}],
    ["a blank title", { title: "   " }],
    ["a title that isn't text", { title: 42 }],
  ])("rejects %s", (_label, body) => {
    expect(parseNewTask(body)).toEqual({ ok: false, error: "Title is required." });
  });

  it("rejects text that is too long", () => {
    expect(parseNewTask({ title: "x".repeat(TITLE_MAX_LENGTH + 1) }).ok).toBe(false);
    expect(
      parseNewTask({ title: "ok", description: "x".repeat(DESCRIPTION_MAX_LENGTH + 1) }).ok,
    ).toBe(false);
  });

  it("accepts text exactly at the length limit", () => {
    expect(parseNewTask({ title: "x".repeat(TITLE_MAX_LENGTH) }).ok).toBe(true);
  });

  it("rejects an unknown priority", () => {
    expect(parseNewTask({ title: "ok", priority: "urgent" })).toEqual({
      ok: false,
      error: "Priority must be one of: low, medium, high.",
    });
  });

  it("rejects fields the client may not set", () => {
    expect(parseNewTask({ title: "Hack", id: "admin", completed: true })).toEqual({
      ok: false,
      error: 'Unknown field "id".',
    });
  });

  it("rejects bodies that aren't JSON objects", () => {
    for (const body of [null, undefined, "text", 5, ["title"]]) {
      expect(parseNewTask(body).ok).toBe(false);
    }
  });

  it("removes control characters but keeps line breaks in descriptions", () => {
    expect(
      parseNewTask({ title: "Bad\u0000 title\u001b", description: "line 1\r\nline 2\u0007" }),
    ).toEqual({
      ok: true,
      value: { title: "Bad title", description: "line 1\nline 2", priority: "medium" },
    });
  });

  it("treats a title made only of control characters as blank", () => {
    expect(parseNewTask({ title: "\u0000\u0001" })).toEqual({
      ok: false,
      error: "Title is required.",
    });
  });
});

describe("parseTaskChanges", () => {
  it("accepts a partial update", () => {
    expect(parseTaskChanges({ completed: true })).toEqual({
      ok: true,
      value: { completed: true },
    });
  });

  it("checks every field it is given", () => {
    expect(parseTaskChanges({ title: "  New  ", priority: "low" })).toEqual({
      ok: true,
      value: { title: "New", priority: "low" },
    });
    expect(parseTaskChanges({ title: "" }).ok).toBe(false);
    expect(parseTaskChanges({ priority: "urgent" }).ok).toBe(false);
  });

  it("rejects an empty update", () => {
    expect(parseTaskChanges({})).toEqual({ ok: false, error: "Nothing to update." });
  });

  it("rejects a completed value that isn't true or false", () => {
    expect(parseTaskChanges({ completed: "yes" })).toEqual({
      ok: false,
      error: "Completed must be true or false.",
    });
  });

  it("rejects server-controlled fields", () => {
    expect(parseTaskChanges({ createdAt: "2000-01-01" }).ok).toBe(false);
    expect(parseTaskChanges({ id: "other" }).ok).toBe(false);
  });
});

describe("isValidTaskId", () => {
  it.each(["welcome", "first-task", "0b6f5c1e-6a4c-4c1e-9e43-6f2b8f1d2c3a"])(
    "accepts %s",
    (id) => {
      expect(isValidTaskId(id)).toBe(true);
    },
  );

  it.each(["", "../secrets", "a b", "<script>", "x".repeat(65)])("rejects %j", (id) => {
    expect(isValidTaskId(id)).toBe(false);
  });

  it("rejects values that aren't text", () => {
    expect(isValidTaskId(42)).toBe(false);
    expect(isValidTaskId(undefined)).toBe(false);
  });
});
