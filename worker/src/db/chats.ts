import type { D1Database } from '@cloudflare/workers-types';
import type { Chat } from './types';

export class ChatsDB {
  constructor(private db: D1Database) {}

  async addMessage(input: {
    user_id: string;
    message: string;
    sender_type: 'user' | 'assistant';
    ai_connected?: boolean;
  }): Promise<Chat> {
    const stmt = this.db.prepare(`
      INSERT INTO chats (user_id, message, sender_type, ai_connected)
      VALUES (?, ?, ?, ?)
    `);

    const result = await stmt.bind(
      input.user_id,
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

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<Chat[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM chats
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `);
    const results = await stmt.bind(userId, limit, offset).all<Chat>();
    return results.results;
  }

  async getConversation(userId: string, limit = 20): Promise<Chat[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM chats
      WHERE user_id = ?
      ORDER BY timestamp ASC
      LIMIT ?
    `);
    const results = await stmt.bind(userId, limit).all<Chat>();
    return results.results;
  }

  async getRecentMessages(userId: string, count = 10): Promise<Chat[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM (
        SELECT * FROM chats
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      ) ORDER BY timestamp ASC
    `);
    const results = await stmt.bind(userId, count).all<Chat>();
    return results.results;
  }

  async countByUserId(userId: string): Promise<number> {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM chats WHERE user_id = ?');
    const result = await stmt.bind(userId).first<{ count: number }>();
    return result?.count ?? 0;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const stmt = this.db.prepare('DELETE FROM chats WHERE user_id = ?');
    const result = await stmt.bind(userId).run();
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
