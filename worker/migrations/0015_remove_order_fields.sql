-- ============================================
-- حذف فیلدهای total و fulfillment_status از orders
-- حذف فیلد price از order_items
-- ============================================

PRAGMA foreign_keys = OFF;

-- 1. ایجاد جدول orders جدید (بدون total, fulfillment_status)
CREATE TABLE orders_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid')),
    notes TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- 2. انتقال داده‌ها
INSERT INTO orders_new (id, user_id, payment_status, notes, created_at, updated_at)
SELECT 
    id, 
    user_id, 
    COALESCE(payment_status, 'pending'), 
    notes, 
    created_at, 
    updated_at
FROM orders;

-- 3. حذف جدول قدیمی و تغییر نام
DROP TABLE orders;
ALTER TABLE orders_new RENAME TO orders;

-- 4. ایندکس‌ها
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_status);

-- 5. ایجاد جدول order_items جدید (بدون price)
CREATE TABLE order_items_new (
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
);

-- 6. انتقال داده‌ها (بدون price)
INSERT INTO order_items_new (id, order_id, product_id, color_id, size_id, quantity)
SELECT id, order_id, product_id, color_id, size_id, quantity
FROM order_items;

-- 7. حذف جدول قدیمی و تغییر نام
DROP TABLE order_items;
ALTER TABLE order_items_new RENAME TO order_items;

-- 8. ایندکس
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

PRAGMA foreign_keys = ON;
