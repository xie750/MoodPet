import { ipcMain } from "electron";
import type { AppDatabase } from "../db/database";
import { IPC_CHANNELS } from "./channels";
import { openPanel, setPetAlwaysOnTop } from "../windows/window-manager";
import type { AppSettings, IpcResult, PanelRoute, PetCommand, TaskInput } from "../../src/shared/types";

function ok<T>(data: T): IpcResult<T> {
  return { ok: true, data };
}

function fail(code: string, message: string): IpcResult<never> {
  return { ok: false, error: { code, message } };
}

function isPanelRoute(value: unknown): value is PanelRoute {
  return value === "tasks" || value === "chat" || value === "game" || value === "settings";
}

function isTaskInput(value: unknown): value is TaskInput {
  const input = value as TaskInput;
  return typeof input?.title === "string" && input.title.trim().length > 0 && input.title.length <= 80;
}

function isPetCommand(value: unknown): value is PetCommand {
  const command = value as PetCommand;
  return (
    command?.type === "set_state" ||
    command?.type === "show_bubble" ||
    command?.type === "add_affinity" ||
    command?.type === "add_energy"
  );
}

export function registerIpcHandlers(database: AppDatabase) {
  ipcMain.handle(IPC_CHANNELS.settings.get, () => ok(database.getSettings()));

  ipcMain.handle(IPC_CHANNELS.settings.update, (_event, patch: Partial<AppSettings>) => {
    return ok(database.updateSettings(patch));
  });

  ipcMain.handle(IPC_CHANNELS.tasks.listToday, () => ok(database.listTasks()));

  ipcMain.handle(IPC_CHANNELS.tasks.create, (_event, input: unknown) => {
    if (!isTaskInput(input)) {
      return fail("INVALID_TASK", "Task title must be 1 to 80 characters.");
    }
    return ok(database.createTask(input));
  });

  ipcMain.handle(IPC_CHANNELS.tasks.update, (_event, id: unknown) => {
    if (typeof id !== "string") {
      return fail("INVALID_ID", "Task id is required.");
    }
    return fail("NOT_IMPLEMENTED", "Task update will be implemented in the task module.");
  });

  ipcMain.handle(IPC_CHANNELS.tasks.complete, (_event, id: unknown) => {
    if (typeof id !== "string") {
      return fail("INVALID_ID", "Task id is required.");
    }
    const task = database.completeTask(id);
    return task ? ok(task) : fail("NOT_FOUND", "Task not found.");
  });

  ipcMain.handle(IPC_CHANNELS.tasks.delete, (_event, id: unknown) => {
    if (typeof id !== "string") {
      return fail("INVALID_ID", "Task id is required.");
    }
    database.deleteTask(id);
    return ok({ id });
  });

  ipcMain.handle(IPC_CHANNELS.pet.getProfile, () => ok(database.getPetProfile()));

  ipcMain.handle(IPC_CHANNELS.pet.applyCommand, (_event, command: unknown) => {
    if (!isPetCommand(command)) {
      return fail("INVALID_COMMAND", "Pet command is invalid.");
    }
    return ok(database.applyPetCommand(command));
  });

  ipcMain.handle(IPC_CHANNELS.games.createRecord, (_event, record: unknown) => {
    const id = database.createGameRecord(record);
    return ok({ id });
  });

  ipcMain.handle(IPC_CHANNELS.games.listRecent, () => ok(database.listGameRecords()));

  ipcMain.handle(IPC_CHANNELS.events.create, (_event, event: unknown) => {
    const id = database.createEvent(event);
    return ok({ id });
  });

  ipcMain.handle(IPC_CHANNELS.events.listRecent, () => ok(database.listEvents()));

  ipcMain.handle(IPC_CHANNELS.windows.openPanel, (_event, command: unknown) => {
    const route = (command as { route?: unknown })?.route;
    if (!isPanelRoute(route)) {
      return fail("INVALID_ROUTE", "Panel route is invalid.");
    }
    openPanel(route);
    return ok(true);
  });

  ipcMain.handle(IPC_CHANNELS.windows.setPetAlwaysOnTop, (_event, enabled: unknown) => {
    if (typeof enabled !== "boolean") {
      return fail("INVALID_VALUE", "Expected boolean.");
    }
    setPetAlwaysOnTop(enabled);
    return ok(true);
  });
}
