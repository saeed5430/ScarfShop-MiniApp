-- Migration 0013: Admin refactoring
-- حذف customers, variants, بازسازی order_items, اضافه کردن settings

-- 1. حذف order_items (وابسته به variants)
DROP TABLE IF EXISTS order_items;

-- 2. حذف variants و junction tables
DROP TABLE IF EXISTS variant_colors;
DROP TABLE IF EXISTS variant_sizes;
DROP TABLE IF EXISTS variants;

-- 3. حذف customers و اتصال orders به users
ALTER TABLE orders RENAME COLUMN customer_id TO user_id;
DROP TABLE IF EXISTS customers;

-- 4. حذف price از products, تبدیل stock به boolean, اضافه کردن images
ALTER TABLE products DROP COLUMN price;
ALTER TABLE products DROP COLUMN stock;
ALTER TABLE products ADD COLUMN is_stock INTEGER NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN images TEXT DEFAULT '[]';

-- 5. ایجاد junction tables جدید
CREATE TABLE IF NOT EXISTS product_colors (
    product_id INTEGER NOT NULL,
    color_id INTEGER NOT NULL,
    PRIMARY KEY (product_id, color_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_sizes (
    product_id INTEGER NOT NULL,
    size_id INTEGER NOT NULL,
    PRIMARY KEY (product_id, size_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE
);

-- 6. ایجاد مجدد order_items
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    color_id INTEGER,
    size_id INTEGER,
    quantity INTEGER NOT NULL DEFAULT 1,
    price INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (color_id) REFERENCES colors(id),
    FOREIGN KEY (size_id) REFERENCES sizes(id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 7. ایجاد جدول settings
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    type TEXT DEFAULT 'text' CHECK(type IN ('text', 'image', 'boolean', 'json')),
    label TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- 8. seed تنظیمات پیش‌فرض
INSERT OR IGNORE INTO settings (key, value, type, label) VALUES
('shop_name', 'فروشگاه آرمانا', 'text', 'نام فروشگاه'),
('phone', '', 'text', 'تلفن'),
('email', '', 'text', 'ایمیل'),
('address', '', 'text', 'آدرس'),
('postal_code', '', 'text', 'کد پستی'),
('telegram_link', '', 'text', 'آیدی تلگرام'),
('rubika_link', '', 'text', 'آیدی روبیکا'),
('bale_link', '', 'text', 'آیدی بله'),
('eitaa_link', '', 'text', 'آیدی ایتا'),
('logo_url', '', 'image', 'لوگوی فروشگاه'),
('welcome_text', 'به فروشگاه آرمانا خوش آمدید', 'text', 'متن خوش‌آمدگویی'),
('about_us', '', 'text', 'درباره ما');
