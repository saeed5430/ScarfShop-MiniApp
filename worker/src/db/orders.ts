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
      receipt_file_id: row.receipt_file_id != null ? String(row.receipt_file_id) : null,
      receipt_file_type: row.receipt_file_type != null ? row.receipt_file_type as 'photo' | 'voice' : null,
      receipt_uploaded_at: row.receipt_uploaded_at != null ? Number(row.receipt_uploaded_at) : null,
      telegram_chat_id: row.telegram_chat_id != null ? String(row.telegram_chat_id) : null,
      telegram_order_message_id: row.telegram_order_message_id != null ? Number(row.telegram_order_message_id) : null,
      invoice_file_id: row.invoice_file_id != null ? String(row.invoice_file_id) : null,
      invoice_uploaded_at: row.invoice_uploaded_at != null ? Number(row.invoice_uploaded_at) : null,
      voice_file_id: row.voice_file_id != null ? String(row.voice_file_id) : null,
      voice_uploaded_at: row.voice_uploaded_at != null ? Number(row.voice_uploaded_at) : null,
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

  async saveReceipt(id: number, type: 'photo' | 'voice', fileId: string): Promise<Order | null> {
    const now = Math.floor(Date.now() / 1000);
    const field = type === 'photo' ? 'invoice_file_id' : 'voice_file_id';
    const uploadedField = type === 'photo' ? 'invoice_uploaded_at' : 'voice_uploaded_at';
    await this.db.prepare(`
      UPDATE orders
      SET receipt_file_id = ?, receipt_file_type = ?, receipt_uploaded_at = ?,
          ${field} = ?, ${uploadedField} = ?, updated_at = ?
      WHERE id = ?
    `).bind(fileId, type, now, fileId, now, now, id).run();
    return this.getById(id);
  }

  async saveTelegramMessage(id: number, chatId: string, messageId: number): Promise<void> {
    await this.db.prepare(`
      UPDATE orders SET telegram_chat_id = ?, telegram_order_message_id = ? WHERE id = ?
    `).bind(chatId, messageId, id).run();
  }
}
