import { contextBridge, ipcRenderer } from "electron";
import type {
  AppEvent,
  AppSettings,
  GameRecordInput,
  IpcResult,
  NavigationCommand,
  PetCommand,
  PetProfile,
  Task,
  TaskInput,
  TaskPatch
} from "../src/shared/types";
import { IPC_CHANNELS } from "./ipc/channels";

const appApi = {
  settings: {
    get: (): Promise<IpcResult<AppSettings>> => ipcRenderer.invoke(IPC_CHANNELS.settings.get),
    update: (patch: Partial<AppSettings>): Promise<IpcResult<AppSettings>> =>
      ipcRenderer.invoke(IPC_CHANNELS.settings.update, patch)
  },
  tasks: {
    listToday: (): Promise<IpcResult<Task[]>> => ipcRenderer.invoke(IPC_CHANNELS.tasks.listToday),
    create: (input: TaskInput): Promise<IpcResult<Task>> =>
      ipcRenderer.invoke(IPC_CHANNELS.tasks.create, input),
    update: (id: string, patch: TaskPatch): Promise<IpcResult<Task>> =>
      ipcRenderer.invoke(IPC_CHANNELS.tasks.update, id, patch),
    complete: (id: string): Promise<IpcResult<Task>> =>
      ipcRenderer.invoke(IPC_CHANNELS.tasks.complete, id),
    delete: (id: string): Promise<IpcResult<{ id: string }>> =>
      ipcRenderer.invoke(IPC_CHANNELS.tasks.delete, id)
  },
  pet: {
    getProfile: (): Promise<IpcResult<PetProfile>> => ipcRenderer.invoke(IPC_CHANNELS.pet.getProfile),
    applyCommand: (command: PetCommand): Promise<IpcResult<PetProfile>> =>
      ipcRenderer.invoke(IPC_CHANNELS.pet.applyCommand, command)
  },
  games: {
    createRecord: (record: GameRecordInput): Promise<IpcResult<{ id: string }>> =>
      ipcRenderer.invoke(IPC_CHANNELS.games.createRecord, record),
    listRecent: (): Promise<IpcResult<unknown[]>> => ipcRenderer.invoke(IPC_CHANNELS.games.listRecent)
  },
  events: {
    create: (event: AppEvent): Promise<IpcResult<{ id: string }>> =>
      ipcRenderer.invoke(IPC_CHANNELS.events.create, event),
    listRecent: (): Promise<IpcResult<AppEvent[]>> => ipcRenderer.invoke(IPC_CHANNELS.events.listRecent)
  },
  windows: {
    openPanel: (command: NavigationCommand): Promise<IpcResult<true>> =>
      ipcRenderer.invoke(IPC_CHANNELS.windows.openPanel, command),
    setPetAlwaysOnTop: (enabled: boolean): Promise<IpcResult<true>> =>
      ipcRenderer.invoke(IPC_CHANNELS.windows.setPetAlwaysOnTop, enabled)
  }
};

contextBridge.exposeInMainWorld("appApi", appApi);
