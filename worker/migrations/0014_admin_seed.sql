-- Migration 0014: Seed admin user @saeed54300
INSERT OR IGNORE INTO admins (id, username, first_name, created_at, updated_at) VALUES
('admin_saeed54300', 'saeed54300', 'سعید', unixepoch(), unixepoch());
