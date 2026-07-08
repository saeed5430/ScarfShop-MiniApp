import type { D1Database } from '@cloudflare/workers-types';
import { nowJalali } from '../utils/date';
import type { Product, CreateProductInput, UpdateProductInput } from './types';

export class ProductsDB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  private parseRow(row: Record<string, unknown>): Product {
    return {
      id: Number(row.id),
      name: String(row.name),
      category_id: Number(row.category_id),
      description: String(row.description || ''),
      short_description: String(row.short_description || ''),
      is_active: Boolean(row.is_active),
      material: String(row.material || ''),
      images: JSON.parse(String(row.images || '[]')),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async create(input: CreateProductInput): Promise<Product> {
    const now = nowJalali();
    const result = await this.db.prepare(`
      INSERT INTO products (name, category_id, description, short_description, is_active, material, images, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      input.name,
      input.category_id,
      input.description || '',
      input.short_description || '',
      input.is_active === false ? 0 : 1,
      input.material || '',
      JSON.stringify(input.images || []),
      now,
      now,
    ).run();

    return this.getById(result.meta.last_row_id as number) as Promise<Product>;
  }

  async getById(id: number): Promise<Product | null> {
    const row = await this.db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
    return row ? this.parseRow(row) : null;
  }

  async list(): Promise<Product[]> {
    const { results } = await this.db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    return results.map((r) => this.parseRow(r));
  }

  async listActive(): Promise<Product[]> {
    const { results } = await this.db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC').all();
    return results.map((r) => this.parseRow(r));
  }

  async listByCategory(categoryId: number): Promise<Product[]> {
    const { results } = await this.db.prepare(
      'SELECT * FROM products WHERE category_id = ? AND is_active = 1 ORDER BY created_at DESC'
    ).bind(categoryId).all();
    return results.map((r) => this.parseRow(r));
  }

  async search(query: string): Promise<Product[]> {
    const { results } = await this.db.prepare(
      "SELECT * FROM products WHERE (name LIKE ? OR description LIKE ? OR short_description LIKE ?) AND is_active = 1 ORDER BY created_at DESC"
    ).bind(`%${query}%`, `%${query}%`, `%${query}%`).all();
    return results.map((r) => this.parseRow(r));
  }

  async update(id: number, input: UpdateProductInput): Promise<Product | null> {
    const now = nowJalali();
    const fields: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
    if (input.category_id !== undefined) { fields.push('category_id = ?'); values.push(input.category_id); }
    if (input.description !== undefined) { fields.push('description = ?'); values.push(input.description); }
    if (input.short_description !== undefined) { fields.push('short_description = ?'); values.push(input.short_description); }
    if (input.is_active !== undefined) { fields.push('is_active = ?'); values.push(input.is_active ? 1 : 0); }
    if (input.material !== undefined) { fields.push('material = ?'); values.push(input.material); }
    if (input.images !== undefined) { fields.push('images = ?'); values.push(JSON.stringify(input.images)); }

    if (fields.length === 0) return this.getById(id);

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await this.db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }
}
