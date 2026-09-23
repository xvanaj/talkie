import { describe, expect, it } from "vitest";
import { compareTranscript, tokenize } from "./scoring";
describe("transcript alignment", () => {
  it("ignores case and punctuation, normalizes curly apostrophes", () => {
    expect(
      compareTranscript("It’s going pretty well!", "IT'S going pretty well.")
        .overall,
    ).toBe(100);
    expect(tokenize("Hello — there!")).toEqual(["hello", "there"]);
  });
  it("identifies an omitted word without shifting the rest", () => {
    const result = compareTranscript(
      "We should meet on Friday",
      "We should meet Friday",
    );
    expect(result.words.map((w) => w.status)).toEqual([
      "matched",
      "matched",
      "matched",
      "missing",
      "matched",
    ]);
    expect(result.accuracy).toBe(80);
    expect(result.completion).toBe(80);
  });
  it("distinguishes substitutions from omissions", () => {
    const result = compareTranscript("See you on Friday", "See you on Monday");
    expect(result.words[3].status).toBe("different");
    expect(result.completion).toBe(100);
    expect(result.overall).toBe(75);
  });
  it("penalizes added words and handles repeated words", () => {
    expect(compareTranscript("very very good", "very good").overall).toBe(67);
    const result = compareTranscript("I agree", "I really agree");
    expect(result.extra).toEqual(["really"]);
    expect(result.accuracy).toBe(67);
  });
  it("does not fabricate pronunciation or fluency scores", () => {
    const result = compareTranscript("Hello there", "");
    expect(result.overall).toBe(0);
    expect(result.completion).toBe(0);
    expect(result.fluency).toBeNull();
    expect(result.source).toBe("transcript");
    expect(compareTranscript("", "").overall).toBe(0);
  });
});
