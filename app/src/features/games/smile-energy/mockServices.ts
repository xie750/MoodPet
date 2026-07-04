import type { EmotionSignal } from "../../../shared/types";
import { normalizeEmotionSignal } from "./engine";
import type { EmotionSignalReader, GameEventPublisher, GameRecordWriter, SmileGameRecord, SmileGameServices } from "./types";

function createMockSignal(elapsedMs: number): EmotionSignal {
  const wave = (Math.sin(elapsedMs / 1_200) + 1) / 2;
  const smileScore = 0.18 + wave * 0.68;
  return normalizeEmotionSignal({
    facePresent: true,
    smileScore,
    eyeClosedScore: 0.1,
    headDownScore: 0.12,
    activityScore: 0.35 + wave * 0.4,
    timestamp: Date.now()
  });
}

export function createMockEmotionSignalReader(): EmotionSignalReader {
  let latest: EmotionSignal | null = createMockSignal(0);
  let intervalId: number | null = null;
  const listeners = new Set<(signal: EmotionSignal) => void>();
  const startedAt = Date.now();

  function emit() {
    latest = createMockSignal(Date.now() - startedAt);
    for (const listener of listeners) {
      listener(latest);
    }
  }

  function ensureRunning() {
    if (intervalId !== null) return;
    intervalId = window.setInterval(emit, 700);
    emit();
  }

  function stopIfIdle() {
    if (listeners.size > 0 || intervalId === null) return;
    window.clearInterval(intervalId);
    intervalId = null;
  }

  return {
    getLatestSignal() {
      return latest;
    },
    subscribe(listener) {
      listeners.add(listener);
      ensureRunning();
      if (latest) listener(latest);
      return () => {
        listeners.delete(listener);
        stopIfIdle();
      };
    }
  };
}

export function createMemoryGameRecordWriter(records: SmileGameRecord[] = []): GameRecordWriter {
  return {
    write(record) {
      records.unshift(record);
    }
  };
}

export function createConsoleGameEventPublisher(): GameEventPublisher {
  return {
    publish(event) {
      console.info("[smile-energy:event]", event);
    }
  };
}

export function createMockSmileGameServices(): SmileGameServices {
  return {
    emotionReader: createMockEmotionSignalReader(),
    eventPublisher: createConsoleGameEventPublisher(),
    recordWriter: createMemoryGameRecordWriter()
  };
}
