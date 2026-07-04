import type { PetState } from "../../shared/types";
import type {
  BubbleCopy,
  BubbleCopyIntent,
  BubbleCopyIntentGuide,
  CopyValidationDetail,
  CopyValidationResult,
  CopyViolation,
  PetVisualResource,
  VisualCopyAcceptanceCheck,
  VisualCopyAuditReport,
  VisualResourceValidationDetail
} from "./types";

const REQUIRED_PET_STATES: readonly PetState[] = ["idle", "happy", "care", "tired", "celebrate", "sleep"];
const P0_PET_STATES: readonly PetState[] = ["idle", "happy", "care", "celebrate", "sleep"];
const MAX_DESKTOP_BUBBLE_CHARS = 34;
const MAX_ACTION_LABEL_CHARS = 6;
const DEFAULT_BUBBLE_DISPLAY_MS = 6_000;

export const PET_VISUAL_RESOURCES: Record<PetState, PetVisualResource> = {
  idle: {
    state: "idle",
    priority: "P0",
    displayName: "待机",
    userFacingMode: "安静陪伴中",
    description: "轻微呼吸和眨眼，作为默认陪伴状态。",
    assetKind: "css_fallback",
    assetPath: null,
    fallbackClassName: "pet-avatar-button[data-state='idle']",
    motionIntensity: "quiet",
    ariaLabel: "小云团安静陪伴中"
  },
  happy: {
    state: "happy",
    priority: "P0",
    displayName: "开心",
    userFacingMode: "活力陪伴中",
    description: "短促小跳和更明显的笑脸，用于积极反馈。",
    assetKind: "css_fallback",
    assetPath: null,
    fallbackClassName: "pet-avatar-button[data-state='happy']",
    motionIntensity: "lively",
    ariaLabel: "小云团活力陪伴中"
  },
  care: {
    state: "care",
    priority: "P0",
    displayName: "关心",
    userFacingMode: "关心一下",
    description: "轻轻靠近并出现小杯子，表达低压力关心。",
    assetKind: "css_fallback",
    assetPath: null,
    fallbackClassName: "pet-avatar-button[data-state='care']",
    motionIntensity: "soft",
    ariaLabel: "小云团正在关心你"
  },
  tired: {
    state: "tired",
    priority: "P1",
    displayName: "慢下来",
    userFacingMode: "一起慢下来",
    description: "动作变慢、眼睛半闭，用于慢节奏陪伴。",
    assetKind: "css_fallback",
    assetPath: null,
    fallbackClassName: "pet-avatar-button[data-state='tired']",
    motionIntensity: "quiet",
    ariaLabel: "小云团陪你慢下来"
  },
  celebrate: {
    state: "celebrate",
    priority: "P0",
    displayName: "庆祝",
    userFacingMode: "为你庆祝",
    description: "小跳和轻粒子，用于任务完成等正反馈。",
    assetKind: "css_fallback",
    assetPath: null,
    fallbackClassName: "pet-avatar-button[data-state='celebrate']",
    motionIntensity: "lively",
    ariaLabel: "小云团正在为你庆祝"
  },
  sleep: {
    state: "sleep",
    priority: "P0",
    displayName: "睡眠",
    userFacingMode: "等你回来",
    description: "闭眼和慢呼吸，用于离开或低打扰等待。",
    assetKind: "css_fallback",
    assetPath: null,
    fallbackClassName: "pet-avatar-button[data-state='sleep']",
    motionIntensity: "quiet",
    ariaLabel: "小云团正在等你回来"
  }
};

export const BUBBLE_COPY_LIBRARY: Record<BubbleCopyIntent, readonly BubbleCopy[]> = {
  gentle_greeting: [
    {
      id: "greeting-quiet-01",
      intent: "gentle_greeting",
      text: "我在这儿，慢慢来。",
      maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
    },
    {
      id: "greeting-quiet-02",
      intent: "gentle_greeting",
      text: "今天也先从一小步开始。",
      maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
    }
  ],
  tired_reminder: [
    {
      id: "tired-care-01",
      intent: "tired_reminder",
      text: "感觉你坚持很久啦，要不要缓 1 分钟？",
      actions: {
        primary: "休息一下",
        secondary: "稍后"
      },
      maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
    },
    {
      id: "tired-care-02",
      intent: "tired_reminder",
      text: "我们先慢一点，我陪你。",
      actions: {
        primary: "休息一下",
        secondary: "稍后"
      },
      maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
    },
    {
      id: "tired-care-03",
      intent: "tired_reminder",
      text: "要不要喝口水，换口气？",
      actions: {
        primary: "休息一下",
        secondary: "稍后"
      },
      maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
    }
  ],
  game_invite: [
    {
      id: "game-invite-01",
      intent: "game_invite",
      text: "要不要陪我充 1 分钟能量？",
      actions: {
        primary: "玩 1 分钟",
        secondary: "先不用"
      },
      maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
    },
    {
      id: "game-invite-02",
      intent: "game_invite",
      text: "来玩一小会儿，轻轻松松的。",
      actions: {
        primary: "玩 1 分钟",
        secondary: "先不用"
      },
      maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
    },
    {
      id: "game-invite-03",
      intent: "game_invite",
      text: "我有点没电啦，可以帮我充点能量吗？",
      actions: {
        primary: "玩 1 分钟",
        secondary: "先不用"
      },
      maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
    }
  ],
  task_completed: [
    {
      id: "task-done-01",
      intent: "task_completed",
      text: "完成一个啦，真不错。",
      actions: {
        primary: "查看今日",
        secondary: "关闭"
      },
      maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
    },
    {
      id: "task-done-02",
      intent: "task_completed",
      text: "今天又前进了一点。",
      actions: {
        primary: "查看今日",
        secondary: "关闭"
      },
      maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
    },
    {
      id: "task-done-03",
      intent: "task_completed",
      text: "这个任务收下啦，我们继续慢慢来。",
      actions: {
        primary: "查看今日",
        secondary: "关闭"
      },
      maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
    }
  ],
  many_tasks: [
    {
      id: "many-tasks-01",
      intent: "many_tasks",
      text: "我们先挑一个最小的开始。",
      maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
    },
    {
      id: "many-tasks-02",
      intent: "many_tasks",
      text: "不用一次做完，先走一步就好。",
      maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
    },
    {
      id: "many-tasks-03",
      intent: "many_tasks",
      text: "任务有点多，我们慢慢拆。",
      maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
    }
  ],
  away: [
    {
      id: "away-01",
      intent: "away",
      text: "我先在这里等你。",
      maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
    }
  ],
  returning: [
    {
      id: "returning-01",
      intent: "returning",
      text: "你回来啦。",
      maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
    }
  ],
  privacy_paused: [
    {
      id: "privacy-paused-01",
      intent: "privacy_paused",
      text: "识别已暂停，我会先安静陪着。",
      actions: {
        primary: "去设置",
        secondary: "知道了"
      },
      maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
    }
  ]
};

export const BUBBLE_COPY_GUIDES: Record<BubbleCopyIntent, BubbleCopyIntentGuide> = {
  gentle_greeting: {
    intent: "gentle_greeting",
    title: "轻问候",
    purpose: "启动或空闲时建立陪伴感，不催促用户。",
    tone: "quiet",
    recommendedMaxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS,
    maxDesktopChars: MAX_DESKTOP_BUBBLE_CHARS,
    avoid: ["命令", "效率评价", "强提醒"]
  },
  tired_reminder: {
    intent: "tired_reminder",
    title: "疲惫提醒",
    purpose: "用可选择的方式建议用户慢一点，不做情绪判断。",
    tone: "care",
    recommendedMaxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS,
    maxDesktopChars: MAX_DESKTOP_BUBBLE_CHARS,
    avoid: ["诊断", "负面评价", "必须休息"]
  },
  game_invite: {
    intent: "game_invite",
    title: "游戏邀请",
    purpose: "轻量邀请用户进入微笑能量，不制造失败压力。",
    tone: "playful",
    recommendedMaxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS,
    maxDesktopChars: MAX_DESKTOP_BUBBLE_CHARS,
    avoid: ["强制", "挑战失败", "情绪异常"]
  },
  task_completed: {
    intent: "task_completed",
    title: "任务完成",
    purpose: "给用户明确的正向反馈，强化完成感。",
    tone: "reward",
    recommendedMaxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS,
    maxDesktopChars: MAX_DESKTOP_BUBBLE_CHARS,
    avoid: ["绩效比较", "继续催促", "夸张奖励"]
  },
  many_tasks: {
    intent: "many_tasks",
    title: "任务较多",
    purpose: "降低任务压力，鼓励从最小一步开始。",
    tone: "care",
    recommendedMaxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS,
    maxDesktopChars: MAX_DESKTOP_BUBBLE_CHARS,
    avoid: ["拖延评价", "效率指责", "一次做完"]
  },
  away: {
    intent: "away",
    title: "用户离开",
    purpose: "降低存在感并表达等待，不推断离开原因。",
    tone: "quiet",
    recommendedMaxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS,
    maxDesktopChars: MAX_DESKTOP_BUBBLE_CHARS,
    avoid: ["追问原因", "责备", "监控感"]
  },
  returning: {
    intent: "returning",
    title: "用户回来",
    purpose: "简单确认用户回来，避免打断。",
    tone: "quiet",
    recommendedMaxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS,
    maxDesktopChars: MAX_DESKTOP_BUBBLE_CHARS,
    avoid: ["追踪感", "质问", "长句"]
  },
  privacy_paused: {
    intent: "privacy_paused",
    title: "隐私状态",
    purpose: "直白说明识别状态变化，让用户保持控制感。",
    tone: "privacy",
    recommendedMaxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS,
    maxDesktopChars: MAX_DESKTOP_BUBBLE_CHARS,
    avoid: ["模糊承诺", "隐藏状态", "技术黑话"]
  }
};

const STATE_TO_DEFAULT_INTENT: Record<PetState, BubbleCopyIntent> = {
  idle: "gentle_greeting",
  happy: "gentle_greeting",
  care: "tired_reminder",
  tired: "tired_reminder",
  celebrate: "task_completed",
  sleep: "away"
};

const FALLBACK_BUBBLE_COPY: BubbleCopy = {
  id: "fallback-greeting",
  intent: "gentle_greeting",
  text: "我在这儿，慢慢来。",
  maxDisplayMs: DEFAULT_BUBBLE_DISPLAY_MS
};

const BANNED_COPY_PATTERNS: readonly { pattern: RegExp; code: string; phrase: string; reason: string }[] = [
  {
    pattern: /焦虑|抑郁|心理疾病|情绪异常/u,
    code: "medical_or_strong_emotion",
    phrase: "医疗或强情绪诊断",
    reason: "文案不应做医疗级或强情绪判断。"
  },
  {
    pattern: /状态很差|太拖延|失败了/u,
    code: "negative_judgement",
    phrase: "负面评价",
    reason: "文案不应评判用户。"
  },
  {
    pattern: /必须|马上|应该更努力/u,
    code: "commanding_tone",
    phrase: "命令式表达",
    reason: "提醒应保持可选择、低压力。"
  }
];

function countChars(text: string): number {
  return Array.from(text.trim()).length;
}

function createCheck(id: string, label: string, passed: boolean, detail: string): VisualCopyAcceptanceCheck {
  return {
    id,
    label,
    passed,
    detail
  };
}

export function getPetVisualResource(state: PetState): PetVisualResource {
  return PET_VISUAL_RESOURCES[state];
}

export function getPetStateLabel(state: PetState): string {
  return PET_VISUAL_RESOURCES[state].userFacingMode;
}

export function getBubbleCopyVariants(intent: BubbleCopyIntent): readonly BubbleCopy[] {
  return BUBBLE_COPY_LIBRARY[intent];
}

export function getBubbleCopyGuide(intent: BubbleCopyIntent): BubbleCopyIntentGuide {
  return BUBBLE_COPY_GUIDES[intent];
}

export function getDefaultBubbleCopyForState(state: PetState): BubbleCopy {
  return pickBubbleCopy(STATE_TO_DEFAULT_INTENT[state], state.length);
}

export function pickBubbleCopy(intent: BubbleCopyIntent, seed = 0): BubbleCopy {
  const variants = BUBBLE_COPY_LIBRARY[intent];
  if (variants.length === 0) {
    return FALLBACK_BUBBLE_COPY;
  }

  const index = Math.abs(Math.round(seed)) % variants.length;
  return variants[index] ?? FALLBACK_BUBBLE_COPY;
}

export function validateCompanionCopy(text: string): CopyValidationResult {
  const violations: CopyViolation[] = BANNED_COPY_PATTERNS.flatMap((item) =>
    item.pattern.test(text)
      ? [
          {
            code: item.code,
            phrase: item.phrase,
            reason: item.reason
          }
        ]
      : []
  );
  const textLength = countChars(text);

  return {
    safe: violations.length === 0,
    textLength,
    fitsBubble: textLength <= MAX_DESKTOP_BUBBLE_CHARS,
    violations
  };
}

function validateBubbleActions(copy: BubbleCopy): CopyViolation[] {
  const labels = [copy.actions?.primary, copy.actions?.secondary].filter((label): label is string => label !== undefined);

  return labels.flatMap((label) => {
    if (countChars(label) <= MAX_ACTION_LABEL_CHARS) {
      return [];
    }

    return [
      {
        code: "long_action_label",
        phrase: label,
        reason: `气泡按钮文案建议不超过 ${MAX_ACTION_LABEL_CHARS} 个字。`
      }
    ];
  });
}

export function validateBubbleCopy(copy: BubbleCopy): CopyValidationDetail {
  const base = validateCompanionCopy(copy.text);
  const guide = getBubbleCopyGuide(copy.intent);
  const actionViolations = validateBubbleActions(copy);
  const timingViolations: CopyViolation[] =
    copy.maxDisplayMs > guide.recommendedMaxDisplayMs
      ? [
          {
            code: "long_display_duration",
            phrase: `${copy.maxDisplayMs}ms`,
            reason: `气泡展示时间建议不超过 ${guide.recommendedMaxDisplayMs}ms。`
          }
        ]
      : [];
  const violations = [...base.violations, ...actionViolations, ...timingViolations];

  return {
    ...base,
    id: copy.id,
    intent: copy.intent,
    text: copy.text,
    safe: violations.length === 0,
    violations
  };
}

export function validateCopyLibrary(): CopyValidationDetail[] {
  return Object.values(BUBBLE_COPY_LIBRARY)
    .flatMap((items) => items)
    .map(validateBubbleCopy);
}

export function validatePetVisualResource(resource: PetVisualResource): VisualResourceValidationDetail {
  const issues: string[] = [];

  if (resource.displayName.trim().length === 0) {
    issues.push("缺少状态显示名。");
  }

  if (resource.userFacingMode.trim().length === 0) {
    issues.push("缺少面向用户的陪伴模式名。");
  }

  if (resource.description.trim().length === 0) {
    issues.push("缺少状态表现说明。");
  }

  if (resource.ariaLabel.trim().length === 0) {
    issues.push("缺少无障碍标签。");
  }

  if (resource.assetKind === "css_fallback" && resource.fallbackClassName.trim().length === 0) {
    issues.push("CSS 占位资源缺少 fallback class。");
  }

  if (resource.assetKind !== "css_fallback" && resource.assetPath === null) {
    issues.push("正式资源缺少 assetPath。");
  }

  if (P0_PET_STATES.includes(resource.state) && resource.priority !== "P0") {
    issues.push("P0 状态资源优先级不正确。");
  }

  return {
    state: resource.state,
    valid: issues.length === 0,
    issues
  };
}

export function validatePetVisualResources(): VisualResourceValidationDetail[] {
  const resourceStates = new Set<PetState>(Object.values(PET_VISUAL_RESOURCES).map((resource) => resource.state));
  const missingStateDetails: VisualResourceValidationDetail[] = REQUIRED_PET_STATES.flatMap((state) =>
    resourceStates.has(state)
      ? []
      : [
          {
            state,
            valid: false,
            issues: ["缺少必需宠物状态资源。"]
          }
        ]
  );
  const resourceDetails = REQUIRED_PET_STATES.flatMap((state) => {
    const resource = PET_VISUAL_RESOURCES[state];
    return resource === undefined ? [] : [validatePetVisualResource(resource)];
  });

  return [...missingStateDetails, ...resourceDetails];
}

export function getVisualCopyAuditReport(): VisualCopyAuditReport {
  const resourceDetails = validatePetVisualResources();
  const copyDetails = validateCopyLibrary();
  const requiredStatesCovered = REQUIRED_PET_STATES.filter((state) =>
    resourceDetails.some((detail) => detail.state === state && detail.valid)
  ).length;
  const p0StatesCovered = P0_PET_STATES.filter((state) =>
    resourceDetails.some((detail) => detail.state === state && detail.valid)
  ).length;
  const copySafe = copyDetails.filter((detail) => detail.safe).length;
  const bubbleFit = copyDetails.filter((detail) => detail.fitsBubble).length;
  const checks = [
    createCheck(
      "required_pet_states",
      "必需状态资源",
      requiredStatesCovered === REQUIRED_PET_STATES.length,
      `${requiredStatesCovered}/${REQUIRED_PET_STATES.length} 个状态可用`
    ),
    createCheck(
      "p0_pet_states",
      "P0 状态资源",
      p0StatesCovered === P0_PET_STATES.length,
      `${p0StatesCovered}/${P0_PET_STATES.length} 个 P0 状态可用`
    ),
    createCheck("copy_safety", "文案安全", copySafe === copyDetails.length, `${copySafe}/${copyDetails.length} 条通过安全检查`),
    createCheck(
      "bubble_fit",
      "气泡长度",
      bubbleFit === copyDetails.length,
      `${bubbleFit}/${copyDetails.length} 条适合桌面气泡`
    )
  ];

  return {
    checks,
    passed: checks.every((check) => check.passed),
    requiredStatesCovered,
    requiredStatesTotal: REQUIRED_PET_STATES.length,
    p0StatesCovered,
    p0StatesTotal: P0_PET_STATES.length,
    copySafe,
    copyTotal: copyDetails.length,
    bubbleFit,
    resourceDetails,
    copyDetails
  };
}
