import { FormEvent, useMemo, useState } from "react";
import type { Task, TaskPriority } from "../../shared/types";
import { createMockTaskRepository, type TaskRepository, useTasks } from "../../features/tasks";
import { formatTaskTime } from "../../features/tasks/taskRules";
import "./TaskPanel.css";

type TaskPanelProps = {
  className?: string;
  repository?: TaskRepository;
  mode?: "ipc" | "mock";
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "低优先级",
  medium: "中优先级",
  high: "高优先级"
};

export function TaskPanel({ className = "", repository, mode = "ipc" }: TaskPanelProps) {
  const mockRepository = useMemo(() => createMockTaskRepository(), []);
  const tasks = useTasks({
    repository: repository ?? (mode === "mock" ? mockRepository : undefined)
  });
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (await tasks.createTask()) {
      setToast("好，我们一起慢慢来。");
    }
  }

  async function handleComplete(task: Task) {
    if (await tasks.completeTask(task.id)) {
      setToast(`完成一个啦，真不错。`);
    }
  }

  async function confirmDelete() {
    if (taskToDelete === null) return;

    const deletedTitle = taskToDelete.title;

    if (await tasks.deleteTask(taskToDelete.id)) {
      setTaskToDelete(null);
      setToast(`已删除“${deletedTitle}”。`);
    }
  }

  const totalLabel =
    tasks.summary.totalToday === 0
      ? "今天还没有任务"
      : `${tasks.summary.completedToday} / ${tasks.summary.totalToday} 已完成`;

  return (
    <section className={`task-panel ${className}`} aria-labelledby="task-panel-title">
      <header className="task-panel__header">
        <div>
          <h1 id="task-panel-title">今日任务</h1>
          <p>{totalLabel}</p>
        </div>
        <div className="task-panel__summary" aria-label="今日任务摘要">
          <span>{tasks.summary.unfinished} 未完成</span>
          <span>{tasks.summary.completedToday} 已完成</span>
        </div>
      </header>

      <form className="task-panel__composer" onSubmit={handleSubmit}>
        <label htmlFor="new-task-title">添加一个今天的小任务</label>
        <div className="task-panel__composer-row">
          <input
            id="new-task-title"
            maxLength={80}
            value={tasks.draftTitle}
            onChange={(event) => tasks.setDraftTitle(event.target.value)}
            placeholder="例如：完成一段代码"
          />
          <select
            aria-label="任务优先级"
            value={tasks.draftPriority}
            onChange={(event) => tasks.setDraftPriority(event.target.value as TaskPriority)}
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
          <button type="submit" disabled={tasks.saving}>
            新建
          </button>
        </div>
      </form>

      {tasks.error !== null && (
        <p className="task-panel__error" role="alert">
          {tasks.error}
        </p>
      )}

      {tasks.loading ? (
        <div className="task-panel__empty" aria-live="polite">
          正在整理今天的任务...
        </div>
      ) : (
        <>
          <TaskSection
            title="未完成"
            emptyText="今天还没有待办。可以先放一个很小的开始。"
            tasks={tasks.pendingTasks}
            completingTaskId={tasks.completingTaskId}
            deletingTaskId={tasks.deletingTaskId}
            onComplete={handleComplete}
            onDelete={setTaskToDelete}
            onUpdateTitle={tasks.updateTaskTitle}
          />

          <TaskSection
            title="已完成"
            emptyText="完成后会安静地放在这里。"
            tasks={tasks.completedTasks}
            completingTaskId={tasks.completingTaskId}
            deletingTaskId={tasks.deletingTaskId}
            onComplete={handleComplete}
            onDelete={setTaskToDelete}
            onUpdateTitle={tasks.updateTaskTitle}
          />
        </>
      )}

      {taskToDelete !== null && (
        <div className="task-panel__dialog-backdrop" role="presentation">
          <div
            aria-describedby="delete-task-description"
            aria-labelledby="delete-task-title"
            className="task-panel__dialog"
            role="dialog"
            aria-modal="true"
          >
            <h2 id="delete-task-title">确定删除这个任务吗？</h2>
            <p id="delete-task-description">删除后不会影响宠物亲密度，也不会触发负面反馈。</p>
            <div className="task-panel__dialog-actions">
              <button type="button" className="task-panel__ghost-button" onClick={() => setTaskToDelete(null)}>
                取消
              </button>
              <button type="button" className="task-panel__danger-button" onClick={confirmDelete}>
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {toast !== null && (
        <div className="task-panel__toast" role="status">
          <span>{toast}</span>
          <button type="button" aria-label="关闭提示" onClick={() => setToast(null)}>
            关闭
          </button>
        </div>
      )}
    </section>
  );
}

type TaskSectionProps = {
  title: string;
  emptyText: string;
  tasks: Task[];
  completingTaskId: string | null;
  deletingTaskId: string | null;
  onComplete(task: Task): Promise<void>;
  onDelete(task: Task): void;
  onUpdateTitle(id: string, title: string): Promise<boolean>;
};

function TaskSection({
  title,
  emptyText,
  tasks,
  completingTaskId,
  deletingTaskId,
  onComplete,
  onDelete,
  onUpdateTitle
}: TaskSectionProps) {
  return (
    <section className="task-panel__section" aria-labelledby={`task-section-${title}`}>
      <h2 id={`task-section-${title}`}>{title}</h2>
      {tasks.length === 0 ? (
        <p className="task-panel__empty">{emptyText}</p>
      ) : (
        <ul className="task-panel__list">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              completing={completingTaskId === task.id}
              deleting={deletingTaskId === task.id}
              onComplete={onComplete}
              onDelete={onDelete}
              onUpdateTitle={onUpdateTitle}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

type TaskRowProps = {
  task: Task;
  completing: boolean;
  deleting: boolean;
  onComplete(task: Task): Promise<void>;
  onDelete(task: Task): void;
  onUpdateTitle(id: string, title: string): Promise<boolean>;
};

function TaskRow({ task, completing, deleting, onComplete, onDelete, onUpdateTitle }: TaskRowProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);

  async function saveTitle() {
    if (await onUpdateTitle(task.id, title)) {
      setEditing(false);
    }
  }

  return (
    <li className={`task-panel__item task-panel__item--${task.status}`}>
      <button
        type="button"
        className="task-panel__complete-button"
        aria-label={task.status === "done" ? `已完成：${task.title}` : `标记完成：${task.title}`}
        disabled={task.status === "done" || completing}
        onClick={() => void onComplete(task)}
      >
        <span aria-hidden="true">{task.status === "done" ? "✓" : ""}</span>
      </button>

      <div className="task-panel__item-body">
        {editing ? (
          <input
            aria-label="编辑任务标题"
            value={title}
            maxLength={80}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void saveTitle();
              if (event.key === "Escape") {
                setTitle(task.title);
                setEditing(false);
              }
            }}
          />
        ) : (
          <span className="task-panel__item-title">{task.title}</span>
        )}
        <span className="task-panel__meta">
          {formatTaskTime(task.dueAt)} · {PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      <div className="task-panel__item-actions">
        {editing ? (
          <>
            <button type="button" className="task-panel__ghost-button" onClick={() => setEditing(false)}>
              取消
            </button>
            <button type="button" onClick={() => void saveTitle()}>
              保存
            </button>
          </>
        ) : (
          <>
            {task.status !== "done" && (
              <button type="button" className="task-panel__ghost-button" onClick={() => setEditing(true)}>
                编辑
              </button>
            )}
            <button
              type="button"
              className="task-panel__danger-button"
              disabled={deleting}
              onClick={() => onDelete(task)}
            >
              删除
            </button>
          </>
        )}
      </div>
    </li>
  );
}
