import type { AppApi, AppEvent, AppSettings, GameRecordInput, IpcResult, PetProfile, Task } from "../../shared/types";

export type StorageIpcMode = "ipc" | "mock";

export type GameRecordView = {
  id: string;
  gameType: string;
  result: string;
  score: number;
  duration: number;
  reward: string | null;
  createdAt: number;
};

export type StorageSnapshot = {
  mode: StorageIpcMode;
  settings: AppSettings;
  petProfile: PetProfile;
  tasks: Task[];
  gameRecords: GameRecordView[];
  events: AppEvent[];
  loadedAt: number;
};

export type StorageIpcClient = {
  mode: StorageIpcMode;
  settings: Pick<AppApi["settings"], "get" | "update">;
  tasks: Pick<AppApi["tasks"], "listToday" | "create" | "complete" | "delete">;
  pet: Pick<AppApi["pet"], "getProfile">;
  games: {
    createRecord(record: GameRecordInput): Promise<IpcResult<{ id: string }>>;
    listRecent(): Promise<IpcResult<GameRecordView[]>>;
  };
  events: Pick<AppApi["events"], "create" | "listRecent">;
};

