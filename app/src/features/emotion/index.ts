export { BrowserEmotionProvider } from "./browserEmotionProvider";
export { requestCameraStream, attachStreamToVideo, stopCameraStream } from "./camera";
export { createFaceLandmarkerAnalyzer, signalFromFaceLandmarkerResult } from "./faceLandmarker";
export { MockEmotionProvider } from "./mockEmotionProvider";
export { EMOTION_SAMPLING_INTERVAL_MS } from "./sampling";
export { calculateActivityScore, clampScore, createNeutralSignal, normalizeEmotionSignal } from "./signal";
export type {
  EmotionProvider,
  EmotionProviderOptions,
  EmotionProviderStatus,
  EmotionSamplingMode,
  EmotionSignalListener,
  EmotionStatusListener
} from "./types";
