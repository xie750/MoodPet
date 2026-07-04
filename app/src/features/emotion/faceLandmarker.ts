import {
  FaceLandmarker,
  FilesetResolver,
  type Category,
  type FaceLandmarkerResult,
  type NormalizedLandmark
} from "@mediapipe/tasks-vision";
import type { EmotionSignal } from "../../shared/types";
import { clampScore, createNeutralSignal, normalizeEmotionSignal } from "./signal";

export type FaceLandmarkerConfig = {
  wasmRoot?: string;
  modelAssetPath?: string;
};

export type FaceSignalAnalyzer = {
  detect(video: HTMLVideoElement, timestamp: number): EmotionSignal;
  close(): void;
};

const DEFAULT_WASM_ROOT = "/mediapipe/wasm";
const DEFAULT_MODEL_PATH = "/mediapipe/face_landmarker.task";

export async function createFaceLandmarkerAnalyzer(config: FaceLandmarkerConfig = {}): Promise<FaceSignalAnalyzer> {
  const vision = await FilesetResolver.forVisionTasks(config.wasmRoot ?? DEFAULT_WASM_ROOT);
  const landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: config.modelAssetPath ?? DEFAULT_MODEL_PATH,
      delegate: "CPU"
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: false
  });

  return {
    detect(video, timestamp) {
      return signalFromFaceLandmarkerResult(landmarker.detectForVideo(video, timestamp), timestamp);
    },
    close() {
      landmarker.close();
    }
  };
}

export function signalFromFaceLandmarkerResult(result: FaceLandmarkerResult, timestamp = Date.now()): EmotionSignal {
  const landmarks = result.faceLandmarks[0];
  if (!landmarks) {
    return createNeutralSignal(false, timestamp);
  }

  const categories = result.faceBlendshapes[0]?.categories ?? [];
  const smileScore = averageScores(categories, ["mouthSmileLeft", "mouthSmileRight"]);
  const eyeClosedScore = averageScores(categories, ["eyeBlinkLeft", "eyeBlinkRight"]);
  const headDownScore = estimateHeadDownScore(landmarks);
  const activityScore = estimateExpressionActivity(categories);

  return normalizeEmotionSignal({
    facePresent: true,
    smileScore,
    eyeClosedScore,
    headDownScore,
    activityScore,
    timestamp
  });
}

function averageScores(categories: Category[], names: string[]): number {
  const scores = names.map((name) => scoreForCategory(categories, name));
  const sum = scores.reduce((total, score) => total + score, 0);
  return clampScore(sum / names.length);
}

function scoreForCategory(categories: Category[], name: string): number {
  return categories.find((category) => category.categoryName === name)?.score ?? 0;
}

function estimateExpressionActivity(categories: Category[]): number {
  const names = [
    "jawOpen",
    "mouthSmileLeft",
    "mouthSmileRight",
    "browOuterUpLeft",
    "browOuterUpRight",
    "eyeWideLeft",
    "eyeWideRight"
  ];
  const activeScores = names.map((name) => scoreForCategory(categories, name));
  const strongest = Math.max(0, ...activeScores);
  const average = activeScores.reduce((total, score) => total + score, 0) / names.length;
  return clampScore(strongest * 0.65 + average * 0.35);
}

function estimateHeadDownScore(landmarks: NormalizedLandmark[]): number {
  const leftEye = averageLandmarks(landmarks, [33, 133]);
  const rightEye = averageLandmarks(landmarks, [263, 362]);
  const nose = landmarks[1];
  const chin = landmarks[152];

  if (!leftEye || !rightEye || !nose || !chin) {
    return 0;
  }

  const eyeY = (leftEye.y + rightEye.y) / 2;
  const faceHeight = Math.max(0.001, chin.y - eyeY);
  const noseDropRatio = (nose.y - eyeY) / faceHeight;
  return clampScore((noseDropRatio - 0.32) / 0.28);
}

function averageLandmarks(landmarks: NormalizedLandmark[], indexes: number[]): NormalizedLandmark | null {
  const selected = indexes.map((index) => landmarks[index]).filter((point): point is NormalizedLandmark => Boolean(point));
  if (selected.length === 0) return null;

  const total = selected.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
      z: acc.z + (point.z ?? 0)
    }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: total.x / selected.length,
    y: total.y / selected.length,
    z: total.z / selected.length,
    visibility: 0
  };
}
