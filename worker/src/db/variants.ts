import type { D1Database } from '@cloudflare/workers-types';
import { nowJalali } from '../utils/date';
import { slugify } from '../utils/slug';
import type { Variant, CreateVariantInput, UpdateVariantInput } from './types';

export class VariantsDB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  private parseRow(row: Record<string, unknown>): Variant {
    return {
      id: Number(row.id),
      product_id: Number(row.product_id),
      design_id: row.design_id != null ? Number(row.design_id) : null,
      slug: String(row.slug),
      color: String(row.color || ''),
      size: String(row.size || ''),
      is_stock: Boolean(row.is_stock),
      images: JSON.parse(String(row.images || '[]')),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  private async generateSlug(categoryName: string, productName: string, color: string, size: string): Promise<string> {
    const parts = [categoryName, productName, color, size]
      .filter(Boolean)
      .map(slugify);

    let slug = parts.join('-');

    // Check uniqueness and append number if needed
    const existing = await this.db.prepare('SELECT id FROM variants WHERE slug = ?').bind(slug).first();
    if (!existing) return slug;

    let counter = 1;
    while (true) {
      const candidate = `${slug}-${counter}`;
      const found = await this.db.prepare('SELECT id FROM variants WHERE slug = ?').bind(candidate).first();
      if (!found) return candidate;
      counter++;
    }
  }

  async create(input: CreateVariantInput, categoryName: string, productName: string): Promise<Variant> {
    const now = nowJalali();
    const slug = await this.generateSlug(categoryName, productName, input.color || '', input.size || '');

    const result = await this.db.prepare(`
      INSERT INTO variants (product_id, design_id, slug, color, size, is_stock, images, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      input.product_id,
      input.design_id ?? null,
      slug,
      input.color || '',
      input.size || '',
      input.is_stock === false ? 0 : 1,
      JSON.stringify(input.images || []),
      now,
      now,
    ).run();

    return this.getById(result.meta.last_row_id as number) as Promise<Variant>;
  }

  async getById(id: number): Promise<Variant | null> {
    const row = await this.db.prepare('SELECT * FROM variants WHERE id = ?').bind(id).first();
    return row ? this.parseRow(row) : null;
  }

  async getBySlug(slug: string): Promise<Variant | null> {
    const row = await this.db.prepare('SELECT * FROM variants WHERE slug = ?').bind(slug).first();
    return row ? this.parseRow(row) : null;
  }

  async list(): Promise<Variant[]> {
    const { results } = await this.db.prepare('SELECT * FROM variants ORDER BY created_at DESC').all();
    return results.map((r) => this.parseRow(r));
  }

  async listByProduct(productId: number): Promise<Variant[]> {
    const { results } = await this.db.prepare(
      'SELECT * FROM variants WHERE product_id = ? ORDER BY created_at DESC'
    ).bind(productId).all();
    return results.map((r) => this.parseRow(r));
  }

  async listInStock(): Promise<Variant[]> {
    const { results } = await this.db.prepare('SELECT * FROM variants WHERE is_stock = 1 ORDER BY created_at DESC').all();
    return results.map((r) => this.parseRow(r));
  }

  async update(id: number, input: UpdateVariantInput, categoryName?: string, productName?: string): Promise<Variant | null> {
    const now = nowJalali();
    const fields: string[] = [];
    const values: unknown[] = [];

    if (input.product_id !== undefined) { fields.push('product_id = ?'); values.push(input.product_id); }
    if (input.design_id !== undefined) { fields.push('design_id = ?'); values.push(input.design_id); }
    if (input.color !== undefined) { fields.push('color = ?'); values.push(input.color); }
    if (input.size !== undefined) { fields.push('size = ?'); values.push(input.size); }
    if (input.is_stock !== undefined) { fields.push('is_stock = ?'); values.push(input.is_stock ? 1 : 0); }
    if (input.images !== undefined) { fields.push('images = ?'); values.push(JSON.stringify(input.images)); }

    // Regenerate slug if color/size changed and names provided
    if ((input.color !== undefined || input.size !== undefined) && categoryName && productName) {
      const current = await this.getById(id);
      if (current) {
        const newSlug = await this.generateSlug(
          categoryName,
          productName,
          input.color ?? current.color,
          input.size ?? current.size,
        );
        fields.push('slug = ?');
        values.push(newSlug);
      }
    }

    if (fields.length === 0) return this.getById(id);

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await this.db.prepare(`UPDATE variants SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM variants WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }
}
