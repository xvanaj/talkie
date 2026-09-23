import { expect, it } from "vitest";
import { topics } from "./topics";
it("provides ten complete topics with unique, fully chunked dialogs", () => {
  expect(topics).toHaveLength(10);
  const ids = new Set<string>();
  for (const topic of topics) {
    expect(topic.dialogs.length).toBeGreaterThanOrEqual(5);
    for (const d of topic.dialogs) {
      expect(ids.has(d.id)).toBe(false);
      ids.add(d.id);
      expect(d.chunks.join(" ")).toBe(d.answer);
      expect(d.translation.length).toBeGreaterThan(0);
      expect(d.explanation.length).toBeGreaterThan(0);
      expect(d.alternatives.length).toBeGreaterThan(0);
    }
  }
});
