-- Seed data: Category, Product, Design, Variant with colors and sizes

-- 1. Category: روسری
INSERT INTO categories (name, created_at, updated_at) VALUES
('روسری', '1404/04/01 00:00:00', '1404/04/01 00:00:00');

-- 2. Product: درختی (category_id = 1)
INSERT INTO products (name, category_id, description, short_description, is_active, material, created_at, updated_at) VALUES
('درختی', 1, 'این روسری است', 'این روسری است', 1, 'کریشه', '1404/04/01 00:00:00', '1404/04/01 00:00:00');

-- 3. Design: ورساچه
INSERT INTO designs (name, created_at, updated_at) VALUES
('ورساچه', '1404/04/01 00:00:00', '1404/04/01 00:00:00');

-- 4. Variant: درختی + ورساچه (product_id=1, design_id=1, in_stock=1)
INSERT INTO variants (product_id, design_id, slug, color, size, is_stock, images, created_at, updated_at) VALUES
(1, 1, 'hijab-darakhti-mocha-m', 'قهوه‌ای موکا', '100-130', 1, '[]', '1404/04/01 00:00:00', '1404/04/01 00:00:00');

-- 5. Link variant (id=1) to all 15 colors
INSERT INTO variant_colors (variant_id, color_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(1, 6), (1, 7), (1, 8), (1, 9), (1, 10),
(1, 11), (1, 12), (1, 13), (1, 14), (1, 15);

-- 6. Link variant (id=1) to size (id=1 = 100-130)
INSERT INTO variant_sizes (variant_id, size_id) VALUES
(1, 1);
