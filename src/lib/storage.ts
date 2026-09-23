import type { Progress, Settings } from "./types";
export const PROGRESS_KEY = "talkie.progress.v1";
export const SETTINGS_KEY = "talkie.settings.v1";
export const defaultSettings: Settings = {
  voice: "",
  rate: 1,
  difficulty: "B1",
};
export function parseProgress(raw: string | null): Progress {
  try {
    const value: unknown = JSON.parse(raw ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const result: Progress = {};
    for (const [key, item] of Object.entries(value)) {
      if (!item || typeof item !== "object") continue;
      const p = item as Record<string, unknown>;
      if (
        Number.isInteger(p.attempts) &&
        Number(p.attempts) > 0 &&
        typeof p.completed === "boolean" &&
        typeof p.lastActivity === "string" &&
        Number.isFinite(Date.parse(p.lastActivity)) &&
        (p.bestScore === null ||
          (typeof p.bestScore === "number" &&
            p.bestScore >= 0 &&
            p.bestScore <= 100))
      )
        result[key] = {
          attempts: Number(p.attempts),
          completed: p.completed,
          lastActivity: p.lastActivity,
          bestScore: p.bestScore,
        };
    }
    return result;
  } catch {
    return {};
  }
}
export function recordAttempt(
  progress: Progress,
  id: string,
  score: number | null,
  now = new Date().toISOString(),
): Progress {
  const previous = progress[id];
  const valid =
    score !== null && Number.isFinite(score)
      ? Math.max(0, Math.min(100, score))
      : null;
  return {
    ...progress,
    [id]: {
      attempts: (previous?.attempts ?? 0) + 1,
      bestScore:
        valid === null
          ? (previous?.bestScore ?? null)
          : Math.max(previous?.bestScore ?? 0, valid),
      completed: true,
      lastActivity: now,
    },
  };
}
export function parseSettings(raw: string | null): Settings {
  try {
    const s = JSON.parse(raw ?? "{}");
    return {
      voice: typeof s?.voice === "string" ? s.voice : "",
      rate: [0.75, 1, 1.15].includes(s?.rate) ? s.rate : 1,
      difficulty: ["A2", "B1", "B2"].includes(s?.difficulty)
        ? s.difficulty
        : "B1",
    };
  } catch {
    return defaultSettings;
  }
}
