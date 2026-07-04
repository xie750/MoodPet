const { app, BrowserWindow, ipcMain } = require("electron");
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

let db;

function now() {
  return Date.now();
}

function createId() {
  return crypto.randomUUID();
}

function initDb() {
  const dir = path.join(__dirname, ".local");
  fs.mkdirSync(dir, { recursive: true });
  db = new Database(path.join(dir, "dev.db"));
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'todo',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      completed_at INTEGER
    );
  `);
}

function mapTask(row) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at
  };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 760,
    height: 560,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.loadFile("renderer.html");
}

function ok(data) {
  return { ok: true, data };
}

function fail(code, message) {
  return { ok: false, error: { code, message } };
}

ipcMain.handle("tasks:listToday", () => {
  const rows = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();
  return ok(rows.map(mapTask));
});

ipcMain.handle("tasks:create", (_event, input) => {
  const title = String(input?.title ?? "").trim();
  if (!title || title.length > 80) {
    return fail("INVALID_TITLE", "Title must be 1 to 80 characters.");
  }

  const task = {
    id: createId(),
    title,
    createdAt: now(),
    updatedAt: now()
  };

  db.prepare(
    "INSERT INTO tasks (id, title, status, created_at, updated_at) VALUES (?, ?, 'todo', ?, ?)"
  ).run(task.id, task.title, task.createdAt, task.updatedAt);

  return ok({ ...task, status: "todo", completedAt: null });
});

ipcMain.handle("tasks:complete", (_event, taskId) => {
  if (typeof taskId !== "string") {
    return fail("INVALID_ID", "Task id is required.");
  }

  const completedAt = now();
  const result = db
    .prepare("UPDATE tasks SET status = 'done', completed_at = ?, updated_at = ? WHERE id = ?")
    .run(completedAt, completedAt, taskId);

  if (result.changes === 0) {
    return fail("NOT_FOUND", "Task not found.");
  }

  return ok({ id: taskId, completedAt });
});

app.whenReady().then(() => {
  initDb();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

