import type { D1Database } from '@cloudflare/workers-types';
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from './types';
import { nowJalali } from '../utils/date';

export class CustomersDB {
  constructor(private db: D1Database) {}

  async create(input: CreateCustomerInput): Promise<Customer> {
    const jalaliNow = nowJalali();

    const stmt = this.db.prepare(`
      INSERT INTO customers (id, first_name, last_name, username, language_code, avatar_url, is_premium, invite_code, created_at, last_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    return this.findById(input.id) as Promise<Customer>;
  }

  // Update only Telegram-related fields (safe fields)
  async updateTelegramFields(telegramUser: {
    id: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
    is_premium?: boolean;
  }): Promise<Customer | null> {
    const existing = await this.findById(telegramUser.id);

    if (!existing) {
      // New customer - create with Telegram data
      return this.create({
        id: telegramUser.id,
        first_name: telegramUser.first_name || 'کاربر',
        last_name: telegramUser.last_name,
        username: telegramUser.username,
        language_code: telegramUser.language_code,
        avatar_url: telegramUser.photo_url,
        is_premium: telegramUser.is_premium,
      });
    }

    // Existing customer - only update safe fields (NOT phone, address, postal_code)
    const now = nowJalali();
    const stmt = this.db.prepare(`
      UPDATE customers SET
        username = COALESCE(?, username),
        language_code = COALESCE(?, language_code),
        avatar_url = COALESCE(?, avatar_url),
        last_active = ?
      WHERE id = ?
    `);

    await stmt.bind(
      telegramUser.username ?? null,
      telegramUser.language_code ?? null,
      telegramUser.photo_url ?? null,
      now,
      telegramUser.id,
    ).run();

    return this.findById(telegramUser.id);
  }

  async findById(id: string): Promise<Customer | null> {
    const stmt = this.db.prepare('SELECT * FROM customers WHERE id = ?');
    const row = await stmt.bind(id).first<Customer>();
    return row ?? null;
  }

  async findByUsername(username: string): Promise<Customer | null> {
    const stmt = this.db.prepare('SELECT * FROM customers WHERE username = ?');
    const row = await stmt.bind(username).first<Customer>();
    return row ?? null;
  }

  async update(id: string, input: UpdateCustomerInput): Promise<Customer | null> {
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
    const stmt = this.db.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`);
    await stmt.bind(...values).run();

    return this.findById(id);
  }

  async updateLastActive(id: string): Promise<void> {
    const jalaliNow = nowJalali();
    const stmt = this.db.prepare('UPDATE customers SET last_active = ? WHERE id = ?');
    await stmt.bind(jalaliNow, id).run();
  }

  async list(limit = 50, offset = 0): Promise<Customer[]> {
    const stmt = this.db.prepare('SELECT * FROM customers ORDER BY created_at DESC LIMIT ? OFFSET ?');
    const results = await stmt.bind(limit, offset).all<Customer>();
    return results.results;
  }

  async count(): Promise<number> {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM customers');
    const result = await stmt.first<{ count: number }>();
    return result?.count ?? 0;
  }

  async delete(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM customers WHERE id = ?');
    const result = await stmt.bind(id).run();
    return result.meta.changes > 0;
  }
}
