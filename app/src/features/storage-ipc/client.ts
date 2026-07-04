import type { AppApi, IpcResult } from "../../shared/types";
import { createMockStorageIpcClient } from "./mockClient";
import { normalizeGameRecord } from "./normalizers";
import { ok } from "./result";
import type { GameRecordView, StorageIpcClient, StorageSnapshot } from "./types";

function getWindowAppApi(): AppApi | undefined {
  if (typeof window === "undefined") return undefined;

  return (window as Window & { appApi?: AppApi }).appApi;
}

export function createStorageIpcClient(appApi: AppApi): StorageIpcClient {
  return {
    mode: "ipc",
    settings: appApi.settings,
    tasks: {
      listToday: appApi.tasks.listToday,
      create: appApi.tasks.create,
      complete: appApi.tasks.complete,
      delete: appApi.tasks.delete
    },
    pet: {
      getProfile: appApi.pet.getProfile
    },
    games: {
      createRecord: appApi.games.createRecord,
      async listRecent(): Promise<IpcResult<GameRecordView[]>> {
        const result = await appApi.games.listRecent();
        if (!result.ok) return result;

        return ok(result.data.map(normalizeGameRecord));
      }
    },
    events: appApi.events
  };
}

export function createDefaultStorageIpcClient(): StorageIpcClient {
  const appApi = getWindowAppApi();
  return appApi === undefined ? createMockStorageIpcClient() : createStorageIpcClient(appApi);
}

export async function loadStorageSnapshot(client: StorageIpcClient): Promise<IpcResult<StorageSnapshot>> {
  const [settings, petProfile, tasks, gameRecords, events] = await Promise.all([
    client.settings.get(),
    client.pet.getProfile(),
    client.tasks.listToday(),
    client.games.listRecent(),
    client.events.listRecent()
  ]);

  if (!settings.ok) return settings;
  if (!petProfile.ok) return petProfile;
  if (!tasks.ok) return tasks;
  if (!gameRecords.ok) return gameRecords;
  if (!events.ok) return events;

  return ok({
    mode: client.mode,
    settings: settings.data,
    petProfile: petProfile.data,
    tasks: tasks.data,
    gameRecords: gameRecords.data,
    events: events.data,
    loadedAt: Date.now()
  });
}

