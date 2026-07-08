-- Migration: Fix designs table (remove product_id - designs are independent)

DROP TABLE IF EXISTS designs;

CREATE TABLE IF NOT EXISTS designs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
