// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorFallback from "./ErrorFallback";

afterEach(cleanup);

describe("ErrorFallback", () => {
  it("offers a retry and a way back home", () => {
    const onRetry = vi.fn();
    render(<ErrorFallback onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Go to tasks" }).getAttribute("href")).toBe("/");
  });

  it("shows the error reference when there is one", () => {
    render(<ErrorFallback digest="abc123" onRetry={() => {}} />);

    expect(screen.getByText("abc123")).toBeTruthy();
  });
});
