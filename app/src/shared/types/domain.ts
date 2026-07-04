export type UserState = "happy" | "calm" | "tired" | "away";

export type PetState = "idle" | "happy" | "care" | "tired" | "celebrate" | "sleep";

export type EmotionSignal = {
  facePresent: boolean;
  smileScore: number;
  eyeClosedScore: number;
  headDownScore: number;
  activityScore: number;
  timestamp: number;
};

export type TaskStatus = "todo" | "doing" | "done" | "delayed" | "abandoned";

export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: number | null;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type TaskInput = {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueAt?: number | null;
};

export type TaskPatch = Partial<Pick<Task, "title" | "description" | "status" | "priority" | "dueAt">>;

export type TaskSummary = {
  totalToday: number;
  unfinished: number;
  overdue: number;
  completedToday: number;
};

export type AppSettings = {
  cameraEnabled: boolean;
  emotionEnabled: boolean;
  reminderLevel: "quiet" | "normal" | "active";
  focusMode: boolean;
  petAlwaysOnTop: boolean;
  launchAtStartup: boolean;
  selectedPetId: string;
  themeMode: "system" | "light" | "dark";
};

export type PanelRoute = "tasks" | "chat" | "game" | "settings";

export type PetProfile = {
  id: string;
  name: string;
  affinity: number;
  energy: number;
  currentState: PetState;
};

export type ProductAction =
  | "none"
  | "pet_idle"
  | "pet_happy"
  | "pet_care"
  | "pet_sleep"
  | "invite_smile_game"
  | "remind_break"
  | "celebrate_task";

export type DecisionOutput = {
  userState: UserState;
  confidence: number;
  petState: PetState;
  action?: ProductAction;
  message?: string;
};

export type GameRecordInput = {
  gameType: "smile_energy";
  result: "success" | "normal" | "quit";
  score: number;
  duration: number;
  reward?: string;
};

