import type { EmotionSignal } from "../../shared/types";
import { attachStreamToVideo, requestCameraStream, stopCameraStream } from "./camera";
import { createFaceLandmarkerAnalyzer, type FaceLandmarkerConfig, type FaceSignalAnalyzer } from "./faceLandmarker";
import { EMOTION_SAMPLING_INTERVAL_MS } from "./sampling";
import { calculateActivityScore, createNeutralSignal, normalizeEmotionSignal } from "./signal";
import type {
  EmotionProvider,
  EmotionProviderOptions,
  EmotionProviderStatus,
  EmotionSamplingMode,
  EmotionSignalListener
} from "./types";

export type BrowserEmotionProviderOptions = EmotionProviderOptions &
  FaceLandmarkerConfig & {
    videoElement: HTMLVideoElement;
  };

export class BrowserEmotionProvider implements EmotionProvider {
  private readonly videoElement: HTMLVideoElement;
  private readonly options: BrowserEmotionProviderOptions;
  private readonly listeners = new Set<EmotionSignalListener>();
  private stream: MediaStream | null = null;
  private analyzer: FaceSignalAnalyzer | null = null;
  private latestSignal: EmotionSignal | null = null;
  private samplingMode: EmotionSamplingMode = "normal";
  private timerId: number | null = null;
  private started = false;

  constructor(options: BrowserEmotionProviderOptions) {
    this.videoElement = options.videoElement;
    this.options = options;
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    this.setStatus("requesting_permission");

    try {
      this.stream = await requestCameraStream();
      this.setStatus("camera_ready");
      await attachStreamToVideo(this.videoElement, this.stream);
      this.analyzer = await createFaceLandmarkerAnalyzer(this.options);
      this.setStatus("recognizing");
      this.startTimer();
      this.sample();
    } catch (error) {
      await this.stop();
      const normalizedError = error instanceof Error ? error : new Error("情绪识别启动失败。");
      this.setStatus(resolveFailureStatus(normalizedError));
      this.options.onError?.(normalizedError);
      throw normalizedError;
    }
  }

  async stop(): Promise<void> {
    this.started = false;
    this.stopTimer();
    this.analyzer?.close();
    this.analyzer = null;
    stopCameraStream(this.stream);
    this.stream = null;
    this.videoElement.pause();
    this.videoElement.srcObject = null;
    this.setStatus("stopped");
  }

  setSamplingMode(mode: EmotionSamplingMode): void {
    this.samplingMode = mode;
    if (this.started) {
      this.startTimer();
    }
  }

  getLatestSignal(): EmotionSignal | null {
    return this.latestSignal;
  }

  subscribe(listener: EmotionSignalListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = window.setInterval(() => this.sample(), EMOTION_SAMPLING_INTERVAL_MS[this.samplingMode]);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private sample(): void {
    if (!this.started || !this.analyzer) return;

    const timestamp = Date.now();
    const videoReady = this.videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    const baseSignal = videoReady ? this.analyzer.detect(this.videoElement, timestamp) : createNeutralSignal(false, timestamp);
    const normalized = normalizeEmotionSignal({
      ...baseSignal,
      activityScore: calculateActivityScore(this.latestSignal, baseSignal)
    });

    this.latestSignal = normalized;
    this.listeners.forEach((listener) => listener(normalized));
  }

  private setStatus(status: EmotionProviderStatus): void {
    this.options.onStatusChange?.(status);
  }
}

function resolveFailureStatus(error: Error): EmotionProviderStatus {
  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return "permission_denied";
  }

  if (error.message.includes("model") || error.message.includes("mediapipe") || error.message.includes("wasm")) {
    return "model_unavailable";
  }

  return "camera_unavailable";
}
