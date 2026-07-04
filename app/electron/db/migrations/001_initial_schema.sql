CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);

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

CREATE TABLE IF NOT EXISTS pet_profile (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  affinity INTEGER NOT NULL DEFAULT 0,
  energy INTEGER NOT NULL DEFAULT 50,
  current_state TEXT NOT NULL DEFAULT 'idle',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS game_records (
  id TEXT PRIMARY KEY,
  game_type TEXT NOT NULL,
  result TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0,
  reward TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS emotion_summaries (
  id TEXT PRIMARY KEY,
  user_state TEXT NOT NULL,
  confidence REAL NOT NULL,
  duration INTEGER NOT NULL,
  source TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS app_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

