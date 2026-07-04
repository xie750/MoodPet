import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Phaser from "phaser";
import type { EmotionSignal, UserState } from "../../shared/types";
import {
  calculateEnergyDelta,
  createGameFinishedEvent,
  createGameStartedEvent,
  createMockSmileGameServices,
  createSmileGameRecord,
  getSmileGameConfig,
  getSmileGameFeedback,
  normalizeEmotionSignal,
  SMILE_GAME_SIGNAL_GRACE_MS,
  type SmileEnergySnapshot,
  type SmileGameRecord,
  type SmileGameResult,
  type SmileGameServices,
  type SmileGameState
} from "../../features/games/smile-energy";
import { SmileEnergyScene } from "./SmileEnergyScene";
import "./SmileEnergyGame.css";

type PauseReason = "manual" | "away";

type SmileEnergyGameProps = {
  initialUserState?: UserState;
  services?: SmileGameServices;
  allowStateControls?: boolean;
  onFinished?: (record: SmileGameRecord) => void;
};

const USER_STATE_OPTIONS: Array<{ value: UserState; label: string }> = [
  { value: "happy", label: "活力" },
  { value: "calm", label: "安静" },
  { value: "tired", label: "轻一点" },
  { value: "away", label: "等待" }
];

function createInitialSnapshot(userState: UserState): SmileEnergySnapshot {
  const config = getSmileGameConfig(userState);
  return {
    state: "ready",
    userState,
    energy: 0,
    targetEnergy: config.targetEnergy,
    elapsedSeconds: 0,
    maxSeconds: config.maxSeconds,
    smileScore: 0,
    facePresent: true,
    result: null
  };
}

export function SmileEnergyGame({
  initialUserState = "calm",
  services,
  allowStateControls = true,
  onFinished
}: SmileEnergyGameProps) {
  const gameServices = useMemo(() => services ?? createMockSmileGameServices(), [services]);
  const [userState, setUserState] = useState<UserState>(initialUserState);
  const [snapshot, setSnapshot] = useState<SmileEnergySnapshot>(() => createInitialSnapshot(initialUserState));
  const [record, setRecord] = useState<SmileGameRecord | null>(null);
  const [pauseReason, setPauseReason] = useState<PauseReason | null>(null);
  const [cameraMode, setCameraMode] = useState(true);
  const gameHostRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<SmileEnergyScene | null>(null);
  const frameRef = useRef<number | null>(null);
  const latestSignalRef = useRef<EmotionSignal | null>(gameServices.emotionReader.getLatestSignal());
  const lastSignalAtRef = useRef(0);
  const phaseRef = useRef<SmileGameState>("ready");
  const userStateRef = useRef<UserState>(initialUserState);
  const cameraModeRef = useRef(true);
  const energyRef = useRef(0);
  const elapsedRef = useRef(0);
  const lastFrameAtRef = useRef(0);
  const finishedRef = useRef(false);

  const config = getSmileGameConfig(userState);
  const energyPercent = Math.min(100, Math.round((snapshot.energy / Math.max(1, snapshot.targetEnergy)) * 100));
  const secondsLeft = Math.max(0, Math.ceil(snapshot.maxSeconds - snapshot.elapsedSeconds));
  const feedback = record ? getSmileGameFeedback(record.result) : null;

  const updateSnapshot = useCallback((patch: Partial<SmileEnergySnapshot>) => {
    setSnapshot((current) => {
      const next = { ...current, ...patch };
      sceneRef.current?.setSnapshot(next);
      return next;
    });
  }, []);

  const finishGame = useCallback(
    (result: SmileGameResult) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      phaseRef.current = result === "success" ? "success" : result === "quit" ? "quit" : "finished";

      const activeConfig = getSmileGameConfig(userStateRef.current);
      const score = Math.min(100, (energyRef.current / Math.max(1, activeConfig.targetEnergy)) * 100);
      const nextRecord = createSmileGameRecord({
        result,
        score,
        duration: elapsedRef.current,
        reward: result === "quit" ? "无奖励" : activeConfig.rewardText
      });

      setRecord(nextRecord);
      updateSnapshot({
        state: phaseRef.current,
        result,
        energy: energyRef.current,
        elapsedSeconds: elapsedRef.current
      });

      void Promise.resolve(gameServices.recordWriter.write(nextRecord))
        .then(() => gameServices.eventPublisher.publish(createGameFinishedEvent(nextRecord)))
        .then(() => onFinished?.(nextRecord))
        .catch((error: unknown) => {
          console.error("[smile-energy] failed to finish game", error);
        });
    },
    [gameServices, onFinished, updateSnapshot]
  );

  const tick = useCallback(
    (frameTime: number) => {
      const scheduleNext = () => {
        frameRef.current = window.requestAnimationFrame(tick);
      };

      if (phaseRef.current !== "playing") {
        scheduleNext();
        return;
      }

      const deltaMs = Math.min(250, Math.max(0, frameTime - lastFrameAtRef.current));
      lastFrameAtRef.current = frameTime;
      const currentUserState = userStateRef.current;
      const currentConfig = getSmileGameConfig(currentUserState);
      const signal = latestSignalRef.current;
      const facePresent = cameraModeRef.current ? signal?.facePresent !== false : true;

      if (currentUserState === "away" || !facePresent) {
        phaseRef.current = "paused";
        setPauseReason("away");
        updateSnapshot({ state: "paused", facePresent: false });
        scheduleNext();
        return;
      }

      const hasFreshSignal = !cameraModeRef.current || Date.now() - lastSignalAtRef.current <= SMILE_GAME_SIGNAL_GRACE_MS;
      const smileScore = cameraModeRef.current ? signal?.smileScore ?? 0 : 0.35;
      const deltaEnergy = calculateEnergyDelta({
        elapsedSeconds: deltaMs / 1_000,
        smileScore,
        userState: currentUserState,
        hasFreshSignal
      });

      energyRef.current = Math.min(currentConfig.targetEnergy, energyRef.current + deltaEnergy);
      elapsedRef.current += deltaMs / 1_000;

      updateSnapshot({
        state: "playing",
        userState: currentUserState,
        energy: energyRef.current,
        targetEnergy: currentConfig.targetEnergy,
        elapsedSeconds: elapsedRef.current,
        maxSeconds: currentConfig.maxSeconds,
        smileScore,
        facePresent: true
      });

      if (energyRef.current >= currentConfig.targetEnergy) {
        finishGame("success");
      } else if (elapsedRef.current >= currentConfig.maxSeconds) {
        finishGame("normal");
      }

      scheduleNext();
    },
    [finishGame, updateSnapshot]
  );

  const startGame = useCallback(
    (withCamera: boolean) => {
      const activeConfig = getSmileGameConfig(userStateRef.current);
      finishedRef.current = false;
      phaseRef.current = "playing";
      cameraModeRef.current = withCamera;
      energyRef.current = 0;
      elapsedRef.current = 0;
      lastFrameAtRef.current = performance.now();
      setCameraMode(withCamera);
      setPauseReason(null);
      setRecord(null);
      updateSnapshot({
        state: "playing",
        result: null,
        energy: 0,
        targetEnergy: activeConfig.targetEnergy,
        elapsedSeconds: 0,
        maxSeconds: activeConfig.maxSeconds,
        smileScore: withCamera ? latestSignalRef.current?.smileScore ?? 0 : 0.35,
        facePresent: true,
        userState: userStateRef.current
      });
      void Promise.resolve(gameServices.eventPublisher.publish(createGameStartedEvent())).catch((error: unknown) => {
        console.error("[smile-energy] failed to publish start event", error);
      });
    },
    [gameServices.eventPublisher, updateSnapshot]
  );

  const pauseGame = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    phaseRef.current = "paused";
    setPauseReason("manual");
    updateSnapshot({ state: "paused" });
  }, [updateSnapshot]);

  const resumeGame = useCallback(() => {
    if (phaseRef.current !== "paused") return;
    if (pauseReason === "away" && userStateRef.current === "away") return;
    phaseRef.current = "playing";
    lastFrameAtRef.current = performance.now();
    setPauseReason(null);
    updateSnapshot({ state: "playing", facePresent: true });
  }, [pauseReason, updateSnapshot]);

  const quitGame = useCallback(() => {
    finishGame("quit");
  }, [finishGame]);

  const resetGame = useCallback(() => {
    finishedRef.current = false;
    phaseRef.current = "ready";
    energyRef.current = 0;
    elapsedRef.current = 0;
    setRecord(null);
    setPauseReason(null);
    updateSnapshot(createInitialSnapshot(userStateRef.current));
  }, [updateSnapshot]);

  useEffect(() => {
    userStateRef.current = userState;
    const nextConfig = getSmileGameConfig(userState);
    updateSnapshot({
      userState,
      targetEnergy: nextConfig.targetEnergy,
      maxSeconds: nextConfig.maxSeconds
    });
    if (phaseRef.current === "paused" && pauseReason === "away" && userState !== "away") {
      resumeGame();
    }
  }, [pauseReason, resumeGame, updateSnapshot, userState]);

  useEffect(() => {
    const unsubscribe = gameServices.emotionReader.subscribe((signal) => {
      const normalized = normalizeEmotionSignal(signal);
      latestSignalRef.current = normalized;
      lastSignalAtRef.current = Date.now();

      if (phaseRef.current === "paused" && pauseReason === "away" && normalized.facePresent) {
        resumeGame();
      }

      updateSnapshot({
        smileScore: normalized.smileScore,
        facePresent: normalized.facePresent
      });
    });

    return unsubscribe;
  }, [gameServices.emotionReader, pauseReason, resumeGame, updateSnapshot]);

  useEffect(() => {
    const host = gameHostRef.current;
    if (!host) return undefined;

    const scene = new SmileEnergyScene();
    sceneRef.current = scene;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 520,
      height: 260,
      parent: host,
      backgroundColor: "#F7FAF8",
      transparent: false,
      scene,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    });
    phaserGameRef.current = game;

    return () => {
      game.destroy(true);
      phaserGameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    frameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [tick]);

  return (
    <section className="smile-game" aria-label="微笑能量小游戏">
      <div className="smile-game__header">
        <div>
          <p className="smile-game__eyebrow">陪我玩</p>
          <h1>微笑能量</h1>
        </div>
        <div className="smile-game__timer" aria-label={`剩余 ${secondsLeft} 秒`}>
          {secondsLeft.toString().padStart(2, "0")}s
        </div>
      </div>

      {allowStateControls && (
        <div className="smile-game__segments" aria-label="模拟陪伴模式">
          {USER_STATE_OPTIONS.map((option) => (
            <button
              className={userState === option.value ? "is-active" : ""}
              type="button"
              key={option.value}
              onClick={() => setUserState(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      <div className="smile-game__stage" ref={gameHostRef} aria-hidden="true" />

      <div className="smile-game__meter" aria-label={`能量 ${energyPercent}%`}>
        <div className="smile-game__meter-label">
          <span>能量</span>
          <strong>{energyPercent}%</strong>
        </div>
        <div className="smile-game__meter-track">
          <span style={{ width: `${energyPercent}%` }} />
        </div>
      </div>

      <div className="smile-game__status" role="status" aria-live="polite">
        {snapshot.state === "ready" && (
          <>
            <strong>和小精灵一起收集一点能量。</strong>
            <span>本局约 {config.maxSeconds} 秒，摄像头只用于读取本地状态信号。</span>
          </>
        )}
        {snapshot.state === "playing" && (
          <>
            <strong>{cameraMode ? "能量正在慢慢回来" : "普通模式进行中"}</strong>
            <span>目标 {config.targetEnergy}，有一点点就很好。</span>
          </>
        )}
        {snapshot.state === "paused" && (
          <>
            <strong>{pauseReason === "away" ? "我等你回来。" : "我先等一下。"}</strong>
            <span>{pauseReason === "away" ? "回到摄像头前会继续。" : "准备好了再继续。"}</span>
          </>
        )}
        {(snapshot.state === "success" || snapshot.state === "finished" || snapshot.state === "quit") && feedback && (
          <>
            <strong>{feedback}</strong>
            <span>{record?.reward}</span>
          </>
        )}
      </div>

      <div className="smile-game__actions">
        {snapshot.state === "ready" && (
          <>
            <button className="smile-game__primary" type="button" onClick={() => startGame(true)}>
              开始
            </button>
            <button type="button" onClick={() => startGame(false)}>
              普通模式
            </button>
          </>
        )}
        {snapshot.state === "playing" && (
          <>
            <button type="button" onClick={pauseGame}>
              暂停
            </button>
            <button type="button" onClick={quitGame}>
              退出
            </button>
          </>
        )}
        {snapshot.state === "paused" && (
          <>
            <button className="smile-game__primary" type="button" onClick={resumeGame} disabled={pauseReason === "away" && userState === "away"}>
              继续
            </button>
            <button type="button" onClick={quitGame}>
              退出本局
            </button>
          </>
        )}
        {(snapshot.state === "success" || snapshot.state === "finished" || snapshot.state === "quit") && (
          <button className="smile-game__primary" type="button" onClick={resetGame}>
            再玩一局
          </button>
        )}
      </div>
    </section>
  );
}
