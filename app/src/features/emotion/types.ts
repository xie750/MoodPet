import type { EmotionSignal } from "../../shared/types";

export type EmotionSamplingMode = "normal" | "game" | "low_power";

export type EmotionProviderStatus =
  | "idle"
  | "requesting_permission"
  | "camera_ready"
  | "recognizing"
  | "mock"
  | "permission_denied"
  | "camera_unavailable"
  | "model_unavailable"
  | "stopped";

export type EmotionProvider = {
  start(): Promise<void>;
  stop(): Promise<void>;
  setSamplingMode(mode: EmotionSamplingMode): void;
  getLatestSignal(): EmotionSignal | null;
  subscribe(listener: (signal: EmotionSignal) => void): () => void;
};

export type EmotionStatusListener = (status: EmotionProviderStatus) => void;

export type EmotionSignalListener = (signal: EmotionSignal) => void;

export type EmotionProviderOptions = {
  onStatusChange?: EmotionStatusListener;
  onError?: (error: Error) => void;
};
