CREATE TABLE IF NOT EXISTS bale_order_waiting (
  admin_id TEXT PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  waiting_action TEXT NOT NULL CHECK(waiting_action IN ('invoice_photo', 'voice')),
  created_at INTEGER DEFAULT (unixepoch())
);
ALTER TABLE orders ADD COLUMN voice_file_id TEXT;
ALTER TABLE orders ADD COLUMN voice_uploaded_at INTEGER;
