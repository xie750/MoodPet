import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppEvent, AppSettings, Task } from "../../shared/types";
import {
  createDefaultStorageIpcClient,
  loadStorageSnapshot,
  type StorageIpcClient,
  type StorageSnapshot
} from "../../features/storage-ipc";
import "./StorageIpcPanel.css";

type StorageIpcPanelProps = {
  client?: StorageIpcClient;
};

type LoadStatus = "idle" | "loading" | "ready" | "error";

const REMINDER_LEVELS: AppSettings["reminderLevel"][] = ["quiet", "normal", "active"];

function formatTime(timestamp: number): string {
  if (timestamp <= 0) return "mock";

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(timestamp);
}

function countDone(tasks: readonly Task[]): number {
  return tasks.filter((task) => task.status === "done").length;
}

function eventLabel(event: AppEvent): string {
  if (event.type === "task_created") return `task_created: ${event.payload.title}`;
  if (event.type === "task_completed") return `task_completed: ${event.payload.taskId}`;
  if (event.type === "settings_changed") return "settings_changed";
  if (event.type === "game_finished") return `game_finished: ${event.payload.result}`;
  return event.type;
}

export function StorageIpcPanel({ client }: StorageIpcPanelProps) {
  const clientRef = useRef<StorageIpcClient>(client ?? createDefaultStorageIpcClient());
  const storageClient = clientRef.current;
  const [snapshot, setSnapshot] = useState<StorageSnapshot | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("Drink water, then continue");

  const taskStats = useMemo(() => {
    const tasks = snapshot?.tasks ?? [];
    return {
      total: tasks.length,
      done: countDone(tasks),
      open: tasks.filter((task) => task.status !== "done").length
    };
  }, [snapshot]);

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(null);

    const result = await loadStorageSnapshot(storageClient);
    if (!result.ok) {
      setStatus("error");
      setError(result.error.message);
      return;
    }

    setSnapshot(result.data);
    setStatus("ready");
  }, [storageClient]);

  const updateSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      const result = await storageClient.settings.update(patch);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      await refresh();
    },
    [refresh, storageClient]
  );

  const createTask = useCallback(async () => {
    if (taskTitle.trim().length === 0) return;

    const result = await storageClient.tasks.create({ title: taskTitle });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setTaskTitle("");
    await refresh();
  }, [refresh, storageClient, taskTitle]);

  const completeTask = useCallback(
    async (taskId: string) => {
      const result = await storageClient.tasks.complete(taskId);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      await refresh();
    },
    [refresh, storageClient]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const result = await storageClient.tasks.delete(taskId);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      await refresh();
    },
    [refresh, storageClient]
  );

  const createMockGameRecord = useCallback(async () => {
    const result = await storageClient.games.createRecord({
      gameType: "smile_energy",
      result: "normal",
      score: 68,
      duration: 45,
      reward: "mock_energy"
    });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    await refresh();
  }, [refresh, storageClient]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const settings = snapshot?.settings;
  const pet = snapshot?.petProfile;

  return (
    <section className="storage-ipc-panel" aria-label="Local storage and IPC">
      <div className="storage-ipc-toolbar">
        <div>
          <h1 className="storage-ipc-title">Local Storage IPC</h1>
          <div className="storage-ipc-muted">
            {snapshot === null ? "Loading storage snapshot" : `Last loaded ${formatTime(snapshot.loadedAt)}`}
          </div>
        </div>
        <div className="storage-ipc-actions">
          <span className="storage-ipc-mode">{storageClient.mode}</span>
          <button className="storage-ipc-button secondary" type="button" onClick={refresh} disabled={status === "loading"}>
            Refresh
          </button>
        </div>
      </div>

      {error !== null && <div className="storage-ipc-error">{error}</div>}

      <div className="storage-ipc-grid">
        <article className="storage-ipc-card">
          <header>
            <h2>Settings</h2>
            <span className="storage-ipc-muted">public API</span>
          </header>
          <div className="storage-ipc-card-body">
            <div className="storage-ipc-row">
              <span>Reminder</span>
              <strong>{settings?.reminderLevel ?? "..."}</strong>
            </div>
            <div className="storage-ipc-row">
              <span>Focus mode</span>
              <strong>{settings?.focusMode ? "on" : "off"}</strong>
            </div>
            <div className="storage-ipc-row">
              <span>Camera</span>
              <strong>{settings?.cameraEnabled ? "enabled" : "disabled"}</strong>
            </div>
            <div className="storage-ipc-row">
              <span>Emotion</span>
              <strong>{settings?.emotionEnabled ? "enabled" : "disabled"}</strong>
            </div>
          </div>
          <footer>
            <div className="storage-ipc-actions">
              <button
                className="storage-ipc-button secondary"
                type="button"
                onClick={() => updateSettings({ focusMode: !(settings?.focusMode ?? false) })}
              >
                Toggle focus
              </button>
              <button
                className="storage-ipc-button secondary"
                type="button"
                onClick={() => {
                  const current = settings?.reminderLevel ?? "normal";
                  const index = REMINDER_LEVELS.indexOf(current);
                  const next = REMINDER_LEVELS[(index + 1) % REMINDER_LEVELS.length] ?? "normal";
                  void updateSettings({ reminderLevel: next });
                }}
              >
                Cycle reminder
              </button>
            </div>
          </footer>
        </article>

        <article className="storage-ipc-card">
          <header>
            <h2>Pet Profile</h2>
            <span className="storage-ipc-muted">read only</span>
          </header>
          <div className="storage-ipc-card-body">
            <div className="storage-ipc-row">
              <span>Name</span>
              <strong>{pet?.name ?? "..."}</strong>
            </div>
            <div className="storage-ipc-row">
              <span>State</span>
              <strong>{pet?.currentState ?? "..."}</strong>
            </div>
            <div className="storage-ipc-row">
              <span>Affinity</span>
              <strong>{pet?.affinity ?? "..."}</strong>
            </div>
            <div className="storage-ipc-row">
              <span>Energy</span>
              <strong>{pet?.energy ?? "..."}</strong>
            </div>
          </div>
        </article>

        <article className="storage-ipc-card">
          <header>
            <h2>Tasks</h2>
            <span className="storage-ipc-muted">
              {taskStats.open} open / {taskStats.done} done
            </span>
          </header>
          <div className="storage-ipc-card-body">
            <div className="storage-ipc-task-form">
              <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} maxLength={80} />
              <button className="storage-ipc-button" type="button" onClick={createTask}>
                Add
              </button>
            </div>
            <ul className="storage-ipc-list">
              {(snapshot?.tasks ?? []).slice(0, 4).map((task) => (
                <li className="storage-ipc-list-item" key={task.id}>
                  <span>
                    <strong>{task.title}</strong>
                    <br />
                    <span className="storage-ipc-muted">{task.status}</span>
                  </span>
                  <span className="storage-ipc-actions">
                    {task.status !== "done" && (
                      <button className="storage-ipc-button secondary" type="button" onClick={() => completeTask(task.id)}>
                        Done
                      </button>
                    )}
                    <button className="storage-ipc-button secondary" type="button" onClick={() => deleteTask(task.id)}>
                      Delete
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className="storage-ipc-card">
          <header>
            <h2>Games</h2>
            <span className="storage-ipc-muted">{snapshot?.gameRecords.length ?? 0} recent</span>
          </header>
          <div className="storage-ipc-card-body">
            <ul className="storage-ipc-list">
              {(snapshot?.gameRecords ?? []).slice(0, 3).map((record) => (
                <li className="storage-ipc-list-item" key={record.id}>
                  <span>
                    <strong>{record.result}</strong>
                    <br />
                    <span className="storage-ipc-muted">
                      {record.score} pts / {record.duration}s
                    </span>
                  </span>
                  <span className="storage-ipc-muted">{formatTime(record.createdAt)}</span>
                </li>
              ))}
            </ul>
          </div>
          <footer>
            <button
              className="storage-ipc-button secondary"
              type="button"
              onClick={createMockGameRecord}
              disabled={storageClient.mode !== "mock"}
            >
              Add mock record
            </button>
          </footer>
        </article>

        <article className="storage-ipc-card">
          <header>
            <h2>Events</h2>
            <span className="storage-ipc-muted">{snapshot?.events.length ?? 0} recent</span>
          </header>
          <div className="storage-ipc-card-body">
            <ul className="storage-ipc-list">
              {(snapshot?.events ?? []).slice(0, 5).map((event) => (
                <li className="storage-ipc-list-item" key={`${event.type}-${event.createdAt}`}>
                  <span>
                    <strong>{eventLabel(event)}</strong>
                    <br />
                    <span className="storage-ipc-muted">{formatTime(event.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className="storage-ipc-card">
          <header>
            <h2>Boundary Check</h2>
            <span className="storage-ipc-muted">renderer safe</span>
          </header>
          <div className="storage-ipc-card-body">
            <div className="storage-ipc-row">
              <span>SQLite access</span>
              <strong>no</strong>
            </div>
            <div className="storage-ipc-row">
              <span>Dynamic channel</span>
              <strong>no</strong>
            </div>
            <div className="storage-ipc-row">
              <span>Pet command writes</span>
              <strong>no</strong>
            </div>
            <div className="storage-ipc-row">
              <span>Mock standalone</span>
              <strong>yes</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

