import type { AppApi, AppEvent, IpcResult, Task, TaskInput, TaskPatch, TaskSummary } from "../../shared/types";
import { summarizeTasks, validateTaskInput, validateTaskPatch } from "./taskRules";

export type TaskRepository = {
  listToday(): Promise<Task[]>;
  create(input: TaskInput): Promise<Task>;
  update(id: string, patch: TaskPatch): Promise<Task>;
  complete(id: string): Promise<Task>;
  delete(id: string): Promise<{ id: string }>;
  getSummary(): Promise<TaskSummary>;
};

function unwrapIpcResult<T>(result: IpcResult<T>): T {
  if (result.ok) return result.data;
  throw new Error(result.error.message);
}

async function publishTaskEvent(api: AppApi, event: AppEvent): Promise<void> {
  const result = await api.events.create(event);

  if (!result.ok) {
    throw new Error(result.error.message);
  }
}

function createTaskCreatedEvent(task: Task): AppEvent {
  return {
    type: "task_created",
    payload: {
      taskId: task.id,
      title: task.title
    },
    createdAt: Date.now()
  };
}

function createTaskCompletedEvent(taskId: string, completedToday: number): AppEvent {
  return {
    type: "task_completed",
    payload: {
      taskId,
      completedToday
    },
    createdAt: Date.now()
  };
}

export function createIpcTaskRepository(api: AppApi = window.appApi): TaskRepository {
  return {
    async listToday() {
      return unwrapIpcResult(await api.tasks.listToday());
    },

    async create(input) {
      const task = unwrapIpcResult(await api.tasks.create(validateTaskInput(input)));
      await publishTaskEvent(api, createTaskCreatedEvent(task));
      return task;
    },

    async update(id, patch) {
      return unwrapIpcResult(await api.tasks.update(id, validateTaskPatch(patch)));
    },

    async complete(id) {
      const task = unwrapIpcResult(await api.tasks.complete(id));
      const tasks = unwrapIpcResult(await api.tasks.listToday());
      const summary = summarizeTasks(tasks);
      await publishTaskEvent(api, createTaskCompletedEvent(task.id, summary.completedToday));
      return task;
    },

    async delete(id) {
      return unwrapIpcResult(await api.tasks.delete(id));
    },

    async getSummary() {
      const tasks = unwrapIpcResult(await api.tasks.listToday());
      return summarizeTasks(tasks);
    }
  };
}

export type MockTaskRepositoryOptions = {
  seedTasks?: Task[];
  now?: () => number;
};

function createTaskId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneTask(task: Task): Task {
  return {
    ...task
  };
}

function findTask(tasks: readonly Task[], id: string): Task {
  const task = tasks.find((item) => item.id === id);

  if (task === undefined) {
    throw new Error("没有找到这个任务。");
  }

  return task;
}

export function createMockTaskRepository(options: MockTaskRepositoryOptions = {}): TaskRepository & {
  listEvents(): AppEvent[];
} {
  const now = options.now ?? (() => Date.now());
  const events: AppEvent[] = [];
  let tasks = options.seedTasks?.map(cloneTask) ?? createDefaultMockTasks(now());

  return {
    async listToday() {
      return tasks.map(cloneTask);
    },

    async create(input) {
      const normalizedInput = validateTaskInput(input);
      const createdAt = now();
      const task: Task = {
        id: createTaskId(),
        title: normalizedInput.title,
        description: normalizedInput.description ?? "",
        status: "todo",
        priority: normalizedInput.priority ?? "medium",
        dueAt: normalizedInput.dueAt ?? null,
        completedAt: null,
        createdAt,
        updatedAt: createdAt
      };

      tasks = [task, ...tasks];
      events.push(createTaskCreatedEvent(task));
      return cloneTask(task);
    },

    async update(id, patch) {
      const normalizedPatch = validateTaskPatch(patch);
      const updatedAt = now();
      const taskIndex = tasks.findIndex((task) => task.id === id);

      if (taskIndex < 0) {
        throw new Error("没有找到这个任务。");
      }

      const currentTask = tasks[taskIndex];
      if (currentTask === undefined) {
        throw new Error("没有找到这个任务。");
      }

      const updatedTask: Task = {
        ...currentTask,
        ...normalizedPatch,
        updatedAt
      };

      tasks = tasks.map((task, index) => (index === taskIndex ? updatedTask : task));

      return cloneTask(updatedTask);
    },

    async complete(id) {
      const completedAt = now();
      const currentTask = findTask(tasks, id);

      const completedTask: Task = {
        ...currentTask,
        status: "done",
        completedAt,
        updatedAt: completedAt
      };

      tasks = tasks.map((task) => (task.id === id ? completedTask : task));

      const summary = summarizeTasks(tasks, completedAt);
      events.push(createTaskCompletedEvent(completedTask.id, summary.completedToday));
      return cloneTask(completedTask);
    },

    async delete(id) {
      findTask(tasks, id);
      tasks = tasks.filter((task) => task.id !== id);
      return { id };
    },

    async getSummary() {
      return summarizeTasks(tasks, now());
    },

    listEvents() {
      return [...events];
    }
  };
}

export function createDefaultMockTasks(now: number): Task[] {
  const start = new Date(now);
  start.setHours(9, 0, 0, 0);

  const firstTaskTime = start.getTime();
  const secondTaskTime = firstTaskTime + 2 * 60 * 60 * 1000;
  const completedAt = firstTaskTime + 45 * 60 * 1000;

  return [
    {
      id: "mock-task-1",
      title: "整理今天最重要的一件小事",
      description: "",
      status: "todo",
      priority: "high",
      dueAt: secondTaskTime,
      completedAt: null,
      createdAt: firstTaskTime,
      updatedAt: firstTaskTime
    },
    {
      id: "mock-task-2",
      title: "读 20 分钟资料",
      description: "",
      status: "todo",
      priority: "medium",
      dueAt: null,
      completedAt: null,
      createdAt: firstTaskTime,
      updatedAt: firstTaskTime
    },
    {
      id: "mock-task-3",
      title: "回复一封邮件",
      description: "",
      status: "done",
      priority: "low",
      dueAt: null,
      completedAt,
      createdAt: firstTaskTime,
      updatedAt: completedAt
    }
  ];
}
