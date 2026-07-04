# 本地存储与 IPC 模块设计文档

## 1. 模块定位

本地存储与 IPC 模块负责数据持久化和主进程/渲染进程之间的安全通信。

该模块是基础设施，不应该承载复杂产品规则。产品规则放在状态决策引擎中。

本模块只提供数据读写能力，不决定“完成任务后是否庆祝”“疲惫时是否邀请游戏”等产品行为。

## 2. 技术方案

MVP 推荐：

```text
SQLite + Electron IPC + preload 安全 API
```

主进程负责数据库操作，渲染进程通过 `window.appApi` 调用。

## 3. 数据表

### 3.1 settings

```sql
id INTEGER PRIMARY KEY
camera_enabled INTEGER
emotion_enabled INTEGER
reminder_level TEXT
focus_mode INTEGER
selected_pet_id TEXT
pet_always_on_top INTEGER
launch_at_startup INTEGER
created_at INTEGER
updated_at INTEGER
```

### 3.2 tasks

```sql
id TEXT PRIMARY KEY
title TEXT NOT NULL
description TEXT
status TEXT NOT NULL
priority TEXT NOT NULL
due_at INTEGER
completed_at INTEGER
created_at INTEGER NOT NULL
updated_at INTEGER NOT NULL
```

### 3.3 pet_profile

```sql
id TEXT PRIMARY KEY
name TEXT
affinity INTEGER
energy INTEGER
current_state TEXT
created_at INTEGER
updated_at INTEGER
```

### 3.4 game_records

```sql
id TEXT PRIMARY KEY
game_type TEXT
result TEXT
score INTEGER
duration INTEGER
reward TEXT
created_at INTEGER
```

### 3.5 emotion_summaries

```sql
id TEXT PRIMARY KEY
user_state TEXT
confidence REAL
duration INTEGER
source TEXT
created_at INTEGER
```

### 3.6 app_events

```sql
id TEXT PRIMARY KEY
event_type TEXT
payload TEXT
created_at INTEGER
```

## 4. IPC 接口分组

### 4.1 设置

```ts
settings.get(): Promise<AppSettings>
settings.update(patch: Partial<AppSettings>): Promise<AppSettings>
```

### 4.2 任务

```ts
tasks.listToday(): Promise<Task[]>
tasks.create(input: CreateTaskInput): Promise<Task>
tasks.update(taskId: string, patch: Partial<Task>): Promise<Task>
tasks.complete(taskId: string): Promise<Task>
tasks.delete(taskId: string): Promise<void>
```

### 4.3 宠物

```ts
pet.getProfile(): Promise<PetProfile>
pet.saveCurrentState(state: PetState): Promise<PetProfile>
pet.addAffinity(amount: number): Promise<PetProfile>
pet.addEnergy(amount: number): Promise<PetProfile>
```

`saveCurrentState` 只持久化当前状态，不负责驱动 UI。运行态宠物状态由桌宠模块持有。

### 4.4 游戏

```ts
games.createRecord(record: GameRecordInput): Promise<GameRecord>
games.listRecent(limit?: number): Promise<GameRecord[]>
```

### 4.5 事件

```ts
events.create(event: AppEventInput): Promise<AppEvent>
events.listRecent(limit?: number): Promise<AppEvent[]>
```

## 5. 数据原则

1. 渲染进程不直接操作 SQLite。
2. IPC 参数必须校验。
3. 数据库初始化必须幂等。
4. 情绪原始信号只保存在内存滑动窗口。
5. emotion_summaries 只保存摘要。
6. 不保存人脸图片、视频或截图。
7. 本模块不主动发布业务反馈，只记录调用方要求写入的数据。
8. 同一类数据必须有单一写入方：任务由任务模块写，设置由设置模块写，游戏记录由游戏模块写，宠物成长由宠物命令处理方写。

## 6. 开发顺序

建议先实现：

1. settings。
2. pet_profile。
3. tasks。
4. app_events。
5. game_records。
6. emotion_summaries。

原因：前 3 个能支撑最早的桌宠和待办闭环。

## 7. 验收标准

1. 数据库首次启动可自动初始化。
2. 设置可读写。
3. 任务可增删改查。
4. 宠物亲密度可更新。
5. 游戏记录可写入。
6. 重启应用后数据仍存在。
7. preload 不暴露任意 Node 能力。
8. 存储接口中不包含产品规则判断。
