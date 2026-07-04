# PoC 03 - SQLite 与 IPC

## 验证目标

验证：

1. SQLite 只在 Electron 主进程访问。
2. preload 暴露白名单 API。
3. 渲染进程通过 IPC 完成任务 CRUD。
4. 数据库可重复初始化。

## 运行

```bash
npm install
npm start
```

数据库位置：

```text
.local/dev.db
```

## 验收

1. 启动后自动初始化数据库。
2. 可以创建任务。
3. 可以完成任务。
4. 关闭重启后任务仍存在。
5. DevTools 中不能直接访问 SQLite。

