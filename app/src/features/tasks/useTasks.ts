import { useCallback, useEffect, useMemo, useState } from "react";
import type { Task, TaskPriority } from "../../shared/types";
import { createIpcTaskRepository, type TaskRepository } from "./taskRepository";
import { splitTasks, summarizeTasks, validateTaskTitle } from "./taskRules";

export type UseTasksOptions = {
  repository?: TaskRepository;
};

export function useTasks(options: UseTasksOptions = {}) {
  const repository = useMemo(() => options.repository ?? createIpcTaskRepository(), [options.repository]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftPriority, setDraftPriority] = useState<TaskPriority>("medium");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setTasks(await repository.listToday());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "任务加载失败。");
    } finally {
      setLoading(false);
    }
  }, [repository]);

  const createTask = useCallback(async () => {
    const validation = validateTaskTitle(draftTitle);

    if (!validation.ok) {
      setError(validation.message);
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      await repository.create({
        title: validation.value,
        priority: draftPriority
      });
      setDraftTitle("");
      await refresh();
      return true;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "任务创建失败。");
      return false;
    } finally {
      setSaving(false);
    }
  }, [draftPriority, draftTitle, refresh, repository]);

  const updateTaskTitle = useCallback(
    async (id: string, title: string) => {
      const validation = validateTaskTitle(title);

      if (!validation.ok) {
        setError(validation.message);
        return false;
      }

      setSaving(true);
      setError(null);

      try {
        await repository.update(id, { title: validation.value });
        await refresh();
        return true;
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "任务更新失败。");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh, repository]
  );

  const completeTask = useCallback(
    async (id: string) => {
      setCompletingTaskId(id);
      setError(null);

      try {
        await repository.complete(id);
        await refresh();
        return true;
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "任务完成状态更新失败。");
        return false;
      } finally {
        setCompletingTaskId(null);
      }
    },
    [refresh, repository]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      setDeletingTaskId(id);
      setError(null);

      try {
        await repository.delete(id);
        await refresh();
        return true;
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "任务删除失败。");
        return false;
      } finally {
        setDeletingTaskId(null);
      }
    },
    [refresh, repository]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sections = useMemo(() => splitTasks(tasks), [tasks]);
  const summary = useMemo(() => summarizeTasks(tasks), [tasks]);

  return {
    tasks,
    pendingTasks: sections.pending,
    completedTasks: sections.completed,
    summary,
    draftTitle,
    setDraftTitle,
    draftPriority,
    setDraftPriority,
    error,
    loading,
    saving,
    completingTaskId,
    deletingTaskId,
    refresh,
    createTask,
    updateTaskTitle,
    completeTask,
    deleteTask
  };
}
