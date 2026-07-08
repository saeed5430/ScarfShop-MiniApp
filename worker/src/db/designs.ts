import type { D1Database } from '@cloudflare/workers-types';
import { nowJalali } from '../utils/date';
import type { Design, CreateDesignInput, UpdateDesignInput } from './types';

export class DesignsDB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  private parseRow(row: Record<string, unknown>): Design {
    return {
      id: Number(row.id),
      name: String(row.name),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async create(input: CreateDesignInput): Promise<Design> {
    const now = nowJalali();
    const result = await this.db.prepare(
      'INSERT INTO designs (name, created_at, updated_at) VALUES (?, ?, ?)'
    ).bind(input.name, now, now).run();

    return this.getById(result.meta.last_row_id as number) as Promise<Design>;
  }

  async getById(id: number): Promise<Design | null> {
    const row = await this.db.prepare('SELECT * FROM designs WHERE id = ?').bind(id).first();
    return row ? this.parseRow(row) : null;
  }

  async list(): Promise<Design[]> {
    const { results } = await this.db.prepare('SELECT * FROM designs ORDER BY name ASC').all();
    return results.map((r) => this.parseRow(r));
  }

  async update(id: number, input: UpdateDesignInput): Promise<Design | null> {
    if (!input.name) return this.getById(id);

    const now = nowJalali();
    await this.db.prepare('UPDATE designs SET name = ?, updated_at = ? WHERE id = ?')
      .bind(input.name, now, id).run();

    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM designs WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }
}
