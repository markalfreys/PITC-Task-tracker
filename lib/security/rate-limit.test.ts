import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

function setup(options: { limit: number; windowMs: number; maxKeys?: number }) {
  let time = 0;
  const limiter = createRateLimiter({ ...options, now: () => time });
  return { limiter, advance: (ms: number) => (time += ms) };
}

describe("createRateLimiter", () => {
  it("allows requests up to the limit, then blocks", () => {
    const { limiter } = setup({ limit: 2, windowMs: 1000 });

    expect(limiter.check("a")).toMatchObject({ allowed: true, remaining: 1 });
    expect(limiter.check("a")).toMatchObject({ allowed: true, remaining: 0 });
    expect(limiter.check("a")).toMatchObject({ allowed: false, remaining: 0 });
  });

  it("says how long to wait", () => {
    const { limiter, advance } = setup({ limit: 1, windowMs: 60_000 });
    limiter.check("a");
    advance(15_000);

    expect(limiter.check("a").retryAfterSeconds).toBe(45);
  });

  it("starts a fresh window once the old one ends", () => {
    const { limiter, advance } = setup({ limit: 1, windowMs: 1000 });
    limiter.check("a");
    expect(limiter.check("a").allowed).toBe(false);

    advance(1000);

    expect(limiter.check("a").allowed).toBe(true);
  });

  it("counts each client separately", () => {
    const { limiter } = setup({ limit: 1, windowMs: 1000 });
    limiter.check("a");

    expect(limiter.check("a").allowed).toBe(false);
    expect(limiter.check("b").allowed).toBe(true);
  });

  it("keeps memory bounded when there are many clients", () => {
    const { limiter } = setup({ limit: 1, windowMs: 1000, maxKeys: 2 });
    limiter.check("a");
    limiter.check("b");
    limiter.check("c");

    expect(limiter.check("a").allowed).toBe(true);
  });
});
