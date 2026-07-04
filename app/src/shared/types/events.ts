import type { AppSettings, EmotionSignal, UserState } from "./domain";

export type EmotionSignalEvent = {
  type: "emotion_signal";
  payload: EmotionSignal;
  createdAt: number;
};

export type UserStateChangedEvent = {
  type: "user_state_changed";
  payload: {
    userState: UserState;
    confidence: number;
    duration: number;
  };
  createdAt: number;
};

export type TaskCreatedEvent = {
  type: "task_created";
  payload: {
    taskId: string;
    title: string;
  };
  createdAt: number;
};

export type TaskCompletedEvent = {
  type: "task_completed";
  payload: {
    taskId: string;
    completedToday: number;
  };
  createdAt: number;
};

export type GameStartedEvent = {
  type: "game_started";
  payload: {
    gameType: "smile_energy";
  };
  createdAt: number;
};

export type GameFinishedEvent = {
  type: "game_finished";
  payload: {
    gameType: "smile_energy";
    result: "success" | "normal" | "quit";
    score: number;
    duration: number;
  };
  createdAt: number;
};

export type ChatRecommendedActionEvent = {
  type: "chat_recommended_action";
  payload: {
    action: "open_tasks" | "open_smile_game" | "take_break" | "none";
    userConfirmed: boolean;
  };
  createdAt: number;
};

export type SettingsChangedEvent = {
  type: "settings_changed";
  payload: Partial<AppSettings>;
  createdAt: number;
};

export type AppEvent =
  | EmotionSignalEvent
  | UserStateChangedEvent
  | TaskCreatedEvent
  | TaskCompletedEvent
  | GameStartedEvent
  | GameFinishedEvent
  | ChatRecommendedActionEvent
  | SettingsChangedEvent;

