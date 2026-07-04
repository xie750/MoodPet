import { useCallback, useEffect, useRef, useState } from "react";
import { PetView } from "../components/pet";
import {
  BrowserEmotionProvider,
  MockEmotionProvider,
  type EmotionProvider,
  type EmotionProviderStatus
} from "../features/emotion";
import {
  decideFromSignals,
  isCooldownReady,
  type DecisionCooldowns,
  type DecisionEngineOutput,
  type DecisionSettings
} from "../features/decision";
import { usePetController } from "../features/pet";
import type { EmotionSignal, PanelRoute, PetCommand, PetState, UserState } from "../shared/types";

const MAX_SIGNAL_HISTORY = 120;

const DEFAULT_DECISION_SETTINGS: DecisionSettings = {
  cameraEnabled: true,
  emotionEnabled: true,
  reminderLevel: "normal",
  focusMode: false
};

const STATUS_TEXT: Record<EmotionProviderStatus, string> = {
  idle: "准备陪伴",
  requesting_permission: "等待摄像头授权",
  camera_ready: "摄像头已开启",
  recognizing: "本地识别中",
  mock: "演示信号中",
  permission_denied: "未授权摄像头",
  camera_unavailable: "摄像头不可用",
  model_unavailable: "识别模型不可用",
  stopped: "识别已暂停"
};

const STATUS_TONE: Partial<Record<EmotionProviderStatus, "active" | "quiet" | "warning">> = {
  recognizing: "active",
  camera_ready: "active",
  requesting_permission: "quiet",
  mock: "quiet",
  permission_denied: "warning",
  camera_unavailable: "warning",
  model_unavailable: "warning"
};

function getCompanionMessage(decision: DecisionEngineOutput): string | undefined {
  if (decision.action === "celebrate_task") return "完成一个啦，真的不错。";
  if (decision.action === "invite_smile_game") return "要不要陪我充 1 分钟能量？";
  if (decision.action === "remind_break") return "我们先慢一点，要不要换口气？";
  if (decision.action === "pet_happy") return "看起来今天轻快了一点。";
  if (decision.action === "pet_care") return "你可能坚持有一会儿了，要不要先慢一点？";
  if (decision.action === "pet_sleep" && decision.userStateChanged) return "我先在这里等你回来。";
  return decision.message;
}

function normalizeDecisionCommand(command: PetCommand, decision: DecisionEngineOutput): PetCommand {
  if (command.type !== "show_bubble") return command;

  return {
    ...command,
    message: getCompanionMessage(decision) ?? command.message
  };
}

export function PetWindow() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const providerRef = useRef<EmotionProvider | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const signalsRef = useRef<EmotionSignal[]>([]);
  const cooldownsRef = useRef<DecisionCooldowns>({});
  const previousUserStateRef = useRef<UserState | undefined>();
  const lastPetStateRef = useRef<PetState>("idle");
  const settingsRef = useRef<DecisionSettings>(DEFAULT_DECISION_SETTINGS);

  const { runtime, executeCommand, dismissBubble } = usePetController();
  const [status, setStatus] = useState<EmotionProviderStatus>("idle");
  const [source, setSource] = useState<"camera" | "mock">("camera");

  const runPetCommand = useCallback(
    (command: PetCommand) => {
      executeCommand(command);
      if (command.type === "set_state") {
        lastPetStateRef.current = command.state;
      }
      void window.appApi.pet.applyCommand(command);
    },
    [executeCommand]
  );

  const openPanel = useCallback(async (route: PanelRoute) => {
    await window.appApi.windows.openPanel({ type: "open_panel", route });
  }, []);

  const applyDecision = useCallback(
    (decision: DecisionEngineOutput, now: number) => {
      const commands: PetCommand[] = [];
      const commandSetsState = decision.petCommand?.type === "set_state";
      const commandShowsBubble = decision.petCommand?.type === "show_bubble";

      if (!commandSetsState && decision.petState !== lastPetStateRef.current) {
        commands.push({
          type: "set_state",
          state: decision.petState,
          reason: `emotion_${decision.userState}`
        });
      }

      if (decision.petCommand) {
        commands.push(normalizeDecisionCommand(decision.petCommand, decision));
      }

      const canShowBubble = decision.cooldownKey
        ? isCooldownReady(decision.cooldownKey, cooldownsRef.current, settingsRef.current.reminderLevel, now)
        : true;

      const companionMessage = getCompanionMessage(decision);

      if (companionMessage && !commandShowsBubble && canShowBubble) {
        commands.push({
          type: "show_bubble",
          message: companionMessage,
          reason: decision.action ?? "emotion_feedback",
          cooldownKey: decision.cooldownKey
        });
      }

      commands.forEach((command) => {
        if (command.type === "show_bubble" && !canShowBubble) return;
        runPetCommand(command);
      });

      if (decision.cooldownKey && canShowBubble && (decision.message || commandShowsBubble)) {
        cooldownsRef.current = {
          ...cooldownsRef.current,
          [decision.cooldownKey]: now
        };
      }

      previousUserStateRef.current = decision.userState;
    },
    [runPetCommand]
  );

  const handleSignal = useCallback(
    (signal: EmotionSignal) => {
      const nextSignals = [...signalsRef.current, signal].slice(-MAX_SIGNAL_HISTORY);
      signalsRef.current = nextSignals;

      const decision = decideFromSignals({
        signals: nextSignals,
        settings: settingsRef.current,
        cooldowns: cooldownsRef.current,
        previousUserState: previousUserStateRef.current,
        now: signal.timestamp
      });

      applyDecision(decision, signal.timestamp);
    },
    [applyDecision]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      const result = await window.appApi.settings.get();
      if (!cancelled && result.ok) {
        settingsRef.current = {
          cameraEnabled: result.data.cameraEnabled,
          emotionEnabled: result.data.emotionEnabled,
          reminderLevel: result.data.reminderLevel,
          focusMode: result.data.focusMode
        };
        void window.appApi.windows.setPetAlwaysOnTop(result.data.petAlwaysOnTop);
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    function bindProvider(provider: EmotionProvider) {
      unsubscribeRef.current?.();
      providerRef.current = provider;
      unsubscribeRef.current = provider.subscribe(handleSignal);
    }

    async function startMockProvider(reason?: string) {
      const mockProvider = new MockEmotionProvider({ onStatusChange: setStatus });
      mockProvider.setSamplingMode("normal");
      bindProvider(mockProvider);
      setSource("mock");
      await mockProvider.start();

      if (!cancelled && reason) {
        runPetCommand({
          type: "show_bubble",
          message: reason,
          reason: "camera_fallback"
        });
      }
    }

    async function startCameraProvider() {
      if (!videoRef.current || !settingsRef.current.cameraEnabled || !settingsRef.current.emotionEnabled) {
        await startMockProvider("识别暂时关闭，我先安静陪着。");
        return;
      }

      const cameraProvider = new BrowserEmotionProvider({
        videoElement: videoRef.current,
        onStatusChange: setStatus,
        onError: () => undefined
      });
      cameraProvider.setSamplingMode("normal");
      bindProvider(cameraProvider);
      setSource("camera");

      try {
        await cameraProvider.start();
      } catch {
        await cameraProvider.stop();
        if (!cancelled) {
          await startMockProvider("摄像头暂不可用，我先用普通陪伴模式。");
        }
      }
    }

    void startCameraProvider();

    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      void providerRef.current?.stop();
      providerRef.current = null;
    };
  }, [handleSignal, runPetCommand]);

  const statusTone = STATUS_TONE[status] ?? "quiet";

  return (
    <main className="pet-window" aria-label="桌面陪伴精灵">
      <video className="pet-camera-feed" ref={videoRef} muted playsInline aria-hidden="true" />
      <div className="pet-window-stage">
        <div className={`pet-status-strip pet-status-strip-${statusTone}`} aria-live="polite">
          <span className="pet-status-dot" aria-hidden="true" />
          <span>{STATUS_TEXT[status]}</span>
          {source === "mock" && <small>本地演示</small>}
        </div>

        <PetView
          state={runtime.state}
          message={runtime.message}
          affinity={runtime.affinity}
          energy={runtime.energy}
          onClickPet={() => undefined}
          onOpenTasks={() => void openPanel("tasks")}
          onOpenGame={() => void openPanel("game")}
          onOpenChat={() => void openPanel("chat")}
          onOpenSettings={() => void openPanel("settings")}
          onDismissBubble={dismissBubble}
          onBubblePrimaryAction={() => void openPanel("game")}
          onBubbleSecondaryAction={dismissBubble}
        />
      </div>
    </main>
  );
}
