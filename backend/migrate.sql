-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrade columns when coming from an older schema
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

-- First user becomes admin if no admin exists yet
UPDATE users SET role = 'admin'
WHERE id = (SELECT id FROM users ORDER BY id LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin');

-- ── Workspace ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  client TEXT NOT NULL DEFAULT '',
  phase TEXT NOT NULL DEFAULT 'Active',
  source TEXT NOT NULL DEFAULT '',
  categories TEXT[] NOT NULL DEFAULT '{}',
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  legacy_item_id INTEGER,
  title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'OPEN',
  due_date DATE,
  assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assignee_name TEXT,
  source TEXT NOT NULL DEFAULT '',
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status_changed_by_name TEXT,
  status_changed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);

CREATE TABLE IF NOT EXISTS task_notes (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_task_notes_task ON task_notes(task_id);
ALTER TABLE task_notes ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE task_notes ADD COLUMN IF NOT EXISTS resolved BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE task_notes ADD COLUMN IF NOT EXISTS resolved_by_name TEXT;
ALTER TABLE task_notes ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS activity (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  project_id INTEGER,
  project_name TEXT,
  task_id INTEGER,
  task_title TEXT,
  detail TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

INSERT INTO settings (key, value) VALUES
  ('status_bar', '{"message": "Online", "date": ""}'),
  ('status_options', '["Online", "In the field", "On site", "In a meeting", "Busy — heads down", "Offline"]')
ON CONFLICT (key) DO NOTHING;

-- ── Legacy tables (kept so the one-time seed can migrate old data) ────────────
CREATE TABLE IF NOT EXISTS item_statuses (
  id SERIAL PRIMARY KEY,
  project_id TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  changed_by_id INTEGER REFERENCES users(id),
  changed_by_name TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, item_id)
);

CREATE TABLE IF NOT EXISTS item_notes (
  id SERIAL PRIMARY KEY,
  project_id TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_by_id INTEGER REFERENCES users(id),
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
