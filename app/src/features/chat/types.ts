import type { TaskSummary, UserState } from "../../shared/types";

export type ChatRecommendedAction = "open_tasks" | "open_smile_game" | "take_break" | "none";

export type ChatContext = {
  message: string;
  userState: UserState;
  taskSummary: TaskSummary;
  lastGameResult?: "success" | "normal" | "quit";
  petAffinity: number;
};

export type ChatReply = {
  reply: string;
  recommendedAction?: ChatRecommendedAction;
  riskLevel?: "normal" | "high";
};

export type ChatMessage = {
  id: string;
  role: "user" | "companion";
  text: string;
  createdAt: number;
  recommendedAction?: ChatRecommendedAction;
  actionConfirmed?: boolean;
};
