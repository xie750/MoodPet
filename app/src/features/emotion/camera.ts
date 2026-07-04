export type CameraStreamOptions = {
  width?: number;
  height?: number;
  frameRate?: number;
};

export async function requestCameraStream(options: CameraStreamOptions = {}): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("当前环境不支持摄像头访问。");
  }

  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      width: { ideal: options.width ?? 640 },
      height: { ideal: options.height ?? 480 },
      frameRate: { ideal: options.frameRate ?? 15, max: options.frameRate ?? 15 },
      facingMode: "user"
    }
  });
}

export async function attachStreamToVideo(video: HTMLVideoElement, stream: MediaStream): Promise<void> {
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
}

export function stopCameraStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}
