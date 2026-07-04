import type { EmotionSignal } from "../../shared/types";

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function normalizeEmotionSignal(signal: EmotionSignal): EmotionSignal {
  return {
    facePresent: signal.facePresent,
    smileScore: clampScore(signal.smileScore),
    eyeClosedScore: clampScore(signal.eyeClosedScore),
    headDownScore: clampScore(signal.headDownScore),
    activityScore: clampScore(signal.activityScore),
    timestamp: Number.isFinite(signal.timestamp) ? signal.timestamp : Date.now()
  };
}

export function createNeutralSignal(facePresent: boolean, timestamp = Date.now()): EmotionSignal {
  return {
    facePresent,
    smileScore: 0,
    eyeClosedScore: 0,
    headDownScore: 0,
    activityScore: 0,
    timestamp
  };
}

export function calculateActivityScore(previous: EmotionSignal | null, next: EmotionSignal): number {
  if (!previous || !previous.facePresent || !next.facePresent) {
    return next.activityScore;
  }

  const smileDelta = Math.abs(next.smileScore - previous.smileScore);
  const eyeDelta = Math.abs(next.eyeClosedScore - previous.eyeClosedScore);
  const headDelta = Math.abs(next.headDownScore - previous.headDownScore);
  return clampScore(next.activityScore * 0.6 + (smileDelta + eyeDelta + headDelta) * 1.8);
}
