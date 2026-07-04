# PoC 04 - Phaser 嵌入 React

## 验证目标

验证：

1. React 页面中挂载 Phaser。
2. mock `smileScore` 驱动游戏能量增长。
3. 游戏结束回传结果。
4. 组件卸载时销毁 Phaser 实例。

## 运行

```bash
npm install
npm run dev
```

## 验收

1. 页面出现游戏画布。
2. 调高 smileScore 后能量增长变快。
3. 能量达到目标后显示 success。
4. 页面刷新不会残留多个 canvas。

