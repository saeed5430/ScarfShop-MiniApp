-- Migration 0012: Schema updates + new tables
-- All dates are Jalali (stored as TEXT in YYYY/MM/DD HH:mm:ss format)

-- 1. Update admins table: add user_id, email, password_hash, updated_at
ALTER TABLE admins ADD COLUMN user_id TEXT;
ALTER TABLE admins ADD COLUMN email TEXT;
ALTER TABLE admins ADD COLUMN password_hash TEXT;
ALTER TABLE admins ADD COLUMN updated_at INTEGER DEFAULT (unixepoch());

CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- 2. Update categories table: add slug, description
ALTER TABLE categories ADD COLUMN slug TEXT;
ALTER TABLE categories ADD COLUMN description TEXT DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- 3. Update products table: add slug, price, stock, sku
ALTER TABLE products ADD COLUMN slug TEXT;
ALTER TABLE products ADD COLUMN price INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN sku TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- 4. Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    postal_code TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 5. Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    total INTEGER NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid')),
    fulfillment_status TEXT NOT NULL DEFAULT 'processing' CHECK(fulfillment_status IN ('processing', 'shipped', 'delivered')),
    notes TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment ON orders(fulfillment_status);

-- 6. Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    variant_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES variants(id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 7. Coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    discount INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'percentage' CHECK(type IN ('percentage', 'fixed')),
    expires_at INTEGER,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
