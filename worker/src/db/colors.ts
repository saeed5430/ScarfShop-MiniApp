import type { D1Database } from '@cloudflare/workers-types';
import { nowJalali } from '../utils/date';
import type { Color, CreateColorInput, UpdateColorInput } from './types';

export class ColorsDB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  private parseRow(row: Record<string, unknown>): Color {
    return {
      id: Number(row.id),
      name: String(row.name),
      name_en: String(row.name_en),
      hex: String(row.hex),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async create(input: CreateColorInput): Promise<Color> {
    const now = nowJalali();
    const result = await this.db.prepare(
      'INSERT INTO colors (name, name_en, hex, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(input.name, input.name_en, input.hex, now, now).run();

    return this.getById(result.meta.last_row_id as number) as Promise<Color>;
  }

  async getById(id: number): Promise<Color | null> {
    const row = await this.db.prepare('SELECT * FROM colors WHERE id = ?').bind(id).first();
    return row ? this.parseRow(row) : null;
  }

  async list(): Promise<Color[]> {
    const { results } = await this.db.prepare('SELECT * FROM colors ORDER BY id ASC').all();
    return results.map((r) => this.parseRow(r));
  }

  async update(id: number, input: UpdateColorInput): Promise<Color | null> {
    const now = nowJalali();
    const fields: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
    if (input.name_en !== undefined) { fields.push('name_en = ?'); values.push(input.name_en); }
    if (input.hex !== undefined) { fields.push('hex = ?'); values.push(input.hex); }

    if (fields.length === 0) return this.getById(id);

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await this.db.prepare(`UPDATE colors SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM colors WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }

  async getProductCount(colorId: number): Promise<number> {
    const row = await this.db.prepare(
      'SELECT COUNT(*) as count FROM product_colors WHERE color_id = ?'
    ).bind(colorId).first();
    return Number(row?.count ?? 0);
  }

  async isUsedInProducts(colorId: number): Promise<boolean> {
    const count = await this.getProductCount(colorId);
    return count > 0;
  }
}
