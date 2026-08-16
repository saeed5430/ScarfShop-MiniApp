import type { D1Database } from '@cloudflare/workers-types';

async function tableExists(db: D1Database, name: string): Promise<boolean> {
  const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`).bind(name).first();
  return Boolean(row);
}

async function columnExists(db: D1Database, table: string, column: string): Promise<boolean> {
  const { results } = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
  return results.some((c) => c.name === column);
}

async function indexExists(db: D1Database, name: string): Promise<boolean> {
  const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name = ?`).bind(name).first();
  return Boolean(row);
}

// Rename a legacy table to its platform-namespaced name, preserving data.
async function renameLegacyTable(db: D1Database, from: string, to: string): Promise<void> {
  if ((await tableExists(db, from)) && !(await tableExists(db, to))) {
    await db.prepare(`ALTER TABLE ${from} RENAME TO ${to}`).run();
  }
}

export async function runMigrations(db: D1Database): Promise<void> {
  // ------------------------------------------------------------------
  // Telegram platform tables (identity, sessions, chats, order media)
  // ------------------------------------------------------------------
  const telegramStmts: string[] = [
    `CREATE TABLE IF NOT EXISTS telegram_customers (
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
    )`,
    `CREATE TABLE IF NOT EXISTS telegram_sessions (
      session_id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      token TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()),
      expires_at INTEGER DEFAULT (unixepoch() + 86400),
      FOREIGN KEY (customer_id) REFERENCES telegram_customers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS telegram_chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT NOT NULL,
      message TEXT NOT NULL,
      sender_type TEXT NOT NULL CHECK(sender_type IN ('user', 'assistant')),
      ai_connected INTEGER DEFAULT 0,
      timestamp INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (customer_id) REFERENCES telegram_customers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS telegram_order_messages (
      order_id INTEGER NOT NULL,
      telegram_chat_id TEXT NOT NULL,
      telegram_message_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (order_id, telegram_chat_id),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS telegram_order_waiting (
      telegram_user_id TEXT PRIMARY KEY,
      order_id INTEGER NOT NULL,
      waiting_action TEXT NOT NULL CHECK(waiting_action IN ('invoice_photo', 'voice')),
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS telegram_message_deletion_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_chat_id TEXT NOT NULL,
      telegram_message_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      message_type TEXT NOT NULL CHECK(message_type IN ('invoice', 'voice', 'order_notification')),
      delete_at INTEGER NOT NULL,
      deleted_at INTEGER DEFAULT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    )`,
    `CREATE INDEX IF NOT EXISTS idx_telegram_sessions_customer_id ON telegram_sessions(customer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_telegram_sessions_expires_at ON telegram_sessions(expires_at)`,
    `CREATE INDEX IF NOT EXISTS idx_telegram_chats_customer_id ON telegram_chats(customer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_telegram_chats_timestamp ON telegram_chats(timestamp)`,
    `CREATE INDEX IF NOT EXISTS idx_telegram_order_messages_order ON telegram_order_messages(order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_telegram_order_waiting_expires ON telegram_order_waiting(expires_at)`,
    `CREATE INDEX IF NOT EXISTS idx_telegram_deletion_queue_delete_at ON telegram_message_deletion_queue(delete_at)`,
    `CREATE INDEX IF NOT EXISTS idx_telegram_deletion_queue_order_id ON telegram_message_deletion_queue(order_id)`,
  ];

  // ------------------------------------------------------------------
  // Bale platform tables (mirror of Telegram platform tables)
  // ------------------------------------------------------------------
  const baleStmts: string[] = [
    `CREATE TABLE IF NOT EXISTS bale_customers (
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
    )`,
    `CREATE TABLE IF NOT EXISTS bale_sessions (
      session_id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      token TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()),
      expires_at INTEGER DEFAULT (unixepoch() + 86400),
      FOREIGN KEY (customer_id) REFERENCES bale_customers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS bale_chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT NOT NULL,
      message TEXT NOT NULL,
      sender_type TEXT NOT NULL CHECK(sender_type IN ('user', 'assistant')),
      ai_connected INTEGER DEFAULT 0,
      timestamp INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (customer_id) REFERENCES bale_customers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS bale_order_messages (
      order_id INTEGER NOT NULL,
      bale_chat_id TEXT NOT NULL,
      bale_message_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (order_id, bale_chat_id),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS bale_order_waiting (
      bale_user_id TEXT PRIMARY KEY,
      order_id INTEGER NOT NULL,
      waiting_action TEXT NOT NULL CHECK(waiting_action IN ('invoice_photo', 'voice')),
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS bale_message_deletion_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bale_chat_id TEXT NOT NULL,
      bale_message_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      message_type TEXT NOT NULL CHECK(message_type IN ('invoice', 'voice', 'order_notification')),
      delete_at INTEGER NOT NULL,
      deleted_at INTEGER DEFAULT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    )`,
    `CREATE INDEX IF NOT EXISTS idx_bale_sessions_customer_id ON bale_sessions(customer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_bale_sessions_expires_at ON bale_sessions(expires_at)`,
    `CREATE INDEX IF NOT EXISTS idx_bale_chats_customer_id ON bale_chats(customer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_bale_chats_timestamp ON bale_chats(timestamp)`,
    `CREATE INDEX IF NOT EXISTS idx_bale_order_messages_order ON bale_order_messages(order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_bale_order_waiting_expires ON bale_order_waiting(expires_at)`,
    `CREATE INDEX IF NOT EXISTS idx_bale_deletion_queue_delete_at ON bale_message_deletion_queue(delete_at)`,
    `CREATE INDEX IF NOT EXISTS idx_bale_deletion_queue_order_id ON bale_message_deletion_queue(order_id)`,
  ];

  // ------------------------------------------------------------------
  // Shared business tables (products, orders, etc.)
  // ------------------------------------------------------------------
  const sharedStmts: string[] = [
    `CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT,
      avatar_url TEXT,
      password_hash TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      description TEXT DEFAULT '',
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      slug TEXT UNIQUE,
      description TEXT DEFAULT '',
      short_description TEXT DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      material TEXT DEFAULT '',
      images TEXT DEFAULT '[]',
      is_stock INTEGER NOT NULL DEFAULT 1,
      sku TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )`,
    `CREATE TABLE IF NOT EXISTS designs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_en TEXT NOT NULL DEFAULT '',
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS colors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_en TEXT NOT NULL DEFAULT '',
      hex TEXT NOT NULL DEFAULT '#000000',
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS sizes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dimensions TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS product_colors (
      product_id INTEGER NOT NULL,
      color_id INTEGER NOT NULL,
      PRIMARY KEY (product_id, color_id),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS product_sizes (
      product_id INTEGER NOT NULL,
      size_id INTEGER NOT NULL,
      PRIMARY KEY (product_id, size_id),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT NOT NULL,
      platform TEXT NOT NULL DEFAULT 'telegram' CHECK(platform IN ('telegram', 'bale')),
      payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid')),
      delivery_method TEXT,
      notes TEXT,
      receipt_file_id TEXT,
      receipt_file_type TEXT,
      receipt_uploaded_at INTEGER,
      telegram_chat_id TEXT,
      telegram_order_message_id INTEGER,
      invoice_file_id TEXT,
      invoice_uploaded_at INTEGER,
      voice_file_id TEXT,
      voice_uploaded_at INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      color_id INTEGER,
      size_id INTEGER,
      quantity INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (color_id) REFERENCES colors(id),
      FOREIGN KEY (size_id) REFERENCES sizes(id)
    )`,
    `CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL DEFAULT 'percentage' CHECK(type IN ('percentage', 'fixed')),
      expires_at INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      type TEXT DEFAULT 'text' CHECK(type IN ('text', 'image', 'boolean', 'json')),
      label TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS admin_telegram_accounts (
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
    )`,

    `CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username)`,
    `CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email)`,
    `CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)`,
    `CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_platform ON orders(platform)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_status)`,
    `CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code)`,
    `CREATE INDEX IF NOT EXISTS idx_admin_telegram_accounts_status ON admin_telegram_accounts(status)`,
    `CREATE INDEX IF NOT EXISTS idx_admin_telegram_accounts_enabled ON admin_telegram_accounts(personal_sending_enabled)`,

    `INSERT OR IGNORE INTO admins (id, username, email, first_name, created_at, updated_at)
      VALUES ('admin_saeed54300', 'saeed54300', 'admin@armana.ir', 'سعید', unixepoch(), unixepoch())`,
    `INSERT OR IGNORE INTO telegram_customers (id, user_type, first_name, last_name, username, language_code, is_premium, created_at, last_active)
      VALUES ('demo_123456789', 'regular', 'سعید', 'احمدی', 'saeed54300', 'fa', 0, unixepoch(), unixepoch())`,
  ];

  for (const sql of [...telegramStmts, ...baleStmts, ...sharedStmts]) {
    await db.prepare(sql).run();
  }

  // ------------------------------------------------------------------
  // Upgrade steps for databases created by earlier migration versions
  // ------------------------------------------------------------------
  await renameLegacyTable(db, 'users', 'telegram_customers');
  await renameLegacyTable(db, 'customers', 'telegram_customers');
  await renameLegacyTable(db, 'sessions', 'telegram_sessions');
  await renameLegacyTable(db, 'chats', 'telegram_chats');
  await renameLegacyTable(db, 'order_telegram_messages', 'telegram_order_messages');

  if (await tableExists(db, 'orders')) {
    if (await columnExists(db, 'orders', 'user_id')) {
      if (await indexExists(db, 'idx_orders_user')) {
        await db.prepare('DROP INDEX idx_orders_user').run();
      }
      await db.prepare('ALTER TABLE orders RENAME COLUMN user_id TO customer_id').run();
    }
    if (!(await columnExists(db, 'orders', 'platform'))) {
      await db.prepare("ALTER TABLE orders ADD COLUMN platform TEXT NOT NULL DEFAULT 'telegram' CHECK(platform IN ('telegram', 'bale'))").run();
    }
    if (await indexExists(db, 'idx_orders_user')) {
      await db.prepare('DROP INDEX idx_orders_user').run();
    }
    if (!(await indexExists(db, 'idx_orders_customer'))) {
      await db.prepare('CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)').run();
    }
    if (!(await indexExists(db, 'idx_orders_platform'))) {
      await db.prepare('CREATE INDEX IF NOT EXISTS idx_orders_platform ON orders(platform)').run();
    }
  }
}
