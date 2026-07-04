import type { PetState } from "../../shared/types";
import { getDefaultBubbleCopyForState, getPetVisualResource, getVisualCopyAuditReport } from "./copy";
import type { VisualCopyMockScenario } from "./types";

const MOCK_STATES: readonly PetState[] = ["idle", "happy", "care", "tired", "celebrate", "sleep"];

const MOCK_VALUES: Record<PetState, { affinity: number; energy: number; title: string }> = {
  idle: {
    affinity: 18,
    energy: 72,
    title: "默认陪伴"
  },
  happy: {
    affinity: 28,
    energy: 88,
    title: "积极反馈"
  },
  care: {
    affinity: 24,
    energy: 58,
    title: "疲惫关心"
  },
  tired: {
    affinity: 20,
    energy: 42,
    title: "慢节奏陪伴"
  },
  celebrate: {
    affinity: 36,
    energy: 80,
    title: "任务完成"
  },
  sleep: {
    affinity: 18,
    energy: 64,
    title: "用户离开"
  }
};

export function getVisualCopyMockScenarios(): VisualCopyMockScenario[] {
  return MOCK_STATES.map((state) => ({
    state,
    title: MOCK_VALUES[state].title,
    resource: getPetVisualResource(state),
    bubble: getDefaultBubbleCopyForState(state),
    affinity: MOCK_VALUES[state].affinity,
    energy: MOCK_VALUES[state].energy
  }));
}

export function getVisualCopyMockSafetySummary() {
  const report = getVisualCopyAuditReport();

  return {
    total: report.copyTotal,
    safe: report.copySafe,
    bubbleFit: report.bubbleFit,
    resourceTotal: report.requiredStatesTotal,
    resourceValid: report.requiredStatesCovered,
    passed: report.passed
  };
}
