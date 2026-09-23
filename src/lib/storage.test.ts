import { describe, expect, it } from "vitest";
import { parseProgress, parseSettings, recordAttempt } from "./storage";
describe("local progress", () => {
  it("tracks attempts, activity, and highest score without mutating input", () => {
    const initial = {};
    const first = recordAttempt(initial, "test", 80, "2026-09-23T10:00:00Z");
    const second = recordAttempt(first, "test", 40, "2026-09-23T11:00:00Z");
    expect(initial).toEqual({});
    expect(first.test.attempts).toBe(1);
    expect(second.test).toEqual({
      attempts: 2,
      bestScore: 80,
      completed: true,
      lastActivity: "2026-09-23T11:00:00Z",
    });
    expect(parseProgress(JSON.stringify(second))).toEqual(second);
  });
  it("records unscored practice without inventing a score or losing a previous best", () => {
    const first = recordAttempt({}, "test", null);
    expect(first.test.bestScore).toBeNull();
    const scored = recordAttempt(first, "test", 95);
    expect(recordAttempt(scored, "test", null).test.bestScore).toBe(95);
  });
  it("recovers from malformed and invalid storage", () => {
    for (const raw of ["not json", "null", "[]", '{"x":{"attempts":-1}}'])
      expect(parseProgress(raw)).toEqual({});
    expect(parseSettings("{broken")).toEqual({
      voice: "",
      rate: 1,
      difficulty: "B1",
    });
    expect(parseSettings('{"rate":900,"difficulty":"X"}').rate).toBe(1);
  });
  it("rejects nonfinite scores and bounds supplied scores", () => {
    expect(recordAttempt({}, "test", NaN).test.bestScore).toBeNull();
    expect(recordAttempt({}, "test", 110).test.bestScore).toBe(100);
  });
});
