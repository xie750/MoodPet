import { useMemo, useState } from "react";
import {
  createConsoleGameEventPublisher,
  createMemoryGameRecordWriter,
  createMockEmotionSignalReader,
  type SmileGameRecord,
  type SmileGameServices
} from "../../features/games/smile-energy";
import { SmileEnergyGame } from "./SmileEnergyGame";

function createPreviewServices(): SmileGameServices {
  return {
    emotionReader: createMockEmotionSignalReader(),
    eventPublisher: createConsoleGameEventPublisher(),
    recordWriter: createMemoryGameRecordWriter()
  };
}

export function SmileEnergyGameMockPreview() {
  const services = useMemo(() => createPreviewServices(), []);
  const [lastRecord, setLastRecord] = useState<SmileGameRecord | null>(null);

  return (
    <div className="smile-game-preview">
      <SmileEnergyGame initialUserState="tired" services={services} onFinished={setLastRecord} />
      {lastRecord && (
        <aside className="smile-game-preview__record" aria-label="最近一局记录">
          <span>最近记录</span>
          <strong>
            {lastRecord.result} · {lastRecord.score}分 · {lastRecord.duration}秒
          </strong>
        </aside>
      )}
    </div>
  );
}
