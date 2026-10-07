// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Task } from "../types";
import TaskBoard from "./TaskBoard";

const TASKS: Task[] = [
  {
    id: "report",
    title: "Write report",
    description: "",
    priority: "high",
    completed: false,
    createdAt: "2026-01-02T00:00:00.000Z",
  },
  {
    id: "dentist",
    title: "Book dentist",
    description: "Before Friday",
    priority: "low",
    completed: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

function stubFetch(...results: Array<Response | Error>) {
  const fetchMock = vi.fn<typeof fetch>();
  for (const result of results) {
    if (result instanceof Error) fetchMock.mockRejectedValueOnce(result);
    else fetchMock.mockResolvedValueOnce(result);
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const titles = () =>
  screen.queryAllByRole("listitem").map((item) => item.querySelector("a")?.textContent);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TaskBoard", () => {
  it("shows the tasks, counts and progress", () => {
    render(<TaskBoard initialTasks={TASKS} />);

    expect(titles()).toEqual(["Write report", "Book dentist"]);
    expect(screen.getByRole("button", { name: "All 2" })).toBeTruthy();
    expect(screen.getByText("1 of 2 completed (50%)")).toBeTruthy();
  });

  it("filters the list", () => {
    render(<TaskBoard initialTasks={TASKS} />);

    fireEvent.click(screen.getByRole("button", { name: "Active 1" }));
    expect(titles()).toEqual(["Write report"]);

    fireEvent.click(screen.getByRole("button", { name: "Completed 1" }));
    expect(titles()).toEqual(["Book dentist"]);
  });

  it("adds a task and clears the form", async () => {
    const created: Task = { ...TASKS[0]!, id: "new", title: "Call mum", priority: "medium" };
    const fetchMock = stubFetch(Response.json(created, { status: 201 }));
    render(<TaskBoard initialTasks={TASKS} />);

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Call mum" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    await waitFor(() => expect(titles()[0]).toBe("Call mum"));
    expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe("");

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/tasks");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      title: "Call mum",
      description: "",
      priority: "medium",
    });
  });

  it("keeps what the user typed and shows the error if saving fails", async () => {
    stubFetch(Response.json({ error: "Title is too long." }, { status: 400 }));
    render(<TaskBoard initialTasks={TASKS} />);

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Call mum" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Title is too long.");
    expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe("Call mum");
  });

  it("marks a task as done", async () => {
    stubFetch(Response.json({ ...TASKS[0], completed: true }));
    render(<TaskBoard initialTasks={TASKS} />);

    const checkbox = screen.getByRole("checkbox", { name: 'Mark "Write report" as done' });
    fireEvent.click(checkbox);

    await waitFor(() => expect(screen.getByText("2 of 2 completed (100%)")).toBeTruthy());
  });

  it("deletes a task", async () => {
    stubFetch(new Response(null, { status: 204 }));
    render(<TaskBoard initialTasks={TASKS} />);

    fireEvent.click(screen.getByRole("button", { name: 'Delete "Write report"' }));

    await waitFor(() => expect(titles()).toEqual(["Book dentist"]));
  });

  it("explains network problems and lets the user dismiss the message", async () => {
    stubFetch(new TypeError("Failed to fetch"));
    render(<TaskBoard initialTasks={TASKS} />);

    fireEvent.click(screen.getByRole("button", { name: 'Delete "Write report"' }));

    expect((await screen.findByRole("alert")).textContent).toMatch(/Can't reach the server/);
    expect(titles()).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("reloads the list when a task was already deleted elsewhere", async () => {
    const fetchMock = stubFetch(
      Response.json({ error: "Task not found. It may have been deleted." }, { status: 404 }),
      Response.json([TASKS[1]]),
    );
    render(<TaskBoard initialTasks={TASKS} />);

    fireEvent.click(screen.getByRole("checkbox", { name: 'Mark "Write report" as done' }));

    await waitFor(() => expect(titles()).toEqual(["Book dentist"]));
    expect(screen.getByRole("alert").textContent).toContain("Task not found");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/tasks");
  });
});
