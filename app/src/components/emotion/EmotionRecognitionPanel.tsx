import { useEffect, useMemo, useRef, useState } from "react";
import type { EmotionSignal } from "../../shared/types";
import {
  BrowserEmotionProvider,
  MockEmotionProvider,
  type EmotionProvider,
  type EmotionProviderStatus,
  type EmotionSamplingMode
} from "../../features/emotion";
import "./EmotionRecognitionPanel.css";

type EmotionRecognitionPanelProps = {
  defaultSource?: "mock" | "camera";
  onSignal?: (signal: EmotionSignal) => void;
};

const SAMPLING_LABELS: Record<EmotionSamplingMode, string> = {
  normal: "常规",
  game: "游戏",
  low_power: "低频"
};

const STATUS_LABELS: Record<EmotionProviderStatus, string> = {
  idle: "未启动",
  requesting_permission: "请求授权中",
  camera_ready: "摄像头已就绪",
  recognizing: "本地识别中",
  mock: "Mock 展示中",
  permission_denied: "未授权",
  camera_unavailable: "摄像头不可用",
  model_unavailable: "识别模型不可用",
  stopped: "已停止"
};

export function EmotionRecognitionPanel({ defaultSource = "mock", onSignal }: EmotionRecognitionPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const providerRef = useRef<EmotionProvider | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [source, setSource] = useState<"mock" | "camera">(defaultSource);
  const [status, setStatus] = useState<EmotionProviderStatus>("idle");
  const [samplingMode, setSamplingMode] = useState<EmotionSamplingMode>("normal");
  const [signal, setSignal] = useState<EmotionSignal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running = status === "recognizing" || status === "mock" || status === "camera_ready" || status === "requesting_permission";

  const displaySignal = useMemo<EmotionSignal>(
    () =>
      signal ?? {
        facePresent: false,
        smileScore: 0,
        eyeClosedScore: 0,
        headDownScore: 0,
        activityScore: 0,
        timestamp: Date.now()
      },
    [signal]
  );

  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
      providerRef.current?.stop();
    };
  }, []);

  function createProvider(nextSource: "mock" | "camera"): EmotionProvider {
    if (nextSource === "camera") {
      if (!videoRef.current) {
        throw new Error("摄像头预览尚未准备好。");
      }

      return new BrowserEmotionProvider({
        videoElement: videoRef.current,
        onStatusChange: setStatus,
        onError: (nextError) => setError(nextError.message)
      });
    }

    return new MockEmotionProvider({
      onStatusChange: setStatus,
      onError: (nextError) => setError(nextError.message)
    });
  }

  async function start(nextSource = source): Promise<void> {
    setError(null);
    unsubscribeRef.current?.();
    await providerRef.current?.stop();

    const provider = createProvider(nextSource);
    provider.setSamplingMode(samplingMode);
    unsubscribeRef.current = provider.subscribe((nextSignal) => {
      setSignal(nextSignal);
      onSignal?.(nextSignal);
    });
    providerRef.current = provider;

    try {
      await provider.start();
    } catch {
      if (nextSource === "camera") {
        setSource("mock");
        const mockProvider = createProvider("mock");
        mockProvider.setSamplingMode(samplingMode);
        unsubscribeRef.current = mockProvider.subscribe((nextSignal) => {
          setSignal(nextSignal);
          onSignal?.(nextSignal);
        });
        providerRef.current = mockProvider;
        await mockProvider.start();
      }
    }
  }

  async function stop(): Promise<void> {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    await providerRef.current?.stop();
    providerRef.current = null;
  }

  function changeSamplingMode(nextMode: EmotionSamplingMode): void {
    setSamplingMode(nextMode);
    providerRef.current?.setSamplingMode(nextMode);
  }

  return (
    <section className="emotion-panel" aria-label="情绪识别模块">
      <div className="emotion-panel__header">
        <div>
          <h1 className="emotion-panel__title">情绪识别模块</h1>
          <p className="emotion-panel__subtitle">
            只输出本地 EmotionSignal，不判断心理状态，不保存图片或视频。摄像头需要用户主动点击后才会开启。
          </p>
        </div>
        <div className="emotion-panel__status" aria-live="polite">
          {STATUS_LABELS[status]}
        </div>
      </div>

      <div className="emotion-panel__body">
        <div className="emotion-panel__preview">
          {source === "camera" ? (
            <video className="emotion-panel__video" ref={videoRef} aria-label="本地摄像头预览" />
          ) : (
            <div className="emotion-panel__mock-view" aria-label="Mock 信号预览">
              <div className="emotion-panel__face" />
            </div>
          )}
          <p className="emotion-panel__caption">
            {source === "camera" ? "本地预览仅用于识别，不会写入磁盘。" : "Mock 模式可单独展示 happy / tired / away 信号变化。"}
          </p>
          <div className="emotion-panel__controls">
            <button className="emotion-panel__button" type="button" onClick={() => start(source)} disabled={running}>
              开始
            </button>
            <button className="emotion-panel__button secondary" type="button" onClick={stop} disabled={!running}>
              停止
            </button>
            <button
              className="emotion-panel__button secondary"
              type="button"
              onClick={() => {
                const nextSource = source === "mock" ? "camera" : "mock";
                setSource(nextSource);
                setSignal(null);
              }}
              disabled={running}
            >
              {source === "mock" ? "切到摄像头" : "切到 Mock"}
            </button>
          </div>
        </div>

        <div className="emotion-panel__readout">
          <div className="emotion-panel__segments" role="group" aria-label="采样模式">
            {(["normal", "game", "low_power"] as EmotionSamplingMode[]).map((mode) => (
              <button
                className={`emotion-panel__segment ${samplingMode === mode ? "active" : ""}`}
                type="button"
                onClick={() => changeSamplingMode(mode)}
                aria-pressed={samplingMode === mode}
                key={mode}
              >
                {SAMPLING_LABELS[mode]}
              </button>
            ))}
          </div>

          <div className="emotion-panel__bars">
            <SignalRow label="人脸" value={displaySignal.facePresent ? 1 : 0} text={displaySignal.facePresent ? "有" : "无"} />
            <SignalRow label="微笑" value={displaySignal.smileScore} tone="reward" />
            <SignalRow label="眼部闭合" value={displaySignal.eyeClosedScore} />
            <SignalRow label="低头趋势" value={displaySignal.headDownScore} />
            <SignalRow label="活跃度" value={displaySignal.activityScore} tone="secondary" />
          </div>

          <pre className="emotion-panel__signal-json">
            {JSON.stringify(
              {
                facePresent: displaySignal.facePresent,
                smileScore: round(displaySignal.smileScore),
                eyeClosedScore: round(displaySignal.eyeClosedScore),
                headDownScore: round(displaySignal.headDownScore),
                activityScore: round(displaySignal.activityScore),
                timestamp: displaySignal.timestamp
              },
              null,
              2
            )}
          </pre>

          {error && <p className="emotion-panel__notice">{error} 已回退到 Mock 展示，普通桌宠模式仍可继续使用。</p>}
        </div>
      </div>
    </section>
  );
}

function SignalRow({ label, value, text, tone }: { label: string; value: number; text?: string; tone?: "secondary" | "reward" }) {
  const percent = Math.round(value * 100);
  return (
    <div className="emotion-panel__bar-row">
      <span>{label}</span>
      <div className="emotion-panel__meter" aria-label={`${label} ${text ?? `${percent}%`}`}>
        <div className={`emotion-panel__meter-fill ${tone ?? ""}`} style={{ width: `${percent}%` }} />
      </div>
      <span>{text ?? `${percent}%`}</span>
    </div>
  );
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
