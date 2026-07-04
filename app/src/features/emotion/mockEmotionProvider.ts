import type { EmotionSignal } from "../../shared/types";
import { EMOTION_SAMPLING_INTERVAL_MS } from "./sampling";
import { normalizeEmotionSignal } from "./signal";
import type {
  EmotionProvider,
  EmotionProviderOptions,
  EmotionSamplingMode,
  EmotionSignalListener
} from "./types";

export class MockEmotionProvider implements EmotionProvider {
  private readonly listeners = new Set<EmotionSignalListener>();
  private readonly options: EmotionProviderOptions;
  private samplingMode: EmotionSamplingMode = "normal";
  private timerId: number | null = null;
  private latestSignal: EmotionSignal | null = null;
  private sampleIndex = 0;

  constructor(options: EmotionProviderOptions = {}) {
    this.options = options;
  }

  async start(): Promise<void> {
    this.options.onStatusChange?.("mock");
    this.startTimer();
    this.sample();
  }

  async stop(): Promise<void> {
    this.stopTimer();
    this.options.onStatusChange?.("stopped");
  }

  setSamplingMode(mode: EmotionSamplingMode): void {
    this.samplingMode = mode;
    if (this.timerId !== null) {
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
    this.sampleIndex += 1;
    const phase = this.sampleIndex % 12;
    const away = phase >= 9;
    const smile = phase >= 2 && phase <= 5 ? 0.72 + Math.sin(this.sampleIndex) * 0.08 : 0.18;
    const eyeClosed = phase >= 6 && phase <= 8 ? 0.58 : 0.12;
    const headDown = phase >= 6 && phase <= 8 ? 0.54 : 0.16;

    const nextSignal = normalizeEmotionSignal({
      facePresent: !away,
      smileScore: away ? 0 : smile,
      eyeClosedScore: away ? 0 : eyeClosed,
      headDownScore: away ? 0 : headDown,
      activityScore: away ? 0 : phase <= 5 ? 0.56 : 0.24,
      timestamp: Date.now()
    });

    this.latestSignal = nextSignal;
    this.listeners.forEach((listener) => listener(nextSignal));
  }
}
