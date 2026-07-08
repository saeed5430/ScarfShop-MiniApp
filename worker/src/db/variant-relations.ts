import type { D1Database } from '@cloudflare/workers-types';

export class VariantRelationsDB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // --- Colors ---

  async addColor(variantId: number, colorId: number): Promise<void> {
    await this.db.prepare(
      'INSERT OR IGNORE INTO variant_colors (variant_id, color_id) VALUES (?, ?)'
    ).bind(variantId, colorId).run();
  }

  async removeColor(variantId: number, colorId: number): Promise<void> {
    await this.db.prepare(
      'DELETE FROM variant_colors WHERE variant_id = ? AND color_id = ?'
    ).bind(variantId, colorId).run();
  }

  async getColorsByVariant(variantId: number): Promise<number[]> {
    const { results } = await this.db.prepare(
      'SELECT color_id FROM variant_colors WHERE variant_id = ?'
    ).bind(variantId).all();
    return results.map((r) => Number(r.color_id));
  }

  async getVariantsByColor(colorId: number): Promise<number[]> {
    const { results } = await this.db.prepare(
      'SELECT variant_id FROM variant_colors WHERE color_id = ?'
    ).bind(colorId).all();
    return results.map((r) => Number(r.variant_id));
  }

  async setColors(variantId: number, colorIds: number[]): Promise<void> {
    await this.db.prepare('DELETE FROM variant_colors WHERE variant_id = ?').bind(variantId).run();
    for (const colorId of colorIds) {
      await this.db.prepare(
        'INSERT INTO variant_colors (variant_id, color_id) VALUES (?, ?)'
      ).bind(variantId, colorId).run();
    }
  }

  // --- Sizes ---

  async addSize(variantId: number, sizeId: number): Promise<void> {
    await this.db.prepare(
      'INSERT OR IGNORE INTO variant_sizes (variant_id, size_id) VALUES (?, ?)'
    ).bind(variantId, sizeId).run();
  }

  async removeSize(variantId: number, sizeId: number): Promise<void> {
    await this.db.prepare(
      'DELETE FROM variant_sizes WHERE variant_id = ? AND size_id = ?'
    ).bind(variantId, sizeId).run();
  }

  async getSizesByVariant(variantId: number): Promise<number[]> {
    const { results } = await this.db.prepare(
      'SELECT size_id FROM variant_sizes WHERE variant_id = ?'
    ).bind(variantId).all();
    return results.map((r) => Number(r.size_id));
  }

  async getVariantsBySize(sizeId: number): Promise<number[]> {
    const { results } = await this.db.prepare(
      'SELECT variant_id FROM variant_sizes WHERE size_id = ?'
    ).bind(sizeId).all();
    return results.map((r) => Number(r.variant_id));
  }

  async setSizes(variantId: number, sizeIds: number[]): Promise<void> {
    await this.db.prepare('DELETE FROM variant_sizes WHERE variant_id = ?').bind(variantId).run();
    for (const sizeId of sizeIds) {
      await this.db.prepare(
        'INSERT INTO variant_sizes (variant_id, size_id) VALUES (?, ?)'
      ).bind(variantId, sizeId).run();
    }
  }
}
