ALTER TABLE orders ADD COLUMN receipt_file_id TEXT;
ALTER TABLE orders ADD COLUMN receipt_file_type TEXT;
ALTER TABLE orders ADD COLUMN receipt_uploaded_at INTEGER;
ALTER TABLE orders ADD COLUMN telegram_chat_id TEXT;
ALTER TABLE orders ADD COLUMN telegram_order_message_id INTEGER;
ALTER TABLE orders ADD COLUMN invoice_file_id TEXT;
ALTER TABLE orders ADD COLUMN invoice_uploaded_at INTEGER;
ALTER TABLE orders ADD COLUMN voice_file_id TEXT;
ALTER TABLE orders ADD COLUMN voice_uploaded_at INTEGER;

CREATE TABLE IF NOT EXISTS order_telegram_messages (
  order_id INTEGER NOT NULL,
  telegram_chat_id TEXT NOT NULL,
  telegram_message_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (order_id, telegram_chat_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS telegram_order_waiting (
  telegram_user_id TEXT PRIMARY KEY,
  order_id INTEGER NOT NULL,
  waiting_action TEXT NOT NULL CHECK(waiting_action IN ('invoice_photo', 'voice')),
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_telegram_messages_order ON order_telegram_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_telegram_order_waiting_expires ON telegram_order_waiting(expires_at);
