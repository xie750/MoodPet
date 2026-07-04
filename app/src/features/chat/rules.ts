import type { ChatContext, ChatRecommendedAction, ChatReply } from "./types";

const SAFETY_REPLY = "听起来你现在真的很难受。请先联系身边可信任的人，或寻求当地紧急帮助。";

const KEYWORDS = {
  highRisk: [
    "自杀",
    "轻生",
    "不想活",
    "活不下去",
    "死了算",
    "伤害自己",
    "杀了自己",
    "杀人",
    "伤害别人",
    "suicide",
    "kill myself",
    "hurt myself",
    "kill someone",
    "hurt someone"
  ],
  tired: ["累", "困", "疲惫", "没精神", "睡不醒", "乏", "tired", "sleepy", "exhausted"],
  tasks: ["任务好多", "任务多", "做不完", "好多事", "忙不过来", "来不及", "ddl", "deadline", "截止"],
  play: ["想玩", "放松", "小游戏", "游戏", "轻松一下", "休息一下", "break", "game"],
  stop: ["不想做", "不想干", "算了", "放弃", "摆烂", "撑不住", "先停", "quit"],
  completed: ["做完", "完成", "搞定", "结束了", "done", "finished", "complete"]
} as const;

export function generateChatReply(context: ChatContext): ChatReply {
  const text = normalizeMessage(context.message);

  if (matchesAny(text, KEYWORDS.highRisk)) {
    return {
      reply: SAFETY_REPLY,
      recommendedAction: "none",
      riskLevel: "high"
    };
  }

  if (!text) {
    return buildContextualFallback(context);
  }

  if (matchesAny(text, KEYWORDS.completed)) {
    return buildCompletedReply(context);
  }

  if (matchesAny(text, KEYWORDS.stop)) {
    return {
      reply: "可以先停一下。你不是失败了，只是需要换口气。",
      recommendedAction: "take_break"
    };
  }

  if (matchesAny(text, KEYWORDS.tasks) || isTaskPressureContext(context)) {
    return buildTaskReply(context);
  }

  if (matchesAny(text, KEYWORDS.tired) || context.userState === "tired") {
    return buildTiredReply(context);
  }

  if (matchesAny(text, KEYWORDS.play)) {
    return buildPlayReply(context);
  }

  return buildContextualFallback(context);
}

export function getRecommendedActionLabel(action: ChatRecommendedAction): string {
  if (action === "open_tasks") return "看看今日任务";
  if (action === "open_smile_game") return "玩微笑能量";
  if (action === "take_break") return "休息 1 分钟";
  return "先这样";
}

function buildTiredReply(context: ChatContext): ChatReply {
  if (context.userState === "away") {
    return {
      reply: "我先安静等你回来。回来后我们再慢慢继续。",
      recommendedAction: "none"
    };
  }

  if (context.taskSummary.unfinished > 0) {
    return {
      reply: "那我们先慢一点吧。要不要休息 1 分钟，再回来挑一个最小的继续？",
      recommendedAction: "take_break"
    };
  }

  return {
    reply: "那我们先慢一点吧。要不要玩 1 分钟轻松小游戏，我陪你缓一下。",
    recommendedAction: "open_smile_game"
  };
}

function buildTaskReply(context: ChatContext): ChatReply {
  const { unfinished, overdue } = context.taskSummary;

  if (unfinished <= 0) {
    return {
      reply: "今天看起来已经轻了很多。可以先给自己留一点空。",
      recommendedAction: "none"
    };
  }

  if (overdue > 0) {
    return {
      reply: "有几件晚了一点也没关系。我们先把最小的一件重新放回手边。",
      recommendedAction: "open_tasks"
    };
  }

  return {
    reply: `今天还有 ${unfinished} 件没完成。我们先挑一个最小的开始，完成一个也算前进。`,
    recommendedAction: "open_tasks"
  };
}

function buildPlayReply(context: ChatContext): ChatReply {
  if (context.userState === "away") {
    return {
      reply: "我先在这里等你。等你回来，我们再玩一小会儿。",
      recommendedAction: "none"
    };
  }

  return {
    reply: "可以呀，轻轻换口气。要不要玩 1 分钟微笑能量？",
    recommendedAction: "open_smile_game"
  };
}

function buildCompletedReply(context: ChatContext): ChatReply {
  const { completedToday, unfinished } = context.taskSummary;
  const completedText = completedToday > 0 ? `今天已经完成 ${completedToday} 件了。` : "";

  if (unfinished > 0) {
    return {
      reply: `${completedText}完成一个就很棒啦。下一件我们也可以慢慢来。`,
      recommendedAction: "open_tasks"
    };
  }

  return {
    reply: `${completedText}今天已经很不错啦。剩下的时间可以轻一点。`,
    recommendedAction: "none"
  };
}

function buildContextualFallback(context: ChatContext): ChatReply {
  if (context.userState === "happy") {
    return {
      reply: "看起来今天有一点轻快。我们保持这个节奏就好。",
      recommendedAction: context.taskSummary.unfinished > 0 ? "open_tasks" : "none"
    };
  }

  if (context.userState === "away") {
    return {
      reply: "我先安静待着，等你回来。",
      recommendedAction: "none"
    };
  }

  if (context.lastGameResult === "quit") {
    return {
      reply: "没关系，刚才停下也可以。我们换个很小的开始。",
      recommendedAction: context.taskSummary.unfinished > 0 ? "open_tasks" : "take_break"
    };
  }

  if (context.taskSummary.unfinished > 3) {
    return {
      reply: "事情有点多时，我们先只看下一步。一个小开始就够了。",
      recommendedAction: "open_tasks"
    };
  }

  const affinityHint = context.petAffinity >= 20 ? "我会继续陪着你。" : "我在这儿。";

  return {
    reply: `${affinityHint}现在想先从哪件小事开始？`,
    recommendedAction: context.taskSummary.unfinished > 0 ? "open_tasks" : "none"
  };
}

function isTaskPressureContext(context: ChatContext): boolean {
  return context.taskSummary.unfinished >= 5 || context.taskSummary.overdue > 0;
}

function normalizeMessage(message: string): string {
  return message.trim().toLowerCase();
}

function matchesAny(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}
