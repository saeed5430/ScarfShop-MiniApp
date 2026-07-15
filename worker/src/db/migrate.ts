import type { D1Database } from '@cloudflare/workers-types';

export async function runMigrations(db: D1Database): Promise<void> {
  const stmts: string[] = [
    `CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, user_type TEXT DEFAULT 'new', first_name TEXT NOT NULL, last_name TEXT, username TEXT, language_code TEXT, avatar_url TEXT, phone TEXT, address TEXT, postal_code TEXT, invite_code TEXT, is_premium INTEGER DEFAULT 0, created_at INTEGER DEFAULT (unixepoch()), last_active INTEGER DEFAULT (unixepoch()))`,
    `CREATE TABLE IF NOT EXISTS admins (id TEXT PRIMARY KEY, customer_id TEXT, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE, first_name TEXT NOT NULL, last_name TEXT, avatar_url TEXT, password_hash TEXT, created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch()))`,
    `CREATE TABLE IF NOT EXISTS sessions (session_id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, token TEXT NOT NULL, created_at INTEGER DEFAULT (unixepoch()), expires_at INTEGER DEFAULT (unixepoch() + 86400), FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS chats (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id TEXT NOT NULL, message TEXT NOT NULL, sender_type TEXT NOT NULL CHECK(sender_type IN ('user', 'assistant')), ai_connected INTEGER DEFAULT 0, timestamp INTEGER DEFAULT (unixepoch()), FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT UNIQUE, description TEXT DEFAULT '', created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch()))`,
    `CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category_id INTEGER NOT NULL, slug TEXT UNIQUE, description TEXT DEFAULT '', short_description TEXT DEFAULT '', is_active INTEGER NOT NULL DEFAULT 1, material TEXT DEFAULT '', images TEXT DEFAULT '[]', is_stock INTEGER NOT NULL DEFAULT 1, sku TEXT, created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch()), FOREIGN KEY (category_id) REFERENCES categories(id))`,
    `CREATE TABLE IF NOT EXISTS designs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, name_en TEXT NOT NULL DEFAULT '', created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch()))`,
    `CREATE TABLE IF NOT EXISTS colors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, name_en TEXT NOT NULL DEFAULT '', hex TEXT NOT NULL DEFAULT '#000000', created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch()))`,
    `CREATE TABLE IF NOT EXISTS sizes (id INTEGER PRIMARY KEY AUTOINCREMENT, dimensions TEXT NOT NULL, created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch()))`,
    `CREATE TABLE IF NOT EXISTS product_colors (product_id INTEGER NOT NULL, color_id INTEGER NOT NULL, PRIMARY KEY (product_id, color_id), FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE, FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS product_sizes (product_id INTEGER NOT NULL, size_id INTEGER NOT NULL, PRIMARY KEY (product_id, size_id), FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE, FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id TEXT NOT NULL, total INTEGER NOT NULL DEFAULT 0, payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid')), fulfillment_status TEXT NOT NULL DEFAULT 'processing' CHECK(fulfillment_status IN ('processing', 'shipped', 'delivered')), notes TEXT, created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch()), FOREIGN KEY (customer_id) REFERENCES customers(id))`,
    `CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, product_id INTEGER NOT NULL, color_id INTEGER, size_id INTEGER, quantity INTEGER NOT NULL DEFAULT 1, price INTEGER NOT NULL DEFAULT 0, FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE, FOREIGN KEY (product_id) REFERENCES products(id), FOREIGN KEY (color_id) REFERENCES colors(id), FOREIGN KEY (size_id) REFERENCES sizes(id))`,
    `CREATE TABLE IF NOT EXISTS coupons (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL, discount INTEGER NOT NULL DEFAULT 0, type TEXT NOT NULL DEFAULT 'percentage' CHECK(type IN ('percentage', 'fixed')), expires_at INTEGER, is_active INTEGER DEFAULT 1, created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch()))`,
    `CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, value TEXT, type TEXT DEFAULT 'text' CHECK(type IN ('text', 'image', 'boolean', 'json')), label TEXT NOT NULL, created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch()))`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_customer_id ON sessions(customer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`,
    `CREATE INDEX IF NOT EXISTS idx_chats_customer_id ON chats(customer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_chats_timestamp ON chats(timestamp)`,
    `CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username)`,
    `CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email)`,
    `CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)`,
    `CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_status)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_fulfillment ON orders(fulfillment_status)`,
    `CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code)`,
    `INSERT OR IGNORE INTO admins (id, username, email, first_name, created_at, updated_at) VALUES ('admin_saeed54300', 'saeed54300', 'admin@armana.ir', 'سعید', unixepoch(), unixepoch())`,
  ];

  for (const sql of stmts) {
    await db.prepare(sql).run();
  }
}
