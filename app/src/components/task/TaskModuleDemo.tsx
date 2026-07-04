import { useMemo } from "react";
import { createMockTaskRepository } from "../../features/tasks";
import { TaskPanel } from "./TaskPanel";

export function TaskModuleDemo() {
  const repository = useMemo(() => createMockTaskRepository(), []);

  return <TaskPanel repository={repository} mode="mock" />;
}
