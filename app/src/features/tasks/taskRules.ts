import type { Task, TaskInput, TaskPatch, TaskPriority, TaskStatus, TaskSummary } from "../../shared/types";

export const TASK_TITLE_MAX_LENGTH = 80;

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2
};

export type ValidationResult =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      message: string;
    };

export function normalizeTaskTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ");
}

export function validateTaskTitle(title: string): ValidationResult {
  const value = normalizeTaskTitle(title);

  if (value.length === 0) {
    return {
      ok: false,
      message: "先写一个很小的任务标题吧。"
    };
  }

  if (value.length > TASK_TITLE_MAX_LENGTH) {
    return {
      ok: false,
      message: `任务标题最多 ${TASK_TITLE_MAX_LENGTH} 个字。`
    };
  }

  return {
    ok: true,
    value
  };
}

export function validateTaskInput(input: TaskInput): TaskInput {
  const title = validateTaskTitle(input.title);

  if (!title.ok) {
    throw new Error(title.message);
  }

  return {
    ...input,
    title: title.value,
    description: input.description?.trim() ?? "",
    priority: input.priority ?? "medium",
    dueAt: input.dueAt ?? null
  };
}

export function validateTaskPatch(patch: TaskPatch): TaskPatch {
  if (patch.title === undefined) return patch;

  const title = validateTaskTitle(patch.title);

  if (!title.ok) {
    throw new Error(title.message);
  }

  return {
    ...patch,
    title: title.value
  };
}

export function getLocalDayRange(referenceTime = Date.now()): { start: number; end: number } {
  const startDate = new Date(referenceTime);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  return {
    start: startDate.getTime(),
    end: endDate.getTime()
  };
}

export function isTodayTask(task: Task, referenceTime = Date.now()): boolean {
  const range = getLocalDayRange(referenceTime);
  const taskTime = task.dueAt ?? task.createdAt;
  return taskTime >= range.start && taskTime < range.end;
}

export function isUnfinishedStatus(status: TaskStatus): boolean {
  return status === "todo" || status === "doing" || status === "delayed";
}

export function isOverdueTask(task: Task, referenceTime = Date.now()): boolean {
  return task.dueAt !== null && task.dueAt < referenceTime && isUnfinishedStatus(task.status);
}

export function summarizeTasks(tasks: readonly Task[], referenceTime = Date.now()): TaskSummary {
  const todayTasks = tasks.filter((task) => isTodayTask(task, referenceTime));

  return {
    totalToday: todayTasks.length,
    unfinished: todayTasks.filter((task) => isUnfinishedStatus(task.status)).length,
    overdue: todayTasks.filter((task) => isOverdueTask(task, referenceTime)).length,
    completedToday: todayTasks.filter((task) => task.status === "done" && task.completedAt !== null).length
  };
}

export function sortTodayTasks(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((left, right) => {
    if (left.status === "done" && right.status !== "done") return 1;
    if (left.status !== "done" && right.status === "done") return -1;

    if (left.status !== "done" && right.status !== "done") {
      const priorityDiff = PRIORITY_WEIGHT[left.priority] - PRIORITY_WEIGHT[right.priority];
      if (priorityDiff !== 0) return priorityDiff;

      const leftDue = left.dueAt ?? Number.MAX_SAFE_INTEGER;
      const rightDue = right.dueAt ?? Number.MAX_SAFE_INTEGER;
      if (leftDue !== rightDue) return leftDue - rightDue;
    }

    return right.updatedAt - left.updatedAt;
  });
}

export function splitTasks(tasks: readonly Task[]): { pending: Task[]; completed: Task[] } {
  const sortedTasks = sortTodayTasks(tasks);

  return {
    pending: sortedTasks.filter((task) => task.status !== "done"),
    completed: sortedTasks.filter((task) => task.status === "done")
  };
}

export function formatTaskTime(timestamp: number | null): string {
  if (timestamp === null) return "无截止";

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(timestamp);
}
