import type { D1Database } from '@cloudflare/workers-types';
import { nowJalali } from '../utils/date';
import type { Coupon, CreateCouponInput, UpdateCouponInput } from './types';

export class CouponsDB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  private parseRow(row: Record<string, unknown>): Coupon {
    return {
      id: Number(row.id),
      code: String(row.code),
      discount: Number(row.discount),
      type: row.type as 'percentage' | 'fixed',
      expires_at: row.expires_at != null ? Number(row.expires_at) : null,
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async create(input: CreateCouponInput): Promise<Coupon> {
    const now = nowJalali();
    const result = await this.db.prepare(`
      INSERT INTO coupons (code, discount, type, expires_at, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      input.code,
      input.discount,
      input.type ?? 'percentage',
      input.expires_at ?? null,
      input.is_active === false ? 0 : 1,
      now,
      now,
    ).run();

    return this.getById(result.meta.last_row_id as number) as Promise<Coupon>;
  }

  async getById(id: number): Promise<Coupon | null> {
    const row = await this.db.prepare('SELECT * FROM coupons WHERE id = ?').bind(id).first();
    return row ? this.parseRow(row) : null;
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const row = await this.db.prepare('SELECT * FROM coupons WHERE code = ?').bind(code).first();
    return row ? this.parseRow(row) : null;
  }

  async list(): Promise<Coupon[]> {
    const { results } = await this.db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
    return results.map((r) => this.parseRow(r));
  }

  async listActive(): Promise<Coupon[]> {
    const { results } = await this.db.prepare(
      'SELECT * FROM coupons WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > unixepoch()) ORDER BY created_at DESC'
    ).all();
    return results.map((r) => this.parseRow(r));
  }

  async update(id: number, input: UpdateCouponInput): Promise<Coupon | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (input.code !== undefined) { fields.push('code = ?'); values.push(input.code); }
    if (input.discount !== undefined) { fields.push('discount = ?'); values.push(input.discount); }
    if (input.type !== undefined) { fields.push('type = ?'); values.push(input.type); }
    if (input.expires_at !== undefined) { fields.push('expires_at = ?'); values.push(input.expires_at); }
    if (input.is_active !== undefined) { fields.push('is_active = ?'); values.push(input.is_active ? 1 : 0); }

    if (fields.length === 0) return this.getById(id);

    const now = nowJalali();
    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await this.db.prepare(`UPDATE coupons SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM coupons WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }
}
