export type Level = "A2" | "B1" | "B2";
export interface Dialog {
  id: string;
  question: string;
  translation: string;
  answer: string;
  alternatives: string[];
  explanation: string;
  chunks: string[];
}
export interface Topic {
  id: string;
  title: string;
  description: string;
  level: Level;
  icon: string;
  color: string;
  dialogs: Dialog[];
}
export interface Settings {
  voice: string;
  rate: number;
  difficulty: Level;
}
export interface Attempt {
  attempts: number;
  bestScore: number | null;
  completed: boolean;
  lastActivity: string;
}
export type Progress = Record<string, Attempt>;
export interface Assessment {
  accuracy: number;
  completion: number;
  overall: number;
  fluency: number | null;
  words: { text: string; status: "matched" | "missing" | "different" }[];
  extra: string[];
  source: "transcript" | "pronunciation";
}
export interface PronunciationService {
  assess(input: {
    reference: string;
    transcript: string;
    audio?: Blob;
  }): Promise<Assessment>;
}
