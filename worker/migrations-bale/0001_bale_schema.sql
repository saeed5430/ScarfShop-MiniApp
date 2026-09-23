-- Bale Mini App schema (D1: scarf-mini-app-bale)
-- No telegram references. Platform: Bale (tapi.bale.ai)

CREATE TABLE IF NOT EXISTS users (
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

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT DEFAULT '',
  short_description TEXT DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  material TEXT DEFAULT '',
  slug TEXT UNIQUE,
  price INTEGER NOT NULL DEFAULT 0,
  sku TEXT,
  images TEXT DEFAULT '[]',
  is_stock INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS designs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_en TEXT DEFAULT '',
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  design_id INTEGER REFERENCES designs(id) ON DELETE SET NULL,
  slug TEXT UNIQUE,
  is_stock INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS colors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  hex TEXT NOT NULL DEFAULT '#000000',
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS sizes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dimensions TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS variant_colors (
  variant_id INTEGER NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  color_id INTEGER NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
  PRIMARY KEY (variant_id, color_id)
);

CREATE TABLE IF NOT EXISTS variant_sizes (
  variant_id INTEGER NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  size_id INTEGER NOT NULL REFERENCES sizes(id) ON DELETE CASCADE,
  PRIMARY KEY (variant_id, size_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid')),
  delivery_method TEXT,
  notes TEXT,
  receipt_file_id TEXT,
  receipt_file_type TEXT,
  receipt_uploaded_at INTEGER,
  invoice_file_id TEXT,
  invoice_uploaded_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL REFERENCES variants(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  type TEXT DEFAULT 'text',
  label TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_design ON variants(design_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id);

INSERT OR IGNORE INTO settings (key, value, type, label) VALUES
  ('shop_name', 'فروشگاه آرمانا', 'text', 'نام فروشگاه'),
  ('phone', '', 'text', 'تلفن'),
  ('email', '', 'text', 'ایمیل'),
  ('address', '', 'text', 'آدرس'),
  ('postal_code', '', 'text', 'کد پستی'),
  ('bale_link', '', 'text', 'لینک بله'),
  ('logo_url', '', 'text', 'لوگو'),
  ('welcome_text', 'به فروشگاه آرمانا خوش آمدید.', 'text', 'متن خوش‌آمد'),
  ('about_us', '', 'text', 'درباره ما');
