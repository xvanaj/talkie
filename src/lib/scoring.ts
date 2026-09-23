import type { Assessment, PronunciationService } from "./types";
export const tokenize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .match(/[a-z0-9]+(?:'[a-z]+)*/g) ?? [];
// Levenshtein alignment keeps repeated words and omissions in their actual positions.
export function compareTranscript(
  reference: string,
  transcript: string,
): Assessment {
  const a = tokenize(reference),
    b = tokenize(transcript);
  const dp = Array.from({ length: a.length + 1 }, () =>
    Array<number>(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  let i = a.length,
    j = b.length,
    matched = 0,
    spoken = 0;
  const words: Assessment["words"] = [],
    extra: string[] = [];
  while (i || j) {
    if (
      i &&
      j &&
      dp[i][j] === dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
    ) {
      const ok = a[i - 1] === b[j - 1];
      words.unshift({ text: a[i - 1], status: ok ? "matched" : "different" });
      if (ok) matched++;
      spoken++;
      i--;
      j--;
    } else if (i && dp[i][j] === dp[i - 1][j] + 1) {
      words.unshift({ text: a[i - 1], status: "missing" });
      i--;
    } else {
      extra.unshift(b[j - 1]);
      j--;
    }
  }
  const accuracy = a.length
    ? Math.round((100 * matched) / Math.max(a.length, b.length))
    : 0;
  const completion = a.length ? Math.round((100 * spoken) / a.length) : 0;
  return {
    accuracy,
    completion,
    overall: accuracy,
    fluency: null,
    words,
    extra,
    source: "transcript",
  };
}
export const browserTranscriptService: PronunciationService = {
  async assess({ reference, transcript }) {
    return compareTranscript(reference, transcript);
  },
};
