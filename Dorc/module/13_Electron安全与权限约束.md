# Electron 安全与权限约束

## 1. 文档目的

本文件用于约束 Electron 主进程、preload、渲染进程、IPC、摄像头权限和本地数据访问的安全边界。

本产品涉及摄像头、情绪识别、本地数据和桌面悬浮窗口。安全策略必须在开发初期固定，不能等功能完成后再补。

## 2. 安全基线

所有 BrowserWindow 默认必须使用：

```ts
webPreferences: {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  preload: preloadPath
}
```

禁止：

1. `nodeIntegration: true`
2. 在渲染进程暴露 `require`
3. 在渲染进程暴露完整 `ipcRenderer`
4. 在渲染进程直接访问 SQLite
5. 使用远程 URL 加载核心应用页面
6. 把摄像头图像保存到磁盘

## 3. 窗口安全策略

### 3.1 宠物窗口

宠物窗口特点：

1. 透明。
2. 无边框。
3. 置顶。
4. 小尺寸。
5. 低权限。

宠物窗口允许：

1. 渲染宠物动画。
2. 展示气泡。
3. 响应点击、拖动、快捷菜单。
4. 调用宠物相关白名单 API。

宠物窗口禁止：

1. 访问摄像头。
2. 初始化 MediaPipe。
3. 直接读取任务列表。
4. 直接写数据库。

### 3.2 主面板窗口

主面板窗口允许：

1. 展示任务、聊天、游戏、设置。
2. 发起摄像头授权。
3. 运行 MediaPipe。
4. 调用白名单 IPC。

主面板窗口禁止：

1. 直接访问 Node API。
2. 绕过 preload。
3. 任意打开外部链接。

### 3.3 小游戏窗口

小游戏窗口允许：

1. 初始化 Phaser。
2. 读取内存中的 `smileScore`。
3. 发布游戏事件。
4. 写入游戏结果。

小游戏窗口禁止：

1. 持久保存原始摄像头帧。
2. 直接修改宠物状态。
3. 游戏循环关闭后继续占用高频计时器。

## 4. Preload API 白名单

全局只允许暴露：

```ts
window.appApi
```

推荐结构：

```ts
window.appApi = {
  settings: {
    get(),
    update(patch)
  },
  tasks: {
    listToday(),
    create(input),
    update(id, patch),
    complete(id),
    delete(id)
  },
  pet: {
    getProfile(),
    applyCommand(command)
  },
  games: {
    createRecord(record),
    listRecent()
  },
  events: {
    create(event),
    listRecent()
  },
  windows: {
    openPanel(route),
    setPetAlwaysOnTop(enabled)
  }
}
```

preload 不得暴露：

1. `ipcRenderer`
2. `shell`
3. `fs`
4. `path`
5. `process`
6. 任意动态 channel 调用函数

禁止设计：

```ts
window.appApi.invoke(channel, payload)
```

原因：动态 channel 会绕过 IPC 白名单和参数校验。

## 5. IPC Channel 约束

命名规则：

```text
domain:action
```

示例：

```text
settings:get
settings:update
tasks:listToday
tasks:create
tasks:update
tasks:complete
tasks:delete
pet:getProfile
pet:applyCommand
games:createRecord
games:listRecent
events:create
events:listRecent
windows:openPanel
windows:setPetAlwaysOnTop
```

每个 IPC handler 必须：

1. 校验入参。
2. 返回结构化结果。
3. 捕获异常。
4. 不泄漏内部错误堆栈给 UI。
5. 不执行调用方传入的函数或代码字符串。

推荐返回结构：

```ts
type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
```

## 6. 参数校验

MVP 可以先使用手写类型守卫。后续如规则变复杂，可以引入 schema 校验库。

必须校验：

1. `taskId` 是否为字符串。
2. `title` 是否为空、是否超过长度。
3. `PetCommand.type` 是否属于白名单。
4. `PanelRoute` 是否属于白名单。
5. `AppSettings` patch 是否只包含允许字段。
6. `gameRecord.duration`、`score` 是否为非负数。

禁止信任：

1. 渲染进程传来的对象原型。
2. JSON payload 中的任意嵌套字段。
3. 前端隐藏字段。

## 7. 摄像头权限约束

摄像头只允许在用户明确同意后启用。

首次使用流程必须包含：

1. 隐私说明页。
2. 摄像头用途说明。
3. 本地识别说明。
4. 默认不保存图像说明。
5. 用户主动点击授权按钮。

摄像头状态必须可见：

1. 设置页展示是否启用。
2. 情绪识别运行时有明确状态。
3. 关闭后立即停止 stream tracks。

关闭摄像头时必须执行：

```ts
stream.getTracks().forEach((track) => track.stop());
```

禁止：

1. 应用启动后静默开启摄像头。
2. 后台偷偷恢复摄像头。
3. 关闭设置后继续推理。
4. 保存 video/canvas 截图。

## 8. MediaPipe 资源策略

MediaPipe 模型资源必须来自本地打包资源或受控的官方资源镜像。

MVP 推荐：

```text
app/public/mediapipe/
```

开发环境允许从本地 public 加载。

生产环境必须验证：

1. wasm 路径可解析。
2. task/model 文件已打包。
3. 离线状态下基础应用仍可启动。
4. MediaPipe 加载失败不影响任务、聊天、普通桌宠模式。

## 9. 外部链接策略

默认禁止在应用内部打开未知 URL。

如需要打开隐私说明或项目主页：

1. 必须使用固定白名单 URL。
2. 使用系统浏览器打开。
3. 不在 Electron WebView 中加载。

MVP 不使用：

```text
webview
```

## 10. CSP 约束

生产环境必须配置 Content-Security-Policy。

推荐基础策略：

```text
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
media-src 'self' blob:;
connect-src 'self';
worker-src 'self' blob:;
```

如果后续接入大模型 API，必须显式加入对应 `connect-src`，不能使用通配符。

## 11. 本地数据安全

SQLite 数据保存在用户应用数据目录。

默认允许保存：

1. 任务。
2. 设置。
3. 宠物成长数据。
4. 游戏记录。
5. 情绪摘要。
6. 关键事件日志。

默认禁止保存：

1. 原始人脸图片。
2. 摄像头视频。
3. 单帧截图。
4. 可识别身份的图像特征。
5. 未经用户确认的大模型对话上传内容。

## 12. 日志约束

日志可以记录：

1. 应用启动和关闭。
2. 窗口创建失败。
3. SQLite 初始化失败。
4. MediaPipe 加载失败。
5. IPC 参数校验失败。

日志禁止记录：

1. 原始用户聊天全文，除非用户开启调试模式。
2. 摄像头图像。
3. 人脸关键点完整数组。
4. API Key。
5. 系统路径中的敏感信息。

## 13. 安全验收

每次安全相关改动必须检查：

1. 所有窗口 `contextIsolation` 为 true。
2. 所有窗口 `nodeIntegration` 为 false。
3. preload 未暴露原始 Electron / Node 能力。
4. IPC channel 无动态 invoke。
5. 摄像头关闭后 stream 被释放。
6. SQLite 只能由主进程访问。
7. MediaPipe 失败时应用可降级运行。
8. 不保存原始图片或视频。

