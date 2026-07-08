import type { D1Database } from '@cloudflare/workers-types';
import { nowJalali } from '../utils/date';
import type { Size, CreateSizeInput, UpdateSizeInput } from './types';

export class SizesDB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  private parseRow(row: Record<string, unknown>): Size {
    return {
      id: Number(row.id),
      dimensions: String(row.dimensions),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async create(input: CreateSizeInput): Promise<Size> {
    const now = nowJalali();
    const result = await this.db.prepare(
      'INSERT INTO sizes (dimensions, created_at, updated_at) VALUES (?, ?, ?)'
    ).bind(input.dimensions, now, now).run();

    return this.getById(result.meta.last_row_id as number) as Promise<Size>;
  }

  async getById(id: number): Promise<Size | null> {
    const row = await this.db.prepare('SELECT * FROM sizes WHERE id = ?').bind(id).first();
    return row ? this.parseRow(row) : null;
  }

  async list(): Promise<Size[]> {
    const { results } = await this.db.prepare('SELECT * FROM sizes ORDER BY id ASC').all();
    return results.map((r) => this.parseRow(r));
  }

  async update(id: number, input: UpdateSizeInput): Promise<Size | null> {
    if (!input.dimensions) return this.getById(id);

    const now = nowJalali();
    await this.db.prepare('UPDATE sizes SET dimensions = ?, updated_at = ? WHERE id = ?')
      .bind(input.dimensions, now, id).run();

    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM sizes WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }
}
