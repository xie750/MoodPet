import math
import queue
import threading
import time
import urllib.request
from pathlib import Path
from typing import Dict, Optional

import cv2
import numpy as np

from moodpet.emotion import FERPLUS_LABELS, EmotionState, best_ferplus_emotion, build_emotion_state


MODEL_URL = (
    "https://github.com/spmallick/learnopencv/raw/master/"
    "Facial-Emotion-Recognition/emotion-ferplus-8.onnx"
)


def softmax(values: np.ndarray) -> np.ndarray:
    flattened = values.astype("float32").reshape(-1)
    shifted = flattened - np.max(flattened)
    exp_values = np.exp(shifted)
    return exp_values / np.sum(exp_values)


def output_to_scores(output: np.ndarray) -> Dict[str, float]:
    probabilities = softmax(output)
    usable_count = min(len(FERPLUS_LABELS), len(probabilities))
    return {
        FERPLUS_LABELS[index]: float(probabilities[index])
        for index in range(usable_count)
        if math.isfinite(float(probabilities[index]))
    }


def ensure_model(model_path: Path) -> None:
    model_path.parent.mkdir(parents=True, exist_ok=True)
    if model_path.exists() and model_path.stat().st_size > 0:
        return
    urllib.request.urlretrieve(MODEL_URL, model_path)


class EmotionCameraWorker:
    def __init__(
        self,
        output_queue: "queue.Queue[EmotionState]",
        model_path: Path,
        camera_index: int = 0,
        interval_seconds: float = 2.5,
    ) -> None:
        self.output_queue = output_queue
        self.model_path = model_path
        self.camera_index = camera_index
        self.interval_seconds = interval_seconds
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

    @property
    def running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def start(self) -> None:
        if self.running:
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, name="MoodPetEmotionCamera", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2)

    def _publish(self, state: EmotionState) -> None:
        try:
            self.output_queue.put_nowait(state)
        except queue.Full:
            try:
                self.output_queue.get_nowait()
            except queue.Empty:
                pass
            self.output_queue.put_nowait(state)

    def _run(self) -> None:
        try:
            ensure_model(self.model_path)
            net = cv2.dnn.readNetFromONNX(str(self.model_path))
            cascade_path = Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml"
            face_detector = cv2.CascadeClassifier(str(cascade_path))
            if face_detector.empty():
                self._publish(build_emotion_state("error", message="未找到 OpenCV 人脸检测器。"))
                return

            camera = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW)
            if not camera.isOpened():
                camera = cv2.VideoCapture(self.camera_index)
            if not camera.isOpened():
                self._publish(build_emotion_state("error", message="无法打开摄像头。"))
                return

            try:
                self._capture_loop(camera, face_detector, net)
            finally:
                camera.release()
        except Exception as exc:
            self._publish(build_emotion_state("error", message=f"情绪识别异常：{exc}"))

    def _capture_loop(
        self,
        camera: cv2.VideoCapture,
        face_detector: cv2.CascadeClassifier,
        net: cv2.dnn_Net,
    ) -> None:
        while not self._stop_event.is_set():
            ok, frame = camera.read()
            if not ok or frame is None:
                self._publish(build_emotion_state("error", message="读取摄像头画面失败。"))
                time.sleep(self.interval_seconds)
                continue

            state = self._analyze_frame(frame, face_detector, net)
            self._publish(state)
            time.sleep(self.interval_seconds)

    def _analyze_frame(
        self,
        frame: np.ndarray,
        face_detector: cv2.CascadeClassifier,
        net: cv2.dnn_Net,
    ) -> EmotionState:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_detector.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(80, 80),
        )
        if len(faces) == 0:
            return build_emotion_state("away", 0.0, face_detected=False)

        x, y, w, h = max(faces, key=lambda face: face[2] * face[3])
        face = gray[y : y + h, x : x + w]
        face = cv2.resize(face, (64, 64))
        blob = cv2.dnn.blobFromImage(face, scalefactor=1.0, size=(64, 64), mean=(0,), swapRB=False)
        net.setInput(blob)
        output = net.forward()
        scores = output_to_scores(output)
        return best_ferplus_emotion(scores)
