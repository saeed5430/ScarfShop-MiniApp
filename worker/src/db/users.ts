import type { D1Database } from '@cloudflare/workers-types';
import type { User, CreateUserInput, UpdateUserInput } from './types';
import { nowJalali } from '../utils/date';

export class UsersDB {
  constructor(private db: D1Database) {}

  async create(input: CreateUserInput): Promise<User> {
    const jalaliNow = nowJalali();

    const stmt = this.db.prepare(`
      INSERT INTO users (id, first_name, last_name, username, language_code, avatar_url, is_premium, invite_code, created_at, last_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        username = excluded.username,
        language_code = excluded.language_code,
        avatar_url = excluded.avatar_url,
        is_premium = excluded.is_premium,
        last_active = excluded.last_active
    `);

    await stmt.bind(
      input.id,
      input.first_name,
      input.last_name ?? null,
      input.username ?? null,
      input.language_code ?? null,
      input.avatar_url ?? null,
      input.is_premium ? 1 : 0,
      input.invite_code ?? null,
      jalaliNow,
      jalaliNow
    ).run();

    return this.findById(input.id) as Promise<User>;
  }

  async findById(id: string): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const row = await stmt.bind(id).first<User>();
    return row ?? null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    const row = await stmt.bind(username).first<User>();
    return row ?? null;
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (input.first_name !== undefined) {
      fields.push('first_name = ?');
      values.push(input.first_name);
    }
    if (input.last_name !== undefined) {
      fields.push('last_name = ?');
      values.push(input.last_name);
    }
    if (input.username !== undefined) {
      fields.push('username = ?');
      values.push(input.username);
    }
    if (input.language_code !== undefined) {
      fields.push('language_code = ?');
      values.push(input.language_code);
    }
    if (input.avatar_url !== undefined) {
      fields.push('avatar_url = ?');
      values.push(input.avatar_url);
    }
    if (input.phone !== undefined) {
      fields.push('phone = ?');
      values.push(input.phone);
    }
    if (input.address !== undefined) {
      fields.push('address = ?');
      values.push(input.address);
    }
    if (input.postal_code !== undefined) {
      fields.push('postal_code = ?');
      values.push(input.postal_code);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const stmt = this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    await stmt.bind(...values).run();

    return this.findById(id);
  }

  async updateLastActive(id: string): Promise<void> {
    const jalaliNow = nowJalali();
    const stmt = this.db.prepare('UPDATE users SET last_active = ? WHERE id = ?');
    await stmt.bind(jalaliNow, id).run();
  }

  async list(limit = 50, offset = 0): Promise<User[]> {
    const stmt = this.db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?');
    const results = await stmt.bind(limit, offset).all<User>();
    return results.results;
  }

  async count(): Promise<number> {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM users');
    const result = await stmt.first<{ count: number }>();
    return result?.count ?? 0;
  }

  async delete(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = await stmt.bind(id).run();
    return result.meta.changes > 0;
  }
}
