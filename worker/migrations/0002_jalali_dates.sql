-- Drop old users table and recreate with Jalali text dates
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  user_type TEXT DEFAULT 'new',
  first_name TEXT NOT NULL,
  last_name TEXT,
  username TEXT,
  language_code TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  postal_code TEXT,
  invite_code TEXT,
  is_premium INTEGER DEFAULT 0,
  created_at TEXT DEFAULT '',
  last_active TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
