-- Bale admin auth: email/password login for scarf-admin panel
-- D1: scarf-mini-app-bale

ALTER TABLE admins ADD COLUMN email TEXT;
ALTER TABLE admins ADD COLUMN password_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Default admin: admin@admin.com / admin (PBKDF2-SHA512, 100000 iterations)
INSERT OR IGNORE INTO admins (id, username, email, first_name, password_hash) VALUES
  ('admin-1', 'admin', 'admin@admin.com', 'Admin', '$pbkdf2$100000$c1c692a458cb6675f781ad445e310fe3c6a41f53b84ab8a0d84261cabb1b28f9$6007dd3a78d7dae7917d8279cfb8e0bce6e2badb23a5cdf2b724bebc018969670f0fee59b21c834cde6213af8d3c0fd4661a7c28c2d35502d9e5c8896721562d');
