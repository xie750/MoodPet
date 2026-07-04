# PoC 01 - Electron 透明桌宠窗口

## 验证目标

验证 Electron 是否能稳定实现：

1. 透明无边框宠物窗口。
2. 置顶显示。
3. 拖动。
4. 右键菜单。
5. 主面板窗口打开。
6. preload 安全暴露最小 API。

## 运行

```bash
npm install
npm start
```

## 验收

1. 启动后桌面出现一个透明小窗口。
2. 可拖动宠物窗口。
3. 右键可切换状态。
4. 点击 Open Panel 可打开主面板。
5. DevTools 中不能直接访问 Node.js `require`。

