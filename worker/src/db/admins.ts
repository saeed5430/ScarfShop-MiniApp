import type { D1Database } from '@cloudflare/workers-types';
import type { Admin } from './types';

export class AdminsDB {
  constructor(private db: D1Database) {}

  async add(input: {
    id: string;
    username: string;
    first_name: string;
    last_name?: string;
    avatar_url?: string;
  }): Promise<Admin> {
    const stmt = this.db.prepare(`
      INSERT INTO admins (id, username, first_name, last_name, avatar_url)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username = excluded.username,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        avatar_url = excluded.avatar_url
    `);

    await stmt.bind(
      input.id,
      input.username,
      input.first_name,
      input.last_name ?? null,
      input.avatar_url ?? null
    ).run();

    return this.findById(input.id) as Promise<Admin>;
  }

  async findById(id: string): Promise<Admin | null> {
    const stmt = this.db.prepare('SELECT * FROM admins WHERE id = ?');
    const row = await stmt.bind(id).first<Admin>();
    return row ?? null;
  }

  async findByUsername(username: string): Promise<Admin | null> {
    const stmt = this.db.prepare('SELECT * FROM admins WHERE username = ?');
    const row = await stmt.bind(username).first<Admin>();
    return row ?? null;
  }

  async isAdmin(id: string): Promise<boolean> {
    const admin = await this.findById(id);
    return admin !== null;
  }

  async isAdminByUsername(username: string): Promise<boolean> {
    const admin = await this.findByUsername(username);
    return admin !== null;
  }

  async list(): Promise<Admin[]> {
    const stmt = this.db.prepare('SELECT * FROM admins ORDER BY created_at DESC');
    const results = await stmt.all<Admin>();
    return results.results;
  }

  async remove(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM admins WHERE id = ?');
    const result = await stmt.bind(id).run();
    return result.meta.changes > 0;
  }
}
