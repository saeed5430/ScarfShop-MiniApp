import type { D1Database } from '@cloudflare/workers-types';

export interface TelegramOrderMessage {
  order_id: number;
  telegram_chat_id: string;
  telegram_message_id: number;
}

export interface TelegramOrderWaiting {
  telegram_user_id: string;
  order_id: number;
  waiting_action: 'invoice_photo' | 'voice';
  expires_at: number;
}

export class OrderTelegramDB {
  constructor(private readonly db: D1Database) {}

  async addMessage(orderId: number, chatId: string, messageId: number): Promise<void> {
    await this.db.prepare(`
      INSERT INTO order_telegram_messages (order_id, telegram_chat_id, telegram_message_id)
      VALUES (?, ?, ?)
      ON CONFLICT(order_id, telegram_chat_id) DO UPDATE SET telegram_message_id = excluded.telegram_message_id
    `).bind(orderId, chatId, messageId).run();
  }

  async listMessages(orderId: number): Promise<TelegramOrderMessage[]> {
    const { results } = await this.db.prepare(
      'SELECT order_id, telegram_chat_id, telegram_message_id FROM order_telegram_messages WHERE order_id = ?'
    ).bind(orderId).all();
    return results.map((row) => ({
      order_id: Number(row.order_id),
      telegram_chat_id: String(row.telegram_chat_id),
      telegram_message_id: Number(row.telegram_message_id),
    }));
  }

  async setWaiting(userId: string, orderId: number, action: TelegramOrderWaiting['waiting_action']): Promise<void> {
    await this.db.prepare(`
      INSERT INTO telegram_order_waiting (telegram_user_id, order_id, waiting_action, expires_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(telegram_user_id) DO UPDATE SET order_id = excluded.order_id, waiting_action = excluded.waiting_action, expires_at = excluded.expires_at
    `).bind(userId, orderId, action, Math.floor(Date.now() / 1000) + 600).run();
  }

  async getWaiting(userId: string): Promise<TelegramOrderWaiting | null> {
    const row = await this.db.prepare(
      'SELECT telegram_user_id, order_id, waiting_action, expires_at FROM telegram_order_waiting WHERE telegram_user_id = ?'
    ).bind(userId).first();
    if (!row) return null;
    const waiting: TelegramOrderWaiting = {
      telegram_user_id: String(row.telegram_user_id),
      order_id: Number(row.order_id),
      waiting_action: row.waiting_action as TelegramOrderWaiting['waiting_action'],
      expires_at: Number(row.expires_at),
    };
    if (waiting.expires_at < Math.floor(Date.now() / 1000)) {
      await this.clear(userId);
      return null;
    }
    return waiting;
  }

  async clear(userId: string): Promise<void> {
    await this.db.prepare('DELETE FROM telegram_order_waiting WHERE telegram_user_id = ?').bind(userId).run();
  }
}
