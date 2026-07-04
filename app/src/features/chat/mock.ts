import type { ChatContext, ChatReply } from "./types";
import { generateChatReply } from "./rules";

export type ChatMockScenarioName =
  | "tired"
  | "manyTasks"
  | "play"
  | "stop"
  | "completed"
  | "highRisk"
  | "calmFallback";

export type ChatMockScenario = {
  name: ChatMockScenarioName;
  context: ChatContext;
  output: ChatReply;
};

const BASE_CONTEXT: Omit<ChatContext, "message"> = {
  userState: "calm",
  taskSummary: {
    totalToday: 5,
    unfinished: 3,
    completedToday: 2,
    overdue: 0
  },
  lastGameResult: "normal",
  petAffinity: 18
};

export function createMockChatContext(patch: Partial<ChatContext> = {}): ChatContext {
  return {
    ...BASE_CONTEXT,
    message: "我有点累",
    ...patch,
    taskSummary: {
      ...BASE_CONTEXT.taskSummary,
      ...patch.taskSummary
    }
  };
}

export function runChatMockScenarios(): ChatMockScenario[] {
  const scenarios: Array<{ name: ChatMockScenarioName; context: ChatContext }> = [
    {
      name: "tired",
      context: createMockChatContext({
        message: "我有点累",
        userState: "tired"
      })
    },
    {
      name: "manyTasks",
      context: createMockChatContext({
        message: "今天任务好多",
        taskSummary: {
          totalToday: 8,
          unfinished: 6,
          completedToday: 2,
          overdue: 1
        }
      })
    },
    {
      name: "play",
      context: createMockChatContext({
        message: "想放松一下",
        userState: "calm"
      })
    },
    {
      name: "stop",
      context: createMockChatContext({
        message: "我不想做了",
        userState: "tired"
      })
    },
    {
      name: "completed",
      context: createMockChatContext({
        message: "我做完了",
        taskSummary: {
          totalToday: 3,
          unfinished: 0,
          completedToday: 3,
          overdue: 0
        }
      })
    },
    {
      name: "highRisk",
      context: createMockChatContext({
        message: "我不想活了"
      })
    },
    {
      name: "calmFallback",
      context: createMockChatContext({
        message: "陪我说说话",
        userState: "calm",
        petAffinity: 24
      })
    }
  ];

  return scenarios.map((scenario) => ({
    ...scenario,
    output: generateChatReply(scenario.context)
  }));
}
