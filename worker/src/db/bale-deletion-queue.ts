import type { D1Database } from '@cloudflare/workers-types';

export interface BaleDeletionQueueItem {
  id: number;
  bale_chat_id: string;
  bale_message_id: number;
  order_id: number;
  message_type: 'invoice' | 'voice' | 'order_notification';
  delete_at: number;
  deleted_at: number | null;
  created_at: number;
}

export class BaleDeletionQueueDB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async add(
    baleChatId: string,
    baleMessageId: number,
    orderId: number,
    messageType: 'invoice' | 'voice' | 'order_notification',
    delayHours = 24
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const deleteAt = now + delayHours * 60 * 60;
    await this.db.prepare(`
      INSERT INTO bale_message_deletion_queue
        (bale_chat_id, bale_message_id, order_id, message_type, delete_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(baleChatId, baleMessageId, orderId, messageType, deleteAt, now).run();
  }

  async getPending(limit = 100): Promise<BaleDeletionQueueItem[]> {
    const now = Math.floor(Date.now() / 1000);
    const { results } = await this.db.prepare(`
      SELECT * FROM bale_message_deletion_queue
      WHERE delete_at <= ? AND deleted_at IS NULL
      ORDER BY delete_at ASC
      LIMIT ?
    `).bind(now, limit).all();
    return results.map((row) => ({
      id: Number(row.id),
      bale_chat_id: String(row.bale_chat_id),
      bale_message_id: Number(row.bale_message_id),
      order_id: Number(row.order_id),
      message_type: String(row.message_type) as 'invoice' | 'voice' | 'order_notification',
      delete_at: Number(row.delete_at),
      deleted_at: row.deleted_at != null ? Number(row.deleted_at) : null,
      created_at: Number(row.created_at),
    }));
  }

  async markDeleted(id: number): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    await this.db.prepare(`
      UPDATE bale_message_deletion_queue
      SET deleted_at = ?
      WHERE id = ?
    `).bind(now, id).run();
  }

  async cleanupOld(olderThanDays = 30): Promise<number> {
    const cutoff = Math.floor(Date.now() / 1000) - olderThanDays * 24 * 60 * 60;
    const result = await this.db.prepare(`
      DELETE FROM bale_message_deletion_queue
      WHERE deleted_at IS NOT NULL AND deleted_at < ?
    `).bind(cutoff).run();
    return result.meta.changes ?? 0;
  }
}
