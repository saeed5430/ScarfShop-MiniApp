-- Fix sizes: split "100-130" into "100" and "130"

-- Update size 1 from "100-130" to "100"
UPDATE sizes SET dimensions = '100', updated_at = '1404/04/01 00:00:00' WHERE id = 1;

-- Update variant 1 size field
UPDATE variants SET size = '100', updated_at = '1404/04/01 00:00:00' WHERE id = 1;
