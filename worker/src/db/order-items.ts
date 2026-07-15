import type { D1Database } from '@cloudflare/workers-types';
import type { OrderItem, CreateOrderItemInput } from './types';

export class OrderItemsDB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  private parseRow(row: Record<string, unknown>): OrderItem {
    return {
      id: Number(row.id),
      order_id: Number(row.order_id),
      product_id: Number(row.product_id),
      color_id: row.color_id != null ? Number(row.color_id) : null,
      size_id: row.size_id != null ? Number(row.size_id) : null,
      quantity: Number(row.quantity),
      price: Number(row.price),
    };
  }

  async create(input: CreateOrderItemInput): Promise<OrderItem> {
    const result = await this.db.prepare(`
      INSERT INTO order_items (order_id, product_id, color_id, size_id, quantity, price)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      input.order_id,
      input.product_id,
      input.color_id ?? null,
      input.size_id ?? null,
      input.quantity,
      input.price,
    ).run();

    return this.getById(result.meta.last_row_id as number) as Promise<OrderItem>;
  }

  async getById(id: number): Promise<OrderItem | null> {
    const row = await this.db.prepare('SELECT * FROM order_items WHERE id = ?').bind(id).first();
    return row ? this.parseRow(row) : null;
  }

  async listByOrder(orderId: number): Promise<OrderItem[]> {
    const { results } = await this.db.prepare(
      'SELECT * FROM order_items WHERE order_id = ?'
    ).bind(orderId).all();
    return results.map((r) => this.parseRow(r));
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM order_items WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }

  async deleteByOrder(orderId: number): Promise<number> {
    const result = await this.db.prepare('DELETE FROM order_items WHERE order_id = ?').bind(orderId).run();
    return result.meta.changes ?? 0;
  }
}
