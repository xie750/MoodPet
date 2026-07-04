import type { EmotionSignal } from "../../shared/types";
import type { DecisionEngineOutput, DecisionInput, DecisionSettings } from "./rules";
import { decideFromSignals } from "./rules";

type SignalProfile = Omit<EmotionSignal, "timestamp">;

export type DecisionMockScenarioName =
  | "happy"
  | "tired"
  | "tiredInviteCooldownReady"
  | "tiredInviteInCooldown"
  | "away"
  | "cameraDisabled"
  | "taskCompleted";

export type DecisionMockScenario = {
  name: DecisionMockScenarioName;
  input: DecisionInput;
  output: DecisionEngineOutput;
};

const NORMAL_SETTINGS: DecisionSettings = {
  cameraEnabled: true,
  emotionEnabled: true,
  reminderLevel: "normal",
  focusMode: false
};

const NOW = 1_725_000_000_000;

export function runDecisionMockScenarios(now = NOW): DecisionMockScenario[] {
  const happySignals = createSignalSequence(
    {
      facePresent: true,
      smileScore: 0.72,
      eyeClosedScore: 0.12,
      headDownScore: 0.08,
      activityScore: 0.55
    },
    now,
    30_000
  );
  const tiredSignals = createSignalSequence(
    {
      facePresent: true,
      smileScore: 0.18,
      eyeClosedScore: 0.62,
      headDownScore: 0.57,
      activityScore: 0.22
    },
    now,
    30_000
  );
  const longTiredSignals = createSignalSequence(
    {
      facePresent: true,
      smileScore: 0.18,
      eyeClosedScore: 0.62,
      headDownScore: 0.57,
      activityScore: 0.22
    },
    now,
    180_000
  );
  const awaySignals = createSignalSequence(
    {
      facePresent: false,
      smileScore: 0,
      eyeClosedScore: 0,
      headDownScore: 0,
      activityScore: 0
    },
    now,
    120_000
  );

  return [
    makeScenario("happy", {
      signals: happySignals,
      settings: NORMAL_SETTINGS,
      now
    }),
    makeScenario("tired", {
      signals: tiredSignals,
      settings: NORMAL_SETTINGS,
      now
    }),
    makeScenario("tiredInviteCooldownReady", {
      signals: longTiredSignals,
      settings: NORMAL_SETTINGS,
      cooldowns: {},
      now
    }),
    makeScenario("tiredInviteInCooldown", {
      signals: longTiredSignals,
      settings: NORMAL_SETTINGS,
      cooldowns: {
        invite_smile_game: now - 10 * 60_000
      },
      now
    }),
    makeScenario("away", {
      signals: awaySignals,
      settings: NORMAL_SETTINGS,
      now
    }),
    makeScenario("cameraDisabled", {
      signals: tiredSignals,
      settings: {
        ...NORMAL_SETTINGS,
        cameraEnabled: false
      },
      now
    }),
    makeScenario("taskCompleted", {
      signals: tiredSignals,
      settings: NORMAL_SETTINGS,
      trigger: {
        type: "task_completed",
        completedToday: 1
      },
      now
    })
  ];
}

export function createSignalSequence(profile: SignalProfile, endAt: number, durationMs: number): EmotionSignal[] {
  const intervalMs = 2_000;
  const sampleCount = Math.max(5, Math.floor(durationMs / intervalMs) + 1);
  const startAt = endAt - durationMs;

  return Array.from({ length: sampleCount }, (_, index) => ({
    ...profile,
    timestamp: startAt + index * intervalMs
  }));
}

function makeScenario(name: DecisionMockScenarioName, input: DecisionInput): DecisionMockScenario {
  return {
    name,
    input,
    output: decideFromSignals(input)
  };
}
