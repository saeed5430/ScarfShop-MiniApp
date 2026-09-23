import type { D1Database } from '@cloudflare/workers-types';

export interface BaleOrderMessage {
  order_id: number;
  bale_chat_id: string;
  bale_message_id: number;
}

export interface BaleOrderWaiting {
  bale_user_id: string;
  order_id: number;
  waiting_action: 'invoice_photo' | 'voice';
  expires_at: number;
}

export class BaleOrderDB {
  constructor(private readonly db: D1Database) {}

  async addMessage(orderId: number, chatId: string, messageId: number): Promise<void> {
    await this.db.prepare(`
      INSERT INTO bale_order_messages (order_id, bale_chat_id, bale_message_id)
      VALUES (?, ?, ?)
      ON CONFLICT(order_id, bale_chat_id) DO UPDATE SET bale_message_id = excluded.bale_message_id
    `).bind(orderId, chatId, messageId).run();
  }

  async listMessages(orderId: number): Promise<BaleOrderMessage[]> {
    const { results } = await this.db.prepare(
      'SELECT order_id, bale_chat_id, bale_message_id FROM bale_order_messages WHERE order_id = ?'
    ).bind(orderId).all();
    return results.map((row) => ({
      order_id: Number(row.order_id),
      bale_chat_id: String(row.bale_chat_id),
      bale_message_id: Number(row.bale_message_id),
    }));
  }

  async setWaiting(userId: string, orderId: number, action: BaleOrderWaiting['waiting_action']): Promise<void> {
    await this.db.prepare(`
      INSERT INTO bale_order_waiting (bale_user_id, order_id, waiting_action, expires_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(bale_user_id) DO UPDATE SET order_id = excluded.order_id, waiting_action = excluded.waiting_action, expires_at = excluded.expires_at
    `).bind(userId, orderId, action, Math.floor(Date.now() / 1000) + 600).run();
  }

  async getWaiting(userId: string): Promise<BaleOrderWaiting | null> {
    const row = await this.db.prepare(
      'SELECT bale_user_id, order_id, waiting_action, expires_at FROM bale_order_waiting WHERE bale_user_id = ?'
    ).bind(userId).first();
    if (!row) return null;
    const waiting: BaleOrderWaiting = {
      bale_user_id: String(row.bale_user_id),
      order_id: Number(row.order_id),
      waiting_action: row.waiting_action as BaleOrderWaiting['waiting_action'],
      expires_at: Number(row.expires_at),
    };
    if (waiting.expires_at < Math.floor(Date.now() / 1000)) {
      await this.clear(userId);
      return null;
    }
    return waiting;
  }

  async clear(userId: string): Promise<void> {
    await this.db.prepare('DELETE FROM bale_order_waiting WHERE bale_user_id = ?').bind(userId).run();
  }
}
