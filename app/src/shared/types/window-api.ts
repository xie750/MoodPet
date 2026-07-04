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
} from ".";

export type AppApi = {
  settings: {
    get(): Promise<IpcResult<AppSettings>>;
    update(patch: Partial<AppSettings>): Promise<IpcResult<AppSettings>>;
  };
  tasks: {
    listToday(): Promise<IpcResult<Task[]>>;
    create(input: TaskInput): Promise<IpcResult<Task>>;
    update(id: string, patch: TaskPatch): Promise<IpcResult<Task>>;
    complete(id: string): Promise<IpcResult<Task>>;
    delete(id: string): Promise<IpcResult<{ id: string }>>;
  };
  pet: {
    getProfile(): Promise<IpcResult<PetProfile>>;
    applyCommand(command: PetCommand): Promise<IpcResult<PetProfile>>;
  };
  games: {
    createRecord(record: GameRecordInput): Promise<IpcResult<{ id: string }>>;
    listRecent(): Promise<IpcResult<unknown[]>>;
  };
  events: {
    create(event: AppEvent): Promise<IpcResult<{ id: string }>>;
    listRecent(): Promise<IpcResult<AppEvent[]>>;
  };
  windows: {
    openPanel(command: NavigationCommand): Promise<IpcResult<true>>;
    setPetAlwaysOnTop(enabled: boolean): Promise<IpcResult<true>>;
  };
};

