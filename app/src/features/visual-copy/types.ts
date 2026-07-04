import type { PetState } from "../../shared/types";

export type VisualAssetPriority = "P0" | "P1";

export type VisualAssetKind = "css_fallback" | "webp" | "png_sequence" | "lottie";

export type MotionIntensity = "quiet" | "soft" | "lively";

export type PetVisualResource = {
  state: PetState;
  priority: VisualAssetPriority;
  displayName: string;
  userFacingMode: string;
  description: string;
  assetKind: VisualAssetKind;
  assetPath: string | null;
  fallbackClassName: string;
  motionIntensity: MotionIntensity;
  ariaLabel: string;
};

export type BubbleCopyIntent =
  | "gentle_greeting"
  | "tired_reminder"
  | "game_invite"
  | "task_completed"
  | "many_tasks"
  | "away"
  | "returning"
  | "privacy_paused";

export type BubbleCopyTone = "quiet" | "care" | "reward" | "playful" | "privacy";

export type BubbleCopyIntentGuide = {
  intent: BubbleCopyIntent;
  title: string;
  purpose: string;
  tone: BubbleCopyTone;
  recommendedMaxDisplayMs: number;
  maxDesktopChars: number;
  avoid: readonly string[];
};

export type BubbleActionLabel = {
  primary?: string;
  secondary?: string;
};

export type BubbleCopy = {
  id: string;
  intent: BubbleCopyIntent;
  text: string;
  actions?: BubbleActionLabel;
  maxDisplayMs: number;
};

export type CopyViolation = {
  code: string;
  phrase: string;
  reason: string;
};

export type CopyValidationResult = {
  safe: boolean;
  textLength: number;
  fitsBubble: boolean;
  violations: CopyViolation[];
};

export type CopyValidationDetail = CopyValidationResult & {
  id: string;
  intent: BubbleCopyIntent;
  text: string;
};

export type VisualResourceValidationDetail = {
  state: PetState;
  valid: boolean;
  issues: string[];
};

export type VisualCopyAcceptanceCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type VisualCopyAcceptanceReport = {
  checks: VisualCopyAcceptanceCheck[];
  passed: boolean;
  requiredStatesCovered: number;
  requiredStatesTotal: number;
  p0StatesCovered: number;
  p0StatesTotal: number;
  copySafe: number;
  copyTotal: number;
  bubbleFit: number;
};

export type VisualCopyAuditReport = VisualCopyAcceptanceReport & {
  resourceDetails: VisualResourceValidationDetail[];
  copyDetails: CopyValidationDetail[];
};

export type VisualCopyMockScenario = {
  state: PetState;
  title: string;
  resource: PetVisualResource;
  bubble: BubbleCopy;
  affinity: number;
  energy: number;
};
