import type { EmotionSignal, GameFinishedEvent, GameStartedEvent, UserState } from "../../../shared/types";
import { getSmileGameConfig, SMILE_GAME_BASE_RATE } from "./config";
import type { SmileGameRecord, SmileGameResult } from "./types";

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function normalizeEmotionSignal(signal: EmotionSignal): EmotionSignal {
  return {
    facePresent: signal.facePresent,
    smileScore: clamp01(signal.smileScore),
    eyeClosedScore: clamp01(signal.eyeClosedScore),
    headDownScore: clamp01(signal.headDownScore),
    activityScore: clamp01(signal.activityScore),
    timestamp: signal.timestamp
  };
}

export function calculateEnergyDelta(input: {
  elapsedSeconds: number;
  smileScore: number;
  userState: UserState;
  hasFreshSignal: boolean;
}): number {
  const config = getSmileGameConfig(input.userState);
  const smileFactor = input.hasFreshSignal ? 0.5 + clamp01(input.smileScore) : 0.5;
  return SMILE_GAME_BASE_RATE * smileFactor * config.energyMultiplier * input.elapsedSeconds;
}

export function createSmileGameRecord(input: {
  result: SmileGameResult;
  score: number;
  duration: number;
  reward: string;
  now?: number;
}): SmileGameRecord {
  const createdAt = input.now ?? Date.now();
  return {
    id: `smile-energy-${createdAt}-${Math.round(input.score)}`,
    gameType: "smile_energy",
    result: input.result,
    score: Math.max(0, Math.round(input.score)),
    duration: Math.max(0, Math.round(input.duration)),
    reward: input.reward,
    createdAt
  };
}

export function createGameStartedEvent(now = Date.now()): GameStartedEvent {
  return {
    type: "game_started",
    payload: {
      gameType: "smile_energy"
    },
    createdAt: now
  };
}

export function createGameFinishedEvent(record: SmileGameRecord): GameFinishedEvent {
  return {
    type: "game_finished",
    payload: {
      gameType: "smile_energy",
      result: record.result,
      score: record.score,
      duration: record.duration
    },
    createdAt: record.createdAt
  };
}

export function getSmileGameFeedback(result: SmileGameResult): string {
  if (result === "success") return "能量回来啦，谢谢你陪我充电。";
  if (result === "quit") return "没关系，想玩的时候我还在。";
  return "这样也很好，我们慢慢来。";
}
