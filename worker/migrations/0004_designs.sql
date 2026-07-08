-- Migration: Add designs table and update variants

CREATE TABLE IF NOT EXISTS designs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    product_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_designs_product ON designs(product_id);

-- Add design_id to variants
ALTER TABLE variants ADD COLUMN design_id INTEGER DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_variants_design ON variants(design_id);
