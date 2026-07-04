import type { GameRecordView } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringFrom(record: Record<string, unknown>, camelKey: string, snakeKey: string, fallback: string): string {
  const camel = record[camelKey];
  if (typeof camel === "string" && camel.length > 0) return camel;

  const snake = record[snakeKey];
  if (typeof snake === "string" && snake.length > 0) return snake;

  return fallback;
}

function numberFrom(record: Record<string, unknown>, camelKey: string, snakeKey: string, fallback: number): number {
  const camel = record[camelKey];
  if (typeof camel === "number" && Number.isFinite(camel)) return camel;

  const snake = record[snakeKey];
  if (typeof snake === "number" && Number.isFinite(snake)) return snake;

  return fallback;
}

export function normalizeGameRecord(value: unknown, index: number): GameRecordView {
  if (!isRecord(value)) {
    return {
      id: `record-${index}`,
      gameType: "smile_energy",
      result: "normal",
      score: 0,
      duration: 0,
      reward: null,
      createdAt: 0
    };
  }

  const reward = value.reward;

  return {
    id: stringFrom(value, "id", "id", `record-${index}`),
    gameType: stringFrom(value, "gameType", "game_type", "smile_energy"),
    result: stringFrom(value, "result", "result", "normal"),
    score: Math.max(0, numberFrom(value, "score", "score", 0)),
    duration: Math.max(0, numberFrom(value, "duration", "duration", 0)),
    reward: typeof reward === "string" ? reward : null,
    createdAt: numberFrom(value, "createdAt", "created_at", 0)
  };
}

