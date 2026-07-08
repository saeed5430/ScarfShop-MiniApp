-- Migration: Move images to products table

-- Add images to products
ALTER TABLE products ADD COLUMN images TEXT DEFAULT '[]';

-- Remove images from variants (keep for backward compat, just ignore)
-- We'll stop using variants.images
