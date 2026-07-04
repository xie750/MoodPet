import type {
  AppEvent,
  AppSettings,
  GameRecordInput,
  IpcResult,
  PetProfile,
  Task,
  TaskInput
} from "../../shared/types";
import { fail, ok } from "./result";
import type { GameRecordView, StorageIpcClient } from "./types";

const DEFAULT_SETTINGS: AppSettings = {
  cameraEnabled: false,
  emotionEnabled: false,
  reminderLevel: "normal",
  focusMode: false,
  petAlwaysOnTop: true,
  launchAtStartup: false,
  selectedPetId: "default",
  themeMode: "system"
};

const DEFAULT_PET_PROFILE: PetProfile = {
  id: "default",
  name: "Mochi",
  affinity: 8,
  energy: 64,
  currentState: "idle"
};

function now(): number {
  return Date.now();
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${prefix}-${Math.round(Math.random() * 1_000_000)}`;
}

function cloneTask(task: Task): Task {
  return { ...task };
}

export function createMockStorageIpcClient(): StorageIpcClient {
  let settings = { ...DEFAULT_SETTINGS };
  const petProfile = { ...DEFAULT_PET_PROFILE };
  const createdAt = now() - 25 * 60_000;
  const tasks: Task[] = [
    {
      id: "mock-task-1",
      title: "Review one small plan",
      description: "",
      status: "todo",
      priority: "medium",
      dueAt: null,
      completedAt: null,
      createdAt,
      updatedAt: createdAt
    },
    {
      id: "mock-task-2",
      title: "Take a 1-minute reset",
      description: "",
      status: "done",
      priority: "low",
      dueAt: null,
      completedAt: createdAt + 10 * 60_000,
      createdAt: createdAt - 10 * 60_000,
      updatedAt: createdAt + 10 * 60_000
    }
  ];
  const gameRecords: GameRecordView[] = [
    {
      id: "mock-game-1",
      gameType: "smile_energy",
      result: "normal",
      score: 72,
      duration: 45,
      reward: "gentle_energy",
      createdAt: createdAt - 60 * 60_000
    }
  ];
  const events: AppEvent[] = [
    {
      type: "settings_changed",
      payload: { reminderLevel: "normal" },
      createdAt: createdAt - 3 * 60_000
    }
  ];

  return {
    mode: "mock",
    settings: {
      async get(): Promise<IpcResult<AppSettings>> {
        return ok({ ...settings });
      },
      async update(patch: Partial<AppSettings>): Promise<IpcResult<AppSettings>> {
        settings = { ...settings, ...patch };
        events.unshift({
          type: "settings_changed",
          payload: patch,
          createdAt: now()
        });
        return ok({ ...settings });
      }
    },
    tasks: {
      async listToday(): Promise<IpcResult<Task[]>> {
        return ok(tasks.map(cloneTask));
      },
      async create(input: TaskInput): Promise<IpcResult<Task>> {
        const title = input.title.trim();
        if (title.length === 0 || title.length > 80) {
          return fail("INVALID_TASK", "Task title must be 1 to 80 characters.");
        }

        const timestamp = now();
        const task: Task = {
          id: createId("task"),
          title,
          description: input.description ?? "",
          status: "todo",
          priority: input.priority ?? "medium",
          dueAt: input.dueAt ?? null,
          completedAt: null,
          createdAt: timestamp,
          updatedAt: timestamp
        };

        tasks.unshift(task);
        events.unshift({
          type: "task_created",
          payload: { taskId: task.id, title: task.title },
          createdAt: timestamp
        });
        return ok(cloneTask(task));
      },
      async complete(id: string): Promise<IpcResult<Task>> {
        const task = tasks.find((item) => item.id === id);
        if (task === undefined) return fail("NOT_FOUND", "Task not found.");

        const timestamp = now();
        task.status = "done";
        task.completedAt = timestamp;
        task.updatedAt = timestamp;
        events.unshift({
          type: "task_completed",
          payload: { taskId: task.id, completedToday: tasks.filter((item) => item.status === "done").length },
          createdAt: timestamp
        });
        return ok(cloneTask(task));
      },
      async delete(id: string): Promise<IpcResult<{ id: string }>> {
        const index = tasks.findIndex((task) => task.id === id);
        if (index >= 0) {
          tasks.splice(index, 1);
        }
        return ok({ id });
      }
    },
    pet: {
      async getProfile(): Promise<IpcResult<PetProfile>> {
        return ok({ ...petProfile });
      }
    },
    games: {
      async createRecord(record: GameRecordInput): Promise<IpcResult<{ id: string }>> {
        const id = createId("game");
        gameRecords.unshift({
          id,
          gameType: record.gameType,
          result: record.result,
          score: Math.max(0, record.score),
          duration: Math.max(0, record.duration),
          reward: record.reward ?? null,
          createdAt: now()
        });
        return ok({ id });
      },
      async listRecent(): Promise<IpcResult<GameRecordView[]>> {
        return ok(gameRecords.map((record) => ({ ...record })));
      }
    },
    events: {
      async create(event: AppEvent): Promise<IpcResult<{ id: string }>> {
        events.unshift(event);
        return ok({ id: createId("event") });
      },
      async listRecent(): Promise<IpcResult<AppEvent[]>> {
        return ok(events.map((event) => ({ ...event })));
      }
    }
  };
}

