CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
