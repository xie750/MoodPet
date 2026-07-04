import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const video = document.getElementById("video");
const output = document.getElementById("output");
const statusEl = document.getElementById("status");

let stream = null;
let landmarker = null;
let timer = null;
let lastSignal = null;

function setStatus(message) {
  statusEl.textContent = message;
}

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

async function createLandmarker() {
  try {
    const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    return await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/mediapipe/face_landmarker.task",
        delegate: "GPU"
      },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
      numFaces: 1
    });
  } catch (error) {
    console.warn("MediaPipe resource unavailable, fallback to mock signal.", error);
    return null;
  }
}

function mockSignal() {
  const now = Date.now();
  const wave = (Math.sin(now / 1200) + 1) / 2;
  return {
    facePresent: Boolean(stream),
    smileScore: clamp(0.2 + wave * 0.6),
    eyeClosedScore: clamp(0.15 + (1 - wave) * 0.2),
    headDownScore: clamp(0.1 + (1 - wave) * 0.15),
    activityScore: clamp(0.35 + wave * 0.5),
    timestamp: now,
    source: "mock"
  };
}

function extractScore(categories, names) {
  const found = categories.find((category) => names.includes(category.categoryName));
  return found ? clamp(found.score) : 0;
}

function toEmotionSignal(result) {
  const facePresent = result.faceLandmarks.length > 0;
  const categories = result.faceBlendshapes[0]?.categories ?? [];
  const smileScore = Math.max(
    extractScore(categories, ["mouthSmileLeft"]),
    extractScore(categories, ["mouthSmileRight"])
  );
  const eyeClosedScore = Math.max(
    extractScore(categories, ["eyeBlinkLeft"]),
    extractScore(categories, ["eyeBlinkRight"])
  );

  return {
    facePresent,
    smileScore,
    eyeClosedScore,
    headDownScore: 0,
    activityScore: facePresent ? clamp(smileScore + 0.2) : 0,
    timestamp: Date.now(),
    source: "face_landmarker"
  };
}

function render(signal) {
  lastSignal = signal;
  output.textContent = JSON.stringify(signal, null, 2);
}

async function sample() {
  if (!stream || video.readyState < 2) {
    render(mockSignal());
    return;
  }

  if (!landmarker) {
    render(mockSignal());
    return;
  }

  const result = landmarker.detectForVideo(video, performance.now());
  render(toEmotionSignal(result));
}

async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 },
    audio: false
  });
  video.srcObject = stream;
  landmarker = await createLandmarker();
  setStatus(landmarker ? "camera + mediapipe running" : "camera running, mock signal fallback");
  timer = window.setInterval(sample, 1000);
}

function stopCamera() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  video.srcObject = null;
  setStatus("stopped");
  render({
    ...lastSignal,
    facePresent: false,
    timestamp: Date.now(),
    source: "stopped"
  });
}

document.getElementById("start").addEventListener("click", () => {
  startCamera().catch((error) => {
    setStatus(`camera failed: ${error.message}`);
  });
});

document.getElementById("stop").addEventListener("click", stopCamera);

