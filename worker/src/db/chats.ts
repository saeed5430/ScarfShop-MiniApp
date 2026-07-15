import type { D1Database } from '@cloudflare/workers-types';
import type { Chat } from './types';

export class ChatsDB {
  constructor(private db: D1Database) {}

  async addMessage(input: {
    customer_id: string;
    message: string;
    sender_type: 'user' | 'assistant';
    ai_connected?: boolean;
  }): Promise<Chat> {
    const stmt = this.db.prepare(`
      INSERT INTO chats (customer_id, message, sender_type, ai_connected)
      VALUES (?, ?, ?, ?)
    `);

    const result = await stmt.bind(
      input.customer_id,
      input.message,
      input.sender_type,
      input.ai_connected ? 1 : 0
    ).run();

    const id = result.meta.last_row_id;
    return this.findById(id as number) as Promise<Chat>;
  }

  async findById(id: number): Promise<Chat | null> {
    const stmt = this.db.prepare('SELECT * FROM chats WHERE id = ?');
    const row = await stmt.bind(id).first<Chat>();
    return row ?? null;
  }

  async findByCustomerId(customerId: string, limit = 50, offset = 0): Promise<Chat[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM chats
      WHERE customer_id = ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `);
    const results = await stmt.bind(customerId, limit, offset).all<Chat>();
    return results.results;
  }

  async getConversation(customerId: string, limit = 20): Promise<Chat[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM chats
      WHERE customer_id = ?
      ORDER BY timestamp ASC
      LIMIT ?
    `);
    const results = await stmt.bind(customerId, limit).all<Chat>();
    return results.results;
  }

  async getRecentMessages(customerId: string, count = 10): Promise<Chat[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM (
        SELECT * FROM chats
        WHERE customer_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      ) ORDER BY timestamp ASC
    `);
    const results = await stmt.bind(customerId, count).all<Chat>();
    return results.results;
  }

  async countByCustomerId(customerId: string): Promise<number> {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM chats WHERE customer_id = ?');
    const result = await stmt.bind(customerId).first<{ count: number }>();
    return result?.count ?? 0;
  }

  async deleteByCustomerId(customerId: string): Promise<number> {
    const stmt = this.db.prepare('DELETE FROM chats WHERE customer_id = ?');
    const result = await stmt.bind(customerId).run();
    return result.meta.changes;
  }

  async deleteOlderThan(days = 30): Promise<number> {
    const stmt = this.db.prepare(`
      DELETE FROM chats WHERE timestamp < unixepoch() - ? * 86400
    `);
    const result = await stmt.bind(days).run();
    return result.meta.changes;
  }
}
