import type { D1Database } from '@cloudflare/workers-types';
import type { Setting, UpdateSettingInput } from './types';

export class SettingsDB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  private parseRow(row: Record<string, unknown>): Setting {
    return {
      id: Number(row.id),
      key: String(row.key),
      value: row.value != null ? String(row.value) : null,
      type: String(row.type || 'text') as Setting['type'],
      label: String(row.label),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async list(): Promise<Setting[]> {
    const { results } = await this.db.prepare('SELECT * FROM settings ORDER BY id').all();
    return results.map((r) => this.parseRow(r));
  }

  async getByKey(key: string): Promise<Setting | null> {
    const row = await this.db.prepare('SELECT * FROM settings WHERE key = ?').bind(key).first();
    return row ? this.parseRow(row) : null;
  }

  async getById(id: number): Promise<Setting | null> {
    const row = await this.db.prepare('SELECT * FROM settings WHERE id = ?').bind(id).first();
    return row ? this.parseRow(row) : null;
  }

  async update(key: string, input: UpdateSettingInput): Promise<Setting | null> {
    const now = Math.floor(Date.now() / 1000);
    await this.db.prepare(
      'UPDATE settings SET value = ?, updated_at = ? WHERE key = ?'
    ).bind(input.value, now, key).run();
    return this.getByKey(key);
  }

  async upsert(key: string, value: string): Promise<Setting> {
    const now = Math.floor(Date.now() / 1000);
    await this.db.prepare(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?'
    ).bind(key, value, now, value, now).run();
    return this.getByKey(key) as Promise<Setting>;
  }

  async getMap(): Promise<Record<string, string>> {
    const items = await this.list();
    const map: Record<string, string> = {};
    for (const item of items) {
      if (item.value !== null) {
        map[item.key] = item.value;
      }
    }
    return map;
  }
}
