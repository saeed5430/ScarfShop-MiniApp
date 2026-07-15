import type { D1Database } from '@cloudflare/workers-types';
import type { Session } from './types';

export class SessionsDB {
  constructor(private db: D1Database) {}

  async create(customerId: string): Promise<Session> {
    const sessionId = crypto.randomUUID();
    const token = crypto.randomUUID();

    const stmt = this.db.prepare(`
      INSERT INTO sessions (session_id, customer_id, token)
      VALUES (?, ?, ?)
    `);

    await stmt.bind(sessionId, customerId, token).run();

    return this.findById(sessionId) as Promise<Session>;
  }

  async findById(sessionId: string): Promise<Session | null> {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE session_id = ?');
    const row = await stmt.bind(sessionId).first<Session>();
    return row ?? null;
  }

  async findByToken(token: string): Promise<Session | null> {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE token = ?');
    const row = await stmt.bind(token).first<Session>();
    return row ?? null;
  }

  async findValidByToken(token: string): Promise<Session | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions
      WHERE token = ? AND expires_at > unixepoch()
    `);
    const row = await stmt.bind(token).first<Session>();
    return row ?? null;
  }

  async findValidByCustomerId(customerId: string): Promise<Session | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions
      WHERE customer_id = ? AND expires_at > unixepoch()
      ORDER BY created_at DESC
      LIMIT 1
    `);
    const row = await stmt.bind(customerId).first<Session>();
    return row ?? null;
  }

  async delete(sessionId: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE session_id = ?');
    const result = await stmt.bind(sessionId).run();
    return result.meta.changes > 0;
  }

  async deleteByCustomerId(customerId: string): Promise<number> {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE customer_id = ?');
    const result = await stmt.bind(customerId).run();
    return result.meta.changes;
  }

  async deleteExpired(): Promise<number> {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE expires_at <= unixepoch()');
    const result = await stmt.run();
    return result.meta.changes;
  }

  async extend(sessionId: string, hours = 24): Promise<boolean> {
    const stmt = this.db.prepare(`
      UPDATE sessions SET expires_at = unixepoch() + ? * 3600
      WHERE session_id = ? AND expires_at > unixepoch()
    `);
    const result = await stmt.bind(hours, sessionId).run();
    return result.meta.changes > 0;
  }
}
