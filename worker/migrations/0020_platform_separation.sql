-- Migration: Platform Separation (Telegram / Bale)
-- Transforms existing schema to support dual-platform architecture

-- ============================================
-- 1. Rename Telegram platform tables
-- ============================================

-- customers -> telegram_customers
ALTER TABLE customers RENAME TO telegram_customers;

-- sessions -> telegram_sessions
ALTER TABLE sessions RENAME TO telegram_sessions;

-- chats -> telegram_chats
ALTER TABLE chats RENAME TO telegram_chats;

-- order_telegram_messages -> telegram_order_messages
ALTER TABLE order_telegram_messages RENAME TO telegram_order_messages;

-- ============================================
-- 2. Create Bale platform tables (mirror of Telegram)
-- ============================================

CREATE TABLE bale_customers (
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
    created_at INTEGER DEFAULT (unixepoch()),
    last_active INTEGER DEFAULT (unixepoch())
);

CREATE TABLE bale_sessions (
    session_id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    token TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    expires_at INTEGER DEFAULT (unixepoch() + 86400),
    FOREIGN KEY (customer_id) REFERENCES bale_customers(id) ON DELETE CASCADE
);

CREATE TABLE bale_chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT NOT NULL,
    message TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK(sender_type IN ('user', 'assistant')),
    ai_connected INTEGER DEFAULT 0,
    timestamp INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (customer_id) REFERENCES bale_customers(id) ON DELETE CASCADE
);

CREATE TABLE bale_order_messages (
    order_id INTEGER NOT NULL,
    bale_chat_id TEXT NOT NULL,
    bale_message_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (order_id, bale_chat_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE bale_order_waiting (
    bale_user_id TEXT PRIMARY KEY,
    order_id INTEGER NOT NULL,
    waiting_action TEXT NOT NULL CHECK(waiting_action IN ('invoice_photo', 'voice')),
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE bale_message_deletion_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bale_chat_id TEXT NOT NULL,
    bale_message_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    message_type TEXT NOT NULL CHECK(message_type IN ('invoice', 'voice', 'order_notification')),
    delete_at INTEGER NOT NULL,
    deleted_at INTEGER DEFAULT NULL,
    created_at INTEGER DEFAULT (unixepoch())
);

-- Indexes for Bale tables
CREATE INDEX idx_bale_sessions_customer_id ON bale_sessions(customer_id);
CREATE INDEX idx_bale_sessions_expires_at ON bale_sessions(expires_at);
CREATE INDEX idx_bale_chats_customer_id ON bale_chats(customer_id);
CREATE INDEX idx_bale_chats_timestamp ON bale_chats(timestamp);
CREATE INDEX idx_bale_order_messages_order ON bale_order_messages(order_id);
CREATE INDEX idx_bale_order_waiting_expires ON bale_order_waiting(expires_at);
CREATE INDEX idx_bale_deletion_queue_delete_at ON bale_message_deletion_queue(delete_at);
CREATE INDEX idx_bale_deletion_queue_order_id ON bale_message_deletion_queue(order_id);

-- ============================================
-- 3. Transform orders table
-- ============================================

-- Rename user_id -> customer_id
ALTER TABLE orders RENAME COLUMN user_id TO customer_id;

-- Add platform column (default 'telegram' for existing orders)
ALTER TABLE orders ADD COLUMN platform TEXT NOT NULL DEFAULT 'telegram' CHECK(platform IN ('telegram', 'bale'));

-- Update indexes
DROP INDEX IF EXISTS idx_orders_user;
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_platform ON orders(platform);

-- ============================================
-- 4. Update renamed table indexes
-- ============================================

-- telegram_sessions indexes
DROP INDEX IF EXISTS idx_sessions_customer_id;
DROP INDEX IF EXISTS idx_sessions_expires_at;
CREATE INDEX idx_telegram_sessions_customer_id ON telegram_sessions(customer_id);
CREATE INDEX idx_telegram_sessions_expires_at ON telegram_sessions(expires_at);

-- telegram_chats indexes
DROP INDEX IF EXISTS idx_chats_customer_id;
DROP INDEX IF EXISTS idx_chats_timestamp;
CREATE INDEX idx_telegram_chats_customer_id ON telegram_chats(customer_id);
CREATE INDEX idx_telegram_chats_timestamp ON telegram_chats(timestamp);

-- telegram_order_messages index
DROP INDEX IF EXISTS idx_order_telegram_messages_order;
CREATE INDEX idx_telegram_order_messages_order ON telegram_order_messages(order_id);

-- telegram_order_waiting index
DROP INDEX IF EXISTS idx_telegram_order_waiting_expires;
CREATE INDEX idx_telegram_order_waiting_expires ON telegram_order_waiting(expires_at);

-- telegram_message_deletion_queue indexes
DROP INDEX IF EXISTS idx_telegram_message_deletion_queue_delete_at;
DROP INDEX IF EXISTS idx_telegram_message_deletion_queue_order_id;
CREATE INDEX idx_telegram_deletion_queue_delete_at ON telegram_message_deletion_queue(delete_at);
CREATE INDEX idx_telegram_deletion_queue_order_id ON telegram_message_deletion_queue(order_id);