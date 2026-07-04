import { app } from "electron";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { INITIAL_SCHEMA_SQL } from "./schema";
import type { AppSettings, PetCommand, PetProfile, Task, TaskInput } from "../../src/shared/types";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: Task["status"];
  priority: Task["priority"];
  due_at: number | null;
  completed_at: number | null;
  created_at: number;
  updated_at: number;
};

type SettingsRow = {
  camera_enabled: number;
  emotion_enabled: number;
  reminder_level: AppSettings["reminderLevel"];
  focus_mode: number;
  pet_always_on_top: number;
  launch_at_startup: number;
  selected_pet_id: string;
  theme_mode: AppSettings["themeMode"];
};

type PetRow = {
  id: string;
  name: string;
  affinity: number;
  energy: number;
  current_state: PetProfile["currentState"];
};

export type AppDatabase = ReturnType<typeof initDatabase>;

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

const DEFAULT_PET: PetProfile = {
  id: "default",
  name: "Mochi",
  affinity: 0,
  energy: 50,
  currentState: "idle"
};

function now() {
  return Date.now();
}

function id() {
  return crypto.randomUUID();
}

function getDatabasePath() {
  const dir = app.isPackaged ? join(app.getPath("userData"), "data") : join(process.cwd(), ".local");
  mkdirSync(dir, { recursive: true });
  return join(dir, app.isPackaged ? "app.db" : "dev.db");
}

function createSqliteDatabase() {
  const Database = require("better-sqlite3") as typeof import("better-sqlite3");
  return new Database(getDatabasePath());
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    status: row.status,
    priority: row.priority,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapSettings(row: SettingsRow): AppSettings {
  return {
    cameraEnabled: row.camera_enabled === 1,
    emotionEnabled: row.emotion_enabled === 1,
    reminderLevel: row.reminder_level,
    focusMode: row.focus_mode === 1,
    petAlwaysOnTop: row.pet_always_on_top === 1,
    launchAtStartup: row.launch_at_startup === 1,
    selectedPetId: row.selected_pet_id,
    themeMode: row.theme_mode
  };
}

function mapPet(row: PetRow): PetProfile {
  return {
    id: row.id,
    name: row.name,
    affinity: row.affinity,
    energy: row.energy,
    currentState: row.current_state
  };
}

export function initDatabase() {
  let db: import("better-sqlite3").Database;
  try {
    db = createSqliteDatabase();
  } catch (error) {
    console.warn("SQLite native module unavailable, using in-memory database fallback.", error);
    return initMemoryDatabase();
  }

  db.exec(INITIAL_SCHEMA_SQL);

  const createdAt = now();
  db.prepare(
    `INSERT OR IGNORE INTO settings (
      id, camera_enabled, emotion_enabled, reminder_level, focus_mode,
      pet_always_on_top, launch_at_startup, selected_pet_id, theme_mode,
      created_at, updated_at
    ) VALUES ('default', 0, 0, 'normal', 0, 1, 0, 'default', 'system', ?, ?)`
  ).run(createdAt, createdAt);

  db.prepare(
    `INSERT OR IGNORE INTO pet_profile (
      id, name, affinity, energy, current_state, created_at, updated_at
    ) VALUES ('default', 'Mochi', 0, 50, 'idle', ?, ?)`
  ).run(createdAt, createdAt);

  return {
    getSettings(): AppSettings {
      const row = db.prepare("SELECT * FROM settings WHERE id = 'default'").get() as SettingsRow;
      return mapSettings(row);
    },

    updateSettings(patch: Partial<AppSettings>): AppSettings {
      const current = this.getSettings();
      const next = { ...current, ...patch };
      db.prepare(
        `UPDATE settings SET
          camera_enabled = ?,
          emotion_enabled = ?,
          reminder_level = ?,
          focus_mode = ?,
          pet_always_on_top = ?,
          launch_at_startup = ?,
          selected_pet_id = ?,
          theme_mode = ?,
          updated_at = ?
        WHERE id = 'default'`
      ).run(
        next.cameraEnabled ? 1 : 0,
        next.emotionEnabled ? 1 : 0,
        next.reminderLevel,
        next.focusMode ? 1 : 0,
        next.petAlwaysOnTop ? 1 : 0,
        next.launchAtStartup ? 1 : 0,
        next.selectedPetId,
        next.themeMode,
        now()
      );
      return next;
    },

    listTasks(): Task[] {
      const rows = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all() as TaskRow[];
      return rows.map(mapTask);
    },

    createTask(input: TaskInput): Task {
      const timestamp = now();
      const task: Task = {
        id: id(),
        title: input.title.trim(),
        description: input.description ?? "",
        status: "todo",
        priority: input.priority ?? "medium",
        dueAt: input.dueAt ?? null,
        completedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      db.prepare(
        `INSERT INTO tasks (
          id, title, description, status, priority, due_at,
          completed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        task.id,
        task.title,
        task.description,
        task.status,
        task.priority,
        task.dueAt,
        task.completedAt,
        task.createdAt,
        task.updatedAt
      );
      return task;
    },

    completeTask(taskId: string): Task | null {
      const timestamp = now();
      db.prepare("UPDATE tasks SET status = 'done', completed_at = ?, updated_at = ? WHERE id = ?").run(
        timestamp,
        timestamp,
        taskId
      );
      const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as TaskRow | undefined;
      return row ? mapTask(row) : null;
    },

    deleteTask(taskId: string): void {
      db.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
    },

    getPetProfile(): PetProfile {
      const row = db.prepare("SELECT * FROM pet_profile WHERE id = 'default'").get() as PetRow;
      return mapPet(row);
    },

    applyPetCommand(command: PetCommand): PetProfile {
      const pet = this.getPetProfile();
      const next = { ...pet };
      if (command.type === "set_state") {
        next.currentState = command.state;
      }
      if (command.type === "add_affinity") {
        next.affinity = Math.max(0, pet.affinity + command.amount);
      }
      if (command.type === "add_energy") {
        next.energy = Math.max(0, Math.min(100, pet.energy + command.amount));
      }
      db.prepare(
        "UPDATE pet_profile SET affinity = ?, energy = ?, current_state = ?, updated_at = ? WHERE id = 'default'"
      ).run(next.affinity, next.energy, next.currentState, now());
      return next;
    },

    createGameRecord(record: unknown): string {
      const recordId = id();
      const value = record as { gameType?: string; result?: string; score?: number; duration?: number; reward?: string };
      db.prepare(
        "INSERT INTO game_records (id, game_type, result, score, duration, reward, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(
        recordId,
        value.gameType ?? "smile_energy",
        value.result ?? "normal",
        Math.max(0, Number(value.score ?? 0)),
        Math.max(0, Number(value.duration ?? 0)),
        value.reward ?? null,
        now()
      );
      return recordId;
    },

    listGameRecords(): unknown[] {
      return db.prepare("SELECT * FROM game_records ORDER BY created_at DESC LIMIT 20").all();
    },

    createEvent(event: unknown): string {
      const eventId = id();
      const value = event as { type?: string };
      db.prepare("INSERT INTO app_events (id, event_type, payload, created_at) VALUES (?, ?, ?, ?)").run(
        eventId,
        value.type ?? "unknown",
        JSON.stringify(event),
        now()
      );
      return eventId;
    },

    listEvents(): never[] {
      return [];
    }
  };
}

function initMemoryDatabase() {
  let settings = { ...DEFAULT_SETTINGS };
  let petProfile = { ...DEFAULT_PET };
  const tasks: Task[] = [];
  const gameRecords: unknown[] = [];
  const events: unknown[] = [];

  return {
    getSettings(): AppSettings {
      return { ...settings };
    },

    updateSettings(patch: Partial<AppSettings>): AppSettings {
      settings = { ...settings, ...patch };
      return { ...settings };
    },

    listTasks(): Task[] {
      return [...tasks].sort((a, b) => b.createdAt - a.createdAt);
    },

    createTask(input: TaskInput): Task {
      const timestamp = now();
      const task: Task = {
        id: id(),
        title: input.title.trim(),
        description: input.description ?? "",
        status: "todo",
        priority: input.priority ?? "medium",
        dueAt: input.dueAt ?? null,
        completedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      tasks.unshift(task);
      return task;
    },

    completeTask(taskId: string): Task | null {
      const task = tasks.find((item) => item.id === taskId);
      if (!task) {
        return null;
      }
      task.status = "done";
      task.completedAt = now();
      task.updatedAt = task.completedAt;
      return { ...task };
    },

    deleteTask(taskId: string): void {
      const index = tasks.findIndex((task) => task.id === taskId);
      if (index >= 0) {
        tasks.splice(index, 1);
      }
    },

    getPetProfile(): PetProfile {
      return { ...petProfile };
    },

    applyPetCommand(command: PetCommand): PetProfile {
      const next = { ...petProfile };
      if (command.type === "set_state") {
        next.currentState = command.state;
      }
      if (command.type === "add_affinity") {
        next.affinity = Math.max(0, petProfile.affinity + command.amount);
      }
      if (command.type === "add_energy") {
        next.energy = Math.max(0, Math.min(100, petProfile.energy + command.amount));
      }
      petProfile = next;
      return { ...petProfile };
    },

    createGameRecord(record: unknown): string {
      const recordId = id();
      gameRecords.unshift({ id: recordId, record, createdAt: now() });
      return recordId;
    },

    listGameRecords(): unknown[] {
      return gameRecords.slice(0, 20);
    },

    createEvent(event: unknown): string {
      const eventId = id();
      events.unshift({ id: eventId, event, createdAt: now() });
      return eventId;
    },

    listEvents(): unknown[] {
      return events.slice(0, 20);
    }
  };
}
