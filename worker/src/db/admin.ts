import type { D1Database } from '@cloudflare/workers-types';
import { nowJalali } from '../utils/date';
import type { Admin } from './types';

export class AdminsDB {
  constructor(private db: D1Database) {}

  private parseRow(row: Record<string, unknown>): Admin {
    return {
      id: String(row.id),
      customer_id: row.customer_id != null ? String(row.customer_id) : null,
      username: String(row.username),
      email: row.email != null ? String(row.email) : null,
      first_name: String(row.first_name),
      last_name: row.last_name != null ? String(row.last_name) : null,
      avatar_url: row.avatar_url != null ? String(row.avatar_url) : null,
      password_hash: row.password_hash != null ? String(row.password_hash) : null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async create(input: {
    id?: string;
    customer_id?: string;
    username: string;
    email?: string;
    first_name: string;
    last_name?: string;
    avatar_url?: string;
    password_hash?: string;
  }): Promise<Admin> {
    const now = nowJalali();
    const id = input.id || crypto.randomUUID();

    const stmt = this.db.prepare(`
      INSERT INTO admins (id, customer_id, username, email, first_name, last_name, avatar_url, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt.bind(
      id,
      input.customer_id ?? null,
      input.username,
      input.email ?? null,
      input.first_name,
      input.last_name ?? null,
      input.avatar_url ?? null,
      input.password_hash ?? null,
      now,
      now,
    ).run();

    return this.getById(id) as Promise<Admin>;
  }

  async getById(id: string): Promise<Admin | null> {
    const row = await this.db.prepare('SELECT * FROM admins WHERE id = ?').bind(id).first();
    return row ? this.parseRow(row) : null;
  }

  async findByUsername(username: string): Promise<Admin | null> {
    const row = await this.db.prepare('SELECT * FROM admins WHERE username = ?').bind(username).first();
    return row ? this.parseRow(row) : null;
  }

  async findByEmail(email: string): Promise<Admin | null> {
    const row = await this.db.prepare('SELECT * FROM admins WHERE email = ?').bind(email).first();
    return row ? this.parseRow(row) : null;
  }

  async isAdmin(id: string): Promise<boolean> {
    const admin = await this.getById(id);
    return admin !== null;
  }

  async list(): Promise<Admin[]> {
    const { results } = await this.db.prepare('SELECT * FROM admins ORDER BY created_at DESC').all();
    return results.map((r) => this.parseRow(r));
  }

  async update(id: string, input: Partial<Admin>): Promise<Admin | null> {
    const now = nowJalali();
    const fields: string[] = [];
    const values: unknown[] = [];

    if (input.username !== undefined) { fields.push('username = ?'); values.push(input.username); }
    if (input.email !== undefined) { fields.push('email = ?'); values.push(input.email); }
    if (input.first_name !== undefined) { fields.push('first_name = ?'); values.push(input.first_name); }
    if (input.last_name !== undefined) { fields.push('last_name = ?'); values.push(input.last_name); }
    if (input.avatar_url !== undefined) { fields.push('avatar_url = ?'); values.push(input.avatar_url); }
    if (input.password_hash !== undefined) { fields.push('password_hash = ?'); values.push(input.password_hash); }

    if (fields.length === 0) return this.getById(id);

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await this.db.prepare(`UPDATE admins SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM admins WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }
}
