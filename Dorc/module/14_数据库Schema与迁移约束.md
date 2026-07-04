# 数据库 Schema 与迁移约束

## 1. 文档目的

本文件用于约束 SQLite 数据表、字段类型、迁移策略、时间格式、数据边界和本地隐私策略。

后续所有数据库实现必须以本文件为准。

## 2. 数据库选型

MVP 使用：

```text
SQLite
```

Node 驱动优先：

```text
better-sqlite3
```

原因：

1. API 简洁。
2. 适合桌面端本地数据。
3. 读写规模小。
4. 事务实现直接。

如果打包原生模块受阻，再评估 `sqlite3` 或纯文件 fallback，但 schema 不变。

## 3. 数据库存放位置

开发环境：

```text
app/.local/dev.db
```

生产环境：

```text
app.getPath("userData")/data/app.db
```

禁止把用户数据库放在：

1. 项目源码目录。
2. assets 目录。
3. public 目录。
4. 临时缓存目录。

## 4. 通用字段规范

时间格式：

```text
INTEGER 毫秒时间戳
```

布尔值：

```text
INTEGER 0 / 1
```

主键策略：

| 表 | 主键 |
| --- | --- |
| settings | 固定单行 `id = "default"` |
| tasks | 字符串 ID |
| pet_profile | 固定单行 `id = "default"` |
| game_records | 字符串 ID |
| emotion_summaries | 字符串 ID |
| app_events | 字符串 ID |
| schema_migrations | 迁移版本号 |

ID 推荐：

```text
crypto.randomUUID()
```

字段命名：

```text
snake_case
```

TypeScript 类型命名：

```text
camelCase
```

数据库层负责 snake_case 与 camelCase 的转换。

## 5. Schema 版本表

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);
```

迁移文件命名：

```text
001_initial_schema.sql
002_add_xxx.sql
```

迁移规则：

1. 迁移必须按版本号顺序执行。
2. 已执行迁移不得修改内容。
3. 新增字段必须提供默认值或允许 NULL。
4. 生产数据不得通过删除数据库解决迁移问题。
5. 开发期可以提供 reset 命令，但必须只作用于开发数据库。

## 6. settings 表

用途：保存用户设置和隐私偏好。

```sql
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  camera_enabled INTEGER NOT NULL DEFAULT 0,
  emotion_enabled INTEGER NOT NULL DEFAULT 0,
  reminder_level TEXT NOT NULL DEFAULT 'normal',
  focus_mode INTEGER NOT NULL DEFAULT 0,
  pet_always_on_top INTEGER NOT NULL DEFAULT 1,
  launch_at_startup INTEGER NOT NULL DEFAULT 0,
  selected_pet_id TEXT NOT NULL DEFAULT 'default',
  theme_mode TEXT NOT NULL DEFAULT 'system',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

约束：

1. `reminder_level` 只能是 `quiet | normal | active`。
2. `theme_mode` 只能是 `system | light | dark`。
3. 默认不启用摄像头。
4. 默认不启用情绪识别，必须经过首次授权流程。

## 7. tasks 表

用途：保存今日任务与历史任务。

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_at INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

约束：

1. `title` 长度 1 到 80。
2. `description` MVP 可为空。
3. `status` 只能是 `todo | doing | done | delayed | abandoned`。
4. `priority` 只能是 `low | medium | high`。
5. 今日任务通过 `created_at` 或 `due_at` 筛选。

索引：

```sql
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
```

## 8. pet_profile 表

用途：保存宠物成长数据。

```sql
CREATE TABLE IF NOT EXISTS pet_profile (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  affinity INTEGER NOT NULL DEFAULT 0,
  energy INTEGER NOT NULL DEFAULT 50,
  current_state TEXT NOT NULL DEFAULT 'idle',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

约束：

1. MVP 只有单个宠物，`id = "default"`。
2. `affinity` 最小值为 0。
3. `energy` 范围 0 到 100。
4. `current_state` 只能是 `idle | happy | care | tired | celebrate | sleep`。
5. 只有宠物命令处理方可以写 `affinity` 和 `energy`。

## 9. game_records 表

用途：保存小游戏结果。

```sql
CREATE TABLE IF NOT EXISTS game_records (
  id TEXT PRIMARY KEY,
  game_type TEXT NOT NULL,
  result TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0,
  reward TEXT,
  created_at INTEGER NOT NULL
);
```

约束：

1. MVP `game_type` 只允许 `smile_energy`。
2. `result` 只允许 `success | normal | quit`。
3. `duration` 单位为秒。
4. `score` 不得小于 0。

索引：

```sql
CREATE INDEX IF NOT EXISTS idx_game_records_created_at ON game_records(created_at);
```

## 10. emotion_summaries 表

用途：保存低频情绪状态摘要，不保存原始图像。

```sql
CREATE TABLE IF NOT EXISTS emotion_summaries (
  id TEXT PRIMARY KEY,
  user_state TEXT NOT NULL,
  confidence REAL NOT NULL,
  duration INTEGER NOT NULL,
  source TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

约束：

1. `user_state` 只能是 `happy | calm | tired | away`。
2. `confidence` 范围 0 到 1。
3. `duration` 单位为秒。
4. `source` 只能是 `face_landmarker | manual | system`。
5. 只在状态变化、分钟级汇总或调试需要时写入。

禁止保存：

1. 人脸截图。
2. 视频帧。
3. 完整 landmarks。
4. 完整 blendshapes。
5. 可反推出个人面部特征的高维数据。

## 11. app_events 表

用途：保存关键事件，用于调试和联动。

```sql
CREATE TABLE IF NOT EXISTS app_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

约束：

1. `payload` 为 JSON 字符串。
2. payload 必须经过白名单序列化。
3. 不记录原始摄像头数据。
4. 不记录 API Key。
5. 默认只保留最近 30 天事件。

索引：

```sql
CREATE INDEX IF NOT EXISTS idx_app_events_type ON app_events(event_type);
CREATE INDEX IF NOT EXISTS idx_app_events_created_at ON app_events(created_at);
```

## 12. 初始化默认数据

首次启动必须插入：

```text
settings.default
pet_profile.default
```

默认设置：

```json
{
  "cameraEnabled": false,
  "emotionEnabled": false,
  "reminderLevel": "normal",
  "focusMode": false,
  "petAlwaysOnTop": true,
  "launchAtStartup": false,
  "selectedPetId": "default",
  "themeMode": "system"
}
```

默认宠物：

```json
{
  "id": "default",
  "name": "Mochi",
  "affinity": 0,
  "energy": 50,
  "currentState": "idle"
}
```

## 13. 数据访问边界

唯一允许访问 SQLite 的层：

```text
electron/db/
```

渲染进程只能通过：

```text
window.appApi
```

访问数据。

禁止：

1. React 组件 import 数据库模块。
2. feature 模块直接调用 SQLite。
3. 状态决策引擎写数据库。
4. 任务模块修改宠物成长数据。
5. 游戏模块直接修改宠物状态。

## 14. 数据清理策略

MVP 必须提供：

1. 清空任务数据。
2. 清空游戏记录。
3. 清空情绪摘要。
4. 重置宠物成长数据。

清理操作必须：

1. 二次确认。
2. 只通过设置页触发。
3. 只删除允许删除的数据。
4. 保留基础 settings 记录。

## 15. 数据库验收

实现完成后必须满足：

1. 初始化空数据库成功。
2. 重复启动不会重复插入默认数据。
3. 迁移表记录正确。
4. 任务 CRUD 正常。
5. 宠物资料读取正常。
6. 游戏记录可写入和查询。
7. 情绪摘要不保存原始图像。
8. 渲染进程无法直接访问数据库。

