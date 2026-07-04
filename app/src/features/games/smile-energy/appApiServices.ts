import { createGameFinishedEvent } from "./engine";
import { createMockEmotionSignalReader } from "./mockServices";
import type { EmotionSignalReader, GameEventPublisher, GameRecordWriter, SmileGameRecord, SmileGameServices } from "./types";

export function createAppApiGameRecordWriter(): GameRecordWriter {
  return {
    async write(record: SmileGameRecord) {
      await window.appApi.games.createRecord({
        gameType: record.gameType,
        result: record.result,
        score: record.score,
        duration: record.duration,
        reward: record.reward
      });
    }
  };
}

export function createAppApiGameEventPublisher(): GameEventPublisher {
  return {
    async publish(event) {
      await window.appApi.events.create(event);
    }
  };
}

export function createAppApiSmileGameServices(emotionReader: EmotionSignalReader = createMockEmotionSignalReader()): SmileGameServices {
  return {
    emotionReader,
    eventPublisher: createAppApiGameEventPublisher(),
    recordWriter: createAppApiGameRecordWriter()
  };
}

export async function persistAndPublishGameRecord(record: SmileGameRecord, services: SmileGameServices): Promise<void> {
  await services.recordWriter.write(record);
  await services.eventPublisher.publish(createGameFinishedEvent(record));
}
