# PoC 02 - 摄像头与 MediaPipe

## 验证目标

验证在渲染进程中完成：

1. 摄像头授权。
2. video stream 启停。
3. MediaPipe Face Landmarker 加载。
4. `EmotionSignal` 标准化输出。
5. 模型缺失时降级为 mock signal。

## 运行

```bash
npm install
npm run dev
```

## 模型资源

将 MediaPipe 资源放入：

```text
public/mediapipe/wasm/
public/mediapipe/face_landmarker.task
```

如果资源不存在，本 PoC 会显示 mock signal，方便先验证页面和摄像头流程。

## 验收

1. 点击 Start Camera 后浏览器请求摄像头权限。
2. 点击 Stop Camera 后摄像头指示灯关闭。
3. 模型存在时输出真实 `EmotionSignal`。
4. 模型不存在时仍能输出 mock `EmotionSignal`。

