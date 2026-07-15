import type { D1Database } from '@cloudflare/workers-types';
import { nowJalali } from '../utils/date';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from './types';

export class CategoriesDB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  private parseRow(row: Record<string, unknown>): Category {
    return {
      id: Number(row.id),
      name: String(row.name),
      slug: row.slug != null ? String(row.slug) : null,
      description: String(row.description || ''),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const now = nowJalali();
    const result = await this.db.prepare(
      'INSERT INTO categories (name, slug, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(input.name, input.slug ?? null, input.description ?? '', now, now).run();

    return this.getById(result.meta.last_row_id as number) as Promise<Category>;
  }

  async getById(id: number): Promise<Category | null> {
    const row = await this.db.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first();
    return row ? this.parseRow(row) : null;
  }

  async list(): Promise<Category[]> {
    const { results } = await this.db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    return results.map((r) => this.parseRow(r));
  }

  async update(id: number, input: UpdateCategoryInput): Promise<Category | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
    if (input.slug !== undefined) { fields.push('slug = ?'); values.push(input.slug); }
    if (input.description !== undefined) { fields.push('description = ?'); values.push(input.description); }

    if (fields.length === 0) return this.getById(id);

    const now = nowJalali();
    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await this.db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }

  async getProductCount(categoryId: number): Promise<number> {
    const row = await this.db.prepare(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?'
    ).bind(categoryId).first();
    return Number(row?.count ?? 0);
  }

  async isUsedInProducts(categoryId: number): Promise<boolean> {
    const count = await this.getProductCount(categoryId);
    return count > 0;
  }
}
