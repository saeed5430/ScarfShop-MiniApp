-- Table to track Telegram messages for auto-deletion after 24 hours
CREATE TABLE IF NOT EXISTS telegram_message_deletion_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_chat_id TEXT NOT NULL,
  telegram_message_id INTEGER NOT NULL,
  order_id INTEGER NOT NULL,
  message_type TEXT NOT NULL CHECK(message_type IN ('invoice', 'voice', 'order_notification')),
  delete_at INTEGER NOT NULL,
  deleted_at INTEGER DEFAULT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_telegram_message_deletion_queue_delete_at ON telegram_message_deletion_queue(delete_at);
CREATE INDEX IF NOT EXISTS idx_telegram_message_deletion_queue_order_id ON telegram_message_deletion_queue(order_id);