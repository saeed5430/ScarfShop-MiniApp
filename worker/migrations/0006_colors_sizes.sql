-- Migration: Add colors, sizes, and junction tables

-- Colors table
CREATE TABLE IF NOT EXISTS colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_en TEXT NOT NULL,
    hex TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Sizes table
CREATE TABLE IF NOT EXISTS sizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dimensions TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Junction: variant <-> color
CREATE TABLE IF NOT EXISTS variant_colors (
    variant_id INTEGER NOT NULL,
    color_id INTEGER NOT NULL,
    PRIMARY KEY (variant_id, color_id),
    FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE,
    FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE
);

-- Junction: variant <-> size
CREATE TABLE IF NOT EXISTS variant_sizes (
    variant_id INTEGER NOT NULL,
    size_id INTEGER NOT NULL,
    PRIMARY KEY (variant_id, size_id),
    FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE,
    FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_variant_colors_color ON variant_colors(color_id);
CREATE INDEX IF NOT EXISTS idx_variant_sizes_size ON variant_sizes(size_id);

-- Seed sizes
INSERT INTO sizes (dimensions, created_at, updated_at) VALUES
('100-130', '1404/04/01 00:00:00', '1404/04/01 00:00:00');

-- Seed colors
INSERT INTO colors (name, name_en, hex, created_at, updated_at) VALUES
('قهوه‌ای موکا', 'Mocha Brown', '#9B7A63', '1404/04/01 00:00:00', '1404/04/01 00:00:00'),
('کرم شیری', 'Cream', '#E8D9AF', '1404/04/01 00:00:00', '1404/04/01 00:00:00'),
('بژ روشن', 'Light Beige', '#D9C5A5', '1404/04/01 00:00:00', '1404/04/01 00:00:00'),
('بژ خاکی', 'Taupe Beige', '#AA947A', '1404/04/01 00:00:00', '1404/04/01 00:00:00'),
('سبز جنگلی تیره', 'Dark Forest Green', '#2F4734', '1404/04/01 00:00:00', '1404/04/01 00:00:00'),
('سبز سدری روشن', 'Sage Green', '#8FA98A', '1404/04/01 00:00:00', '1404/04/01 00:00:00'),
('سبز زمردی تیره', 'Deep Emerald Green', '#0E5A46', '1404/04/01 00:00:00', '1404/04/01 00:00:00'),
('زرشکی', 'Burgundy', '#5C1422', '1404/04/01 00:00:00', '1404/04/01 00:00:00'),
('صورتی چرک', 'Dusty Pink', '#D2B1B8', '1404/04/01 00:00:00', '1404/04/01 00:00:00'),
('طوسی روشن', 'Light Gray', '#C8C8C6', '1404/04/01 00:00:00', '1404/04/01 00:00:00'),
('طوسی زغالی', 'Charcoal Gray', '#5E6464', '1404/04/01 00:00:00', '1404/04/01 00:00:00'),
('آبی کاربنی روشن', 'Steel Blue', '#4F79B8', '1404/04/01 00:00:00', '1404/04/01 00:00:00'),
('سرمه‌ای', 'Navy Blue', '#1B2348', '1404/04/01 00:00:00', '1404/04/01 00:00:00'),
('مشکی', 'Black', '#111111', '1404/04/01 00:00:00', '1404/04/01 00:00:00'),
('کرم بژ', 'Sand Beige', '#D8C1A9', '1404/04/01 00:00:00', '1404/04/01 00:00:00');
