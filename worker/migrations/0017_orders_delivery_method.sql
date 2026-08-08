-- Delivery method for orders (حضوری / تیپاکس / باربری)
ALTER TABLE orders ADD COLUMN delivery_method TEXT;