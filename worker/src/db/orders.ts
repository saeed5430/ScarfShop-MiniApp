import type { D1Database } from '@cloudflare/workers-types';
import { nowJalali } from '../utils/date';
import type { Order, CreateOrderInput, UpdateOrderInput } from './types';

export class OrdersDB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  private parseRow(row: Record<string, unknown>): Order {
    return {
      id: Number(row.id),
      user_id: String(row.user_id),
      payment_status: row.payment_status as 'pending' | 'paid',
      notes: row.notes != null ? String(row.notes) : null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async create(input: CreateOrderInput): Promise<Order> {
    const now = nowJalali();
    const result = await this.db.prepare(`
      INSERT INTO orders (user_id, payment_status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      input.user_id,
      input.payment_status ?? 'pending',
      input.notes ?? null,
      now,
      now,
    ).run();

    return this.getById(result.meta.last_row_id as number) as Promise<Order>;
  }

  async getById(id: number): Promise<Order | null> {
    const row = await this.db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
    return row ? this.parseRow(row) : null;
  }

  async list(limit = 50, offset = 0): Promise<Order[]> {
    const { results } = await this.db.prepare(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(limit, offset).all();
    return results.map((r) => this.parseRow(r));
  }

  async listByUser(userId: string): Promise<Order[]> {
    const { results } = await this.db.prepare(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all();
    return results.map((r) => this.parseRow(r));
  }

  async count(): Promise<number> {
    const result = await this.db.prepare('SELECT COUNT(*) as count FROM orders').first<{ count: number }>();
    return result?.count ?? 0;
  }

  async update(id: number, input: UpdateOrderInput): Promise<Order | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (input.payment_status !== undefined) { fields.push('payment_status = ?'); values.push(input.payment_status); }
    if (input.notes !== undefined) { fields.push('notes = ?'); values.push(input.notes); }

    if (fields.length === 0) return this.getById(id);

    const now = nowJalali();
    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await this.db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM orders WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }
}
