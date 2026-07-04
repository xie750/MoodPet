import type {
  AppSettings,
  DecisionOutput as SharedDecisionOutput,
  EmotionSignal,
  NavigationCommand,
  PetCommand,
  PetState,
  ProductAction,
  TaskSummary,
  UserState
} from "../../shared/types";

export type DecisionSettings = Pick<AppSettings, "cameraEnabled" | "emotionEnabled" | "reminderLevel" | "focusMode">;

export type DecisionCooldownKey =
  | "tired_care_bubble"
  | "invite_smile_game"
  | "task_overdue"
  | "task_complete_celebrate"
  | "daily_all_done"
  | "happy_feedback";

export type DecisionCooldowns = Partial<Record<DecisionCooldownKey, number>>;

export type DecisionTrigger =
  | {
      type: "none";
    }
  | {
      type: "task_completed";
      completedToday: number;
    }
  | {
      type: "game_finished";
      result: "success" | "normal" | "quit";
      score: number;
      duration: number;
    }
  | {
      type: "user_confirmed_action";
      action: "open_tasks" | "open_smile_game" | "take_break" | "none";
    };

export type DecisionInput = {
  signals: readonly EmotionSignal[];
  settings: DecisionSettings;
  taskSummary?: TaskSummary;
  cooldowns?: DecisionCooldowns;
  previousUserState?: UserState;
  now?: number;
  trigger?: DecisionTrigger;
};

export type DecisionEngineOutput = SharedDecisionOutput & {
  action: ProductAction;
  stateDurationMs: number;
  petCommand?: PetCommand;
  navigationCommand?: NavigationCommand;
  cooldownKey?: DecisionCooldownKey;
  userStateChanged: boolean;
};

export type UserStateEvaluation = {
  userState: UserState;
  confidence: number;
  stateDurationMs: number;
};

type SignalAverages = {
  smileScore: number;
  eyeClosedScore: number;
  headDownScore: number;
  activityScore: number;
  facePresentRatio: number;
};

const SHORT_WINDOW_MS = 30_000;
const LONG_WINDOW_MS = 180_000;
const MIN_SAMPLES = 5;
const MIN_CONFIDENCE = 0.45;
const HAPPY_MIN_DURATION_MS = 10_000;
const TIRED_MIN_DURATION_MS = 30_000;
const AWAY_MIN_DURATION_MS = 120_000;
const DEFAULT_SAMPLE_INTERVAL_MS = 2_000;

const COOLDOWN_MS: Record<DecisionCooldownKey, Record<DecisionSettings["reminderLevel"], number>> = {
  tired_care_bubble: {
    quiet: 60 * 60_000,
    normal: 30 * 60_000,
    active: 15 * 60_000
  },
  invite_smile_game: {
    quiet: 120 * 60_000,
    normal: 60 * 60_000,
    active: 30 * 60_000
  },
  task_overdue: {
    quiet: 60 * 60_000,
    normal: 30 * 60_000,
    active: 15 * 60_000
  },
  task_complete_celebrate: {
    quiet: 0,
    normal: 0,
    active: 0
  },
  daily_all_done: {
    quiet: 24 * 60 * 60_000,
    normal: 24 * 60 * 60_000,
    active: 24 * 60 * 60_000
  },
  happy_feedback: {
    quiet: 45 * 60_000,
    normal: 20 * 60_000,
    active: 10 * 60_000
  }
};

const DEFAULT_SETTINGS: DecisionSettings = {
  cameraEnabled: true,
  emotionEnabled: true,
  reminderLevel: "normal",
  focusMode: false
};

export function normalizeEmotionSignal(signal: EmotionSignal): EmotionSignal {
  return {
    facePresent: signal.facePresent,
    smileScore: clamp01(signal.smileScore),
    eyeClosedScore: clamp01(signal.eyeClosedScore),
    headDownScore: clamp01(signal.headDownScore),
    activityScore: clamp01(signal.activityScore),
    timestamp: signal.timestamp
  };
}

export function evaluateUserState(
  signals: readonly EmotionSignal[],
  settings: DecisionSettings = DEFAULT_SETTINGS,
  now = latestTimestamp(signals)
): UserStateEvaluation {
  if (!settings.cameraEnabled || !settings.emotionEnabled) {
    return {
      userState: "calm",
      confidence: 1,
      stateDurationMs: 0
    };
  }

  const normalized = normalizeSignals(signals);

  if (normalized.length < MIN_SAMPLES) {
    return {
      userState: "calm",
      confidence: clamp01(normalized.length / MIN_SAMPLES),
      stateDurationMs: 0
    };
  }

  const shortSignals = signalsInWindow(normalized, now, SHORT_WINDOW_MS);
  const longSignals = signalsInWindow(normalized, now, LONG_WINDOW_MS);

  if (shortSignals.length < MIN_SAMPLES) {
    return {
      userState: "calm",
      confidence: clamp01(shortSignals.length / MIN_SAMPLES),
      stateDurationMs: 0
    };
  }

  const shortAverages = averageSignals(shortSignals);
  const longAverages = averageSignals(longSignals.length > 0 ? longSignals : shortSignals);
  const validRatio = clamp01(shortSignals.length / MIN_SAMPLES);
  const awayDurationMs = continuousDurationMs(normalized, now, (signal) => !signal.facePresent);

  if (awayDurationMs >= AWAY_MIN_DURATION_MS) {
    return {
      userState: "away",
      confidence: clamp01(0.75 + (awayDurationMs - AWAY_MIN_DURATION_MS) / AWAY_MIN_DURATION_MS),
      stateDurationMs: awayDurationMs
    };
  }

  const tiredDurationMs = Math.max(
    continuousDurationMs(normalized, now, (signal) => signal.facePresent && signal.eyeClosedScore >= 0.55),
    continuousDurationMs(
      normalized,
      now,
      (signal) => signal.facePresent && signal.headDownScore >= 0.55 && signal.activityScore <= 0.35
    )
  );
  const tiredByShortWindow =
    (shortAverages.eyeClosedScore >= 0.55 || (shortAverages.headDownScore >= 0.55 && shortAverages.activityScore <= 0.35)) &&
    tiredDurationMs >= TIRED_MIN_DURATION_MS;
  const tiredByLongWindow =
    longAverages.activityScore <= 0.25 && longAverages.smileScore <= 0.3 && longAverages.facePresentRatio >= 0.8;
  const tiredStrength = Math.max(
    strengthAbove(shortAverages.eyeClosedScore, 0.35, 0.35),
    strengthAbove(shortAverages.headDownScore, 0.35, 0.35),
    strengthBelow(longAverages.activityScore, 0.45, 0.2)
  );
  const tiredConfidence = validRatio * tiredStrength;

  if ((tiredByShortWindow || tiredByLongWindow) && tiredConfidence >= MIN_CONFIDENCE) {
    return {
      userState: "tired",
      confidence: clamp01(tiredConfidence),
      stateDurationMs: Math.max(tiredDurationMs, tiredByLongWindow ? LONG_WINDOW_MS : 0)
    };
  }

  const happyDurationMs = continuousDurationMs(
    normalized,
    now,
    (signal) => signal.facePresent && signal.smileScore >= 0.65
  );
  const happyStrength = Math.max(
    strengthAbove(shortAverages.smileScore, 0.45, 0.35),
    shortAverages.smileScore >= 0.65 && shortAverages.activityScore >= 0.4 ? 0.75 : 0
  );
  const happyConfidence = validRatio * happyStrength;

  if (
    shortAverages.facePresentRatio >= 0.8 &&
    shortAverages.smileScore >= 0.65 &&
    happyDurationMs >= HAPPY_MIN_DURATION_MS &&
    happyConfidence >= MIN_CONFIDENCE
  ) {
    return {
      userState: "happy",
      confidence: clamp01(happyConfidence),
      stateDurationMs: happyDurationMs
    };
  }

  return {
    userState: "calm",
    confidence: Math.max(MIN_CONFIDENCE, clamp01(validRatio * 0.5)),
    stateDurationMs: continuousDurationMs(normalized, now, (signal) => signal.facePresent)
  };
}

export function decideFromSignals(input: DecisionInput): DecisionEngineOutput {
  const now = input.now ?? latestTimestamp(input.signals);
  const evaluation = evaluateUserState(input.signals, input.settings, now);
  const petState = mapUserStateToPetState(evaluation.userState, input.trigger);
  const userStateChanged =
    input.previousUserState !== undefined ? input.previousUserState !== evaluation.userState : false;
  const action = selectProductAction(input, evaluation, userStateChanged, now);
  const command = buildPetCommand(action, petState, input.settings, evaluation, now);

  return {
    userState: evaluation.userState,
    confidence: evaluation.confidence,
    petState,
    action,
    message: command.message,
    petCommand: command.petCommand,
    navigationCommand: command.navigationCommand,
    cooldownKey: command.cooldownKey,
    stateDurationMs: evaluation.stateDurationMs,
    userStateChanged
  };
}

export function decideFromLatestSignal(signal: EmotionSignal): SharedDecisionOutput {
  const output = decideFromSignals({
    signals: [signal, signal, signal, signal, signal].map((sample, index) => ({
      ...sample,
      timestamp: sample.timestamp - (MIN_SAMPLES - 1 - index) * DEFAULT_SAMPLE_INTERVAL_MS
    })),
    settings: DEFAULT_SETTINGS,
    now: signal.timestamp
  });

  return {
    userState: output.userState,
    confidence: output.confidence,
    petState: output.petState,
    action: output.action,
    message: output.message
  };
}

export function isCooldownReady(
  key: DecisionCooldownKey,
  cooldowns: DecisionCooldowns | undefined,
  reminderLevel: DecisionSettings["reminderLevel"],
  now: number
): boolean {
  const lastTriggeredAt = cooldowns?.[key];
  if (lastTriggeredAt === undefined) return true;
  return now - lastTriggeredAt >= COOLDOWN_MS[key][reminderLevel];
}

export function getCooldownMs(
  key: DecisionCooldownKey,
  reminderLevel: DecisionSettings["reminderLevel"]
): number {
  return COOLDOWN_MS[key][reminderLevel];
}

function selectProductAction(
  input: DecisionInput,
  evaluation: UserStateEvaluation,
  userStateChanged: boolean,
  now: number
): ProductAction {
  const trigger = input.trigger ?? { type: "none" };

  if (trigger.type === "task_completed") {
    return "celebrate_task";
  }

  if (trigger.type === "game_finished") {
    if (trigger.result === "success") return "pet_happy";
    if (trigger.result === "quit") return "pet_care";
  }

  if (trigger.type === "user_confirmed_action") {
    if (trigger.action === "open_smile_game") return "invite_smile_game";
    if (trigger.action === "take_break") return "remind_break";
  }

  if (evaluation.userState === "away") {
    return "pet_sleep";
  }

  if (evaluation.userState === "tired") {
    if (
      evaluation.stateDurationMs >= LONG_WINDOW_MS &&
      !input.settings.focusMode &&
      isCooldownReady("invite_smile_game", input.cooldowns, input.settings.reminderLevel, now)
    ) {
      return "invite_smile_game";
    }

    return "pet_care";
  }

  if (
    input.taskSummary !== undefined &&
    input.taskSummary.overdue > 0 &&
    !input.settings.focusMode &&
    isCooldownReady("task_overdue", input.cooldowns, input.settings.reminderLevel, now)
  ) {
    return "remind_break";
  }

  if (evaluation.userState === "happy") {
    if (userStateChanged || isCooldownReady("happy_feedback", input.cooldowns, input.settings.reminderLevel, now)) {
      return "pet_happy";
    }

    return "none";
  }

  if (evaluation.userState === "calm" && input.previousUserState !== undefined && input.previousUserState !== "calm") {
    return "pet_idle";
  }

  return "none";
}

function buildPetCommand(
  action: ProductAction,
  petState: PetState,
  settings: DecisionSettings,
  evaluation: UserStateEvaluation,
  now: number
): {
  message?: string;
  petCommand?: PetCommand;
  navigationCommand?: NavigationCommand;
  cooldownKey?: DecisionCooldownKey;
} {
  if (action === "celebrate_task") {
    return {
      message: "做到了，真不错。",
      petCommand: { type: "set_state", state: "celebrate", reason: "task_completed" },
      cooldownKey: "task_complete_celebrate"
    };
  }

  if (action === "invite_smile_game") {
    if (settings.focusMode) {
      return {
        petCommand: { type: "set_state", state: petState, reason: "focus_mode_state_only" }
      };
    }

    return {
      message: "要不要做个很轻的小调整？",
      petCommand: {
        type: "show_bubble",
        message: "要不要做个很轻的小调整？",
        reason: `tired_${evaluation.stateDurationMs}_${now}`,
        cooldownKey: "invite_smile_game"
      },
      navigationCommand: { type: "open_panel", route: "game" },
      cooldownKey: "invite_smile_game"
    };
  }

  if (action === "remind_break") {
    if (settings.focusMode) {
      return {
        petCommand: { type: "set_state", state: petState, reason: "focus_mode_state_only" }
      };
    }

    return {
      message: "我们先不急，慢慢来。",
      petCommand: {
        type: "show_bubble",
        message: "我们先不急，慢慢来。",
        reason: "gentle_reminder",
        cooldownKey: "task_overdue"
      },
      navigationCommand: { type: "open_panel", route: "tasks" },
      cooldownKey: "task_overdue"
    };
  }

  if (action === "pet_happy") {
    if (settings.focusMode) {
      return {
        petCommand: { type: "set_state", state: petState, reason: "happy_state" }
      };
    }

    return {
      message: "看起来今天有一点轻快。",
      petCommand: { type: "set_state", state: petState, reason: "happy_signal" },
      cooldownKey: "happy_feedback"
    };
  }

  if (action === "pet_care") {
    return {
      message: settings.focusMode ? undefined : "你可能有点累了，要不要先慢一点？",
      petCommand: { type: "set_state", state: petState, reason: "tired_signal" },
      cooldownKey: settings.focusMode ? undefined : "tired_care_bubble"
    };
  }

  if (action === "pet_sleep" || action === "pet_idle") {
    return {
      petCommand: { type: "set_state", state: petState, reason: action }
    };
  }

  return {};
}

function mapUserStateToPetState(userState: UserState, trigger: DecisionTrigger | undefined): PetState {
  if (trigger?.type === "task_completed") return "celebrate";
  if (trigger?.type === "game_finished" && trigger.result === "success") return "happy";
  if (trigger?.type === "game_finished" && trigger.result === "quit") return "care";

  if (userState === "happy") return "happy";
  if (userState === "tired") return "care";
  if (userState === "away") return "sleep";
  return "idle";
}

function normalizeSignals(signals: readonly EmotionSignal[]): EmotionSignal[] {
  return signals
    .map(normalizeEmotionSignal)
    .filter((signal) => Number.isFinite(signal.timestamp))
    .sort((left, right) => left.timestamp - right.timestamp);
}

function signalsInWindow(signals: readonly EmotionSignal[], now: number, windowMs: number): EmotionSignal[] {
  const windowStart = now - windowMs;
  return signals.filter((signal) => signal.timestamp >= windowStart && signal.timestamp <= now);
}

function averageSignals(signals: readonly EmotionSignal[]): SignalAverages {
  if (signals.length === 0) {
    return {
      smileScore: 0,
      eyeClosedScore: 0,
      headDownScore: 0,
      activityScore: 0,
      facePresentRatio: 0
    };
  }

  const totals = signals.reduce(
    (accumulator, signal) => ({
      smileScore: accumulator.smileScore + signal.smileScore,
      eyeClosedScore: accumulator.eyeClosedScore + signal.eyeClosedScore,
      headDownScore: accumulator.headDownScore + signal.headDownScore,
      activityScore: accumulator.activityScore + signal.activityScore,
      facePresentRatio: accumulator.facePresentRatio + (signal.facePresent ? 1 : 0)
    }),
    {
      smileScore: 0,
      eyeClosedScore: 0,
      headDownScore: 0,
      activityScore: 0,
      facePresentRatio: 0
    }
  );

  return {
    smileScore: totals.smileScore / signals.length,
    eyeClosedScore: totals.eyeClosedScore / signals.length,
    headDownScore: totals.headDownScore / signals.length,
    activityScore: totals.activityScore / signals.length,
    facePresentRatio: totals.facePresentRatio / signals.length
  };
}

function continuousDurationMs(
  signals: readonly EmotionSignal[],
  now: number,
  predicate: (signal: EmotionSignal) => boolean
): number {
  let oldestMatchingTimestamp: number | undefined;

  for (let index = signals.length - 1; index >= 0; index -= 1) {
    const signal = signals[index];
    if (signal === undefined || signal.timestamp > now) continue;
    if (!predicate(signal)) break;
    oldestMatchingTimestamp = signal.timestamp;
  }

  if (oldestMatchingTimestamp === undefined) return 0;
  return now - oldestMatchingTimestamp + estimateSampleIntervalMs(signals);
}

function estimateSampleIntervalMs(signals: readonly EmotionSignal[]): number {
  if (signals.length < 2) return DEFAULT_SAMPLE_INTERVAL_MS;

  const intervals: number[] = [];
  for (let index = 1; index < signals.length; index += 1) {
    const previous = signals[index - 1];
    const current = signals[index];
    if (previous === undefined || current === undefined) continue;
    const interval = current.timestamp - previous.timestamp;
    if (interval > 0 && Number.isFinite(interval)) intervals.push(interval);
  }

  if (intervals.length === 0) return DEFAULT_SAMPLE_INTERVAL_MS;

  const total = intervals.reduce((sum, interval) => sum + interval, 0);
  return total / intervals.length;
}

function latestTimestamp(signals: readonly EmotionSignal[]): number {
  const timestamps = signals.map((signal) => signal.timestamp).filter((timestamp) => Number.isFinite(timestamp));
  if (timestamps.length === 0) return Date.now();
  return Math.max(...timestamps);
}

function strengthAbove(value: number, baseline: number, range: number): number {
  return clamp01((value - baseline) / range);
}

function strengthBelow(value: number, baseline: number, range: number): number {
  return clamp01((baseline - value) / range);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
