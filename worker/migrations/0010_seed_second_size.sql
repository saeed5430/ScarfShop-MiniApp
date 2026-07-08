-- Seed: Add second size and variant for "درختی"

-- Insert second size: 130
INSERT INTO sizes (dimensions, created_at, updated_at) VALUES
('130', '1404/04/01 00:00:00', '1404/04/01 00:00:00');

-- Insert second variant for size 130 (product_id=1, design_id=1)
INSERT INTO variants (product_id, design_id, slug, color, size, is_stock, images, created_at, updated_at) VALUES
(1, 1, 'hijab-darakhti-versache-130', 'متنوع', '130', 1, '[]', '1404/04/01 00:00:00', '1404/04/01 00:00:00');

-- Link variant 2 to all 15 colors
INSERT INTO variant_colors (variant_id, color_id) VALUES
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5),
(2, 6), (2, 7), (2, 8), (2, 9), (2, 10),
(2, 11), (2, 12), (2, 13), (2, 14), (2, 15);

-- Link variant 2 to size 2 (130)
INSERT INTO variant_sizes (variant_id, size_id) VALUES
(2, 2);
