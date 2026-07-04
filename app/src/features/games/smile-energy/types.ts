import type { AppEvent, EmotionSignal, GameFinishedEvent, GameStartedEvent, UserState } from "../../../shared/types";

export type SmileGameState = "ready" | "playing" | "paused" | "success" | "finished" | "quit";

export type SmileGameResult = "success" | "normal" | "quit";

export type SmileEnergyGameType = "smile_energy";

export type SmileGameConfig = {
  targetEnergy: number;
  maxSeconds: number;
  energyMultiplier: number;
  rewardEnergy: number;
  rewardText: string;
};

export type SmileGameRecord = {
  id: string;
  gameType: SmileEnergyGameType;
  result: SmileGameResult;
  score: number;
  duration: number;
  reward: string;
  createdAt: number;
};

export type EmotionSignalReader = {
  getLatestSignal(): EmotionSignal | null;
  subscribe(listener: (signal: EmotionSignal) => void): () => void;
};

export type GameEventPublisher = {
  publish(event: GameStartedEvent | GameFinishedEvent | AppEvent): Promise<void> | void;
};

export type GameRecordWriter = {
  write(record: SmileGameRecord): Promise<void> | void;
};

export type SmileGameServices = {
  emotionReader: EmotionSignalReader;
  eventPublisher: GameEventPublisher;
  recordWriter: GameRecordWriter;
};

export type SmileEnergySnapshot = {
  state: SmileGameState;
  userState: UserState;
  energy: number;
  targetEnergy: number;
  elapsedSeconds: number;
  maxSeconds: number;
  smileScore: number;
  facePresent: boolean;
  result: SmileGameResult | null;
};
