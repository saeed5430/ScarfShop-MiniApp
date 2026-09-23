CREATE TABLE IF NOT EXISTS admin_telegram_accounts (
  admin_id TEXT PRIMARY KEY,
  username TEXT,
  telegram_user_id TEXT,
  telegram_phone_masked TEXT,
  status TEXT NOT NULL DEFAULT 'not_connected' CHECK(status IN ('not_connected', 'connected', 'error', 'revoked', 'disabled')),
  personal_sending_enabled INTEGER NOT NULL DEFAULT 0,
  session_ref TEXT,
  last_connected_at INTEGER,
  last_verified_at INTEGER,
  last_error TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_admin_telegram_accounts_status ON admin_telegram_accounts(status);
CREATE INDEX IF NOT EXISTS idx_admin_telegram_accounts_enabled ON admin_telegram_accounts(personal_sending_enabled);