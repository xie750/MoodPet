import type { EmotionSamplingMode } from "./types";

export const EMOTION_SAMPLING_INTERVAL_MS: Record<EmotionSamplingMode, number> = {
  normal: 2_000,
  game: 750,
  low_power: 5_000
};
