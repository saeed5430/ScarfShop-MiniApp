import type { D1Database } from '@cloudflare/workers-types';

export interface BaleAdminRow {
  id: string;
  username: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  password_hash: string | null;
  created_at: number;
}

function normalizeImageUrl(item: unknown): string | null {
  if (typeof item === 'string') {
    const s = item.trim();
    if (!s || s === '[object Object]') return null;
    return s;
  }
  if (item && typeof item === 'object') {
    const url = (item as { url?: unknown }).url;
    if (typeof url === 'string') return normalizeImageUrl(url);
  }
  return null;
}

export function normalizeImageList(input: unknown): string[] {
  const arr = typeof input === 'string' ? (() => { try { return JSON.parse(input); } catch { return []; } })() : input;
  if (!Array.isArray(arr)) return [];
  const out: string[] = [];
  for (const item of arr) {
    const url = normalizeImageUrl(item);
    if (url) out.push(url);
  }
  return out;
}

function parseImages(raw: unknown): string[] {
  if (raw == null) return [];
  return normalizeImageList(raw);
}

export class BaleAdminDB {
  constructor(private db: D1Database) {}

  async getStats(): Promise<{ users: number; products: number; orders: number; pending_orders: number }> {
    const users = await this.db.prepare('SELECT COUNT(*) AS c FROM users').first<{ c: number }>();
    const products = await this.db.prepare('SELECT COUNT(*) AS c FROM products WHERE is_active = 1').first<{ c: number }>();
    const orders = await this.db.prepare('SELECT COUNT(*) AS c FROM orders').first<{ c: number }>();
    const pending = await this.db.prepare("SELECT COUNT(*) AS c FROM orders WHERE payment_status = 'pending'").first<{ c: number }>();
    return {
      users: users?.c ?? 0,
      products: products?.c ?? 0,
      orders: orders?.c ?? 0,
      pending_orders: pending?.c ?? 0,
    };
  }

  async findAdminByEmail(email: string): Promise<BaleAdminRow | null> {
    return await this.db.prepare('SELECT * FROM admins WHERE email = ?').bind(email).first<BaleAdminRow>();
  }

  async findAdminByUsername(username: string): Promise<BaleAdminRow | null> {
    return await this.db.prepare('SELECT * FROM admins WHERE username = ?').bind(username).first<BaleAdminRow>();
  }

  async getAdmin(id: string): Promise<BaleAdminRow | null> {
    return await this.db.prepare('SELECT * FROM admins WHERE id = ?').bind(id).first<BaleAdminRow>();
  }

  async listAdmins(): Promise<Omit<BaleAdminRow, 'password_hash'>[]> {
    const { results } = await this.db.prepare(
      'SELECT id, username, email, first_name, last_name, avatar_url, created_at FROM admins ORDER BY created_at DESC'
    ).all<Omit<BaleAdminRow, 'password_hash'>>();
    return results;
  }

  async createAdmin(input: { username: string; email: string; first_name: string; last_name?: string | null; password_hash: string }): Promise<BaleAdminRow | null> {
    const id = crypto.randomUUID();
    await this.db.prepare(
      'INSERT INTO admins (id, username, email, first_name, last_name, password_hash) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, input.username, input.email, input.first_name, input.last_name ?? null, input.password_hash).run();
    return this.getAdmin(id);
  }

  async updateAdmin(id: string, input: { username?: string; email?: string | null; first_name?: string | null; last_name?: string | null; avatar_url?: string | null; password_hash?: string }): Promise<BaleAdminRow | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (input.username !== undefined) { fields.push('username = ?'); values.push(input.username); }
    if (input.email !== undefined) { fields.push('email = ?'); values.push(input.email); }
    if (input.first_name !== undefined) { fields.push('first_name = ?'); values.push(input.first_name); }
    if (input.last_name !== undefined) { fields.push('last_name = ?'); values.push(input.last_name); }
    if (input.avatar_url !== undefined) { fields.push('avatar_url = ?'); values.push(input.avatar_url); }
    if (input.password_hash !== undefined) { fields.push('password_hash = ?'); values.push(input.password_hash); }
    if (fields.length === 0) return this.getAdmin(id);
    values.push(id);
    await this.db.prepare(`UPDATE admins SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return this.getAdmin(id);
  }

  async deleteAdmin(id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM admins WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }

  async createCategory(input: { name: string; slug?: string | null }): Promise<Record<string, unknown> | null> {
    const result = await this.db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').bind(input.name, input.slug ?? null).run();
    return await this.db.prepare('SELECT * FROM categories WHERE id = ?').bind(Number(result.meta.last_row_id)).first<Record<string, unknown>>();
  }

  async updateCategory(id: number, input: { name?: string; slug?: string | null }): Promise<Record<string, unknown> | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
    if (input.slug !== undefined) { fields.push('slug = ?'); values.push(input.slug); }
    if (fields.length === 0) return await this.db.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first<Record<string, unknown>>();
    fields.push('updated_at = unixepoch()');
    values.push(id);
    await this.db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return await this.db.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first<Record<string, unknown>>();
  }

  async deleteCategory(id: number): Promise<boolean> {
    const used = await this.db.prepare('SELECT COUNT(*) AS c FROM products WHERE category_id = ?').bind(id).first<{ c: number }>();
    if ((used?.c ?? 0) > 0) throw new Error('Category has products');
    const result = await this.db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }

  async listProductsAdmin(): Promise<Record<string, unknown>[]> {
    const { results } = await this.db.prepare(
      `SELECT p.*, c.name AS category_name,
        (SELECT COUNT(DISTINCT vc.color_id) FROM variants v LEFT JOIN variant_colors vc ON vc.variant_id = v.id WHERE v.product_id = p.id) AS color_count,
        (SELECT COUNT(DISTINCT vsz.size_id) FROM variants v LEFT JOIN variant_sizes vsz ON vsz.variant_id = v.id WHERE v.product_id = p.id) AS size_count
       FROM products p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.id DESC`
    ).all<Record<string, unknown>>();
    return results.map((r) => ({ ...r, images: parseImages(r['images']) }));
  }

  async getProductAdmin(id: number): Promise<Record<string, unknown> | null> {
    const row = await this.db.prepare(
      'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?'
    ).bind(id).first<Record<string, unknown>>();
    if (!row) return null;
    const colors = await this.db.prepare(
      'SELECT DISTINCT vc.color_id FROM variants v JOIN variant_colors vc ON vc.variant_id = v.id WHERE v.product_id = ?'
    ).bind(id).all<{ color_id: number }>();
    const sizes = await this.db.prepare(
      'SELECT DISTINCT vsz.size_id FROM variants v JOIN variant_sizes vsz ON vsz.variant_id = v.id WHERE v.product_id = ?'
    ).bind(id).all<{ size_id: number }>();
    return {
      ...row,
      images: parseImages(row['images']),
      color_ids: colors.results.map((r) => r.color_id),
      size_ids: sizes.results.map((r) => r.size_id),
    };
  }

  async createProduct(input: {
    name: string; category_id?: number | null; description?: string; short_description?: string;
    is_active?: number; material?: string; slug?: string | null; price?: number; sku?: string | null;
    images?: unknown; is_stock?: number; color_ids?: number[]; size_ids?: number[];
  }): Promise<Record<string, unknown> | null> {
    const result = await this.db.prepare(
      `INSERT INTO products (name, category_id, description, short_description, is_active, material, slug, price, sku, images, is_stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      input.name, input.category_id ?? null, input.description ?? '', input.short_description ?? '',
      input.is_active ?? 1, input.material ?? '', input.slug ?? null, input.price ?? 0,
      input.sku ?? null, JSON.stringify(normalizeImageList(input.images ?? [])), input.is_stock ?? 1
    ).run();
    const productId = Number(result.meta.last_row_id);
    const colorIds = input.color_ids ?? [];
    const sizeIds = input.size_ids ?? [];
    if (colorIds.length > 0 || sizeIds.length > 0) {
      const v = await this.db.prepare('INSERT INTO variants (product_id, is_stock) VALUES (?, ?)').bind(productId, input.is_stock ?? 1).run();
      const variantId = Number(v.meta.last_row_id);
      for (const cid of colorIds) {
        await this.db.prepare('INSERT OR IGNORE INTO variant_colors (variant_id, color_id) VALUES (?, ?)').bind(variantId, cid).run();
      }
      for (const sid of sizeIds) {
        await this.db.prepare('INSERT OR IGNORE INTO variant_sizes (variant_id, size_id) VALUES (?, ?)').bind(variantId, sid).run();
      }
    }
    return this.getProductAdmin(productId);
  }

  async updateProduct(id: number, input: {
    name?: string; category_id?: number | null; description?: string; short_description?: string;
    is_active?: number; material?: string; slug?: string | null; price?: number; sku?: string | null;
    images?: unknown; is_stock?: number; color_ids?: number[]; size_ids?: number[];
  }): Promise<Record<string, unknown> | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
    if (input.category_id !== undefined) { fields.push('category_id = ?'); values.push(input.category_id); }
    if (input.description !== undefined) { fields.push('description = ?'); values.push(input.description); }
    if (input.short_description !== undefined) { fields.push('short_description = ?'); values.push(input.short_description); }
    if (input.is_active !== undefined) { fields.push('is_active = ?'); values.push(input.is_active); }
    if (input.material !== undefined) { fields.push('material = ?'); values.push(input.material); }
    if (input.slug !== undefined) { fields.push('slug = ?'); values.push(input.slug); }
    if (input.price !== undefined) { fields.push('price = ?'); values.push(input.price); }
    if (input.sku !== undefined) { fields.push('sku = ?'); values.push(input.sku); }
    if (input.images !== undefined) { fields.push('images = ?'); values.push(JSON.stringify(normalizeImageList(input.images))); }
    if (input.is_stock !== undefined) { fields.push('is_stock = ?'); values.push(input.is_stock); }
    if (fields.length > 0) {
      fields.push('updated_at = unixepoch()');
      values.push(id);
      await this.db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    }
    if (input.color_ids !== undefined || input.size_ids !== undefined) {
      let variant = await this.db.prepare('SELECT id FROM variants WHERE product_id = ? ORDER BY id ASC LIMIT 1').bind(id).first<{ id: number }>();
      if (!variant) {
        const v = await this.db.prepare('INSERT INTO variants (product_id, is_stock) VALUES (?, ?)').bind(id, input.is_stock ?? 1).run();
        variant = { id: Number(v.meta.last_row_id) };
      }
      if (input.color_ids !== undefined) {
        await this.db.prepare('DELETE FROM variant_colors WHERE variant_id = ?').bind(variant.id).run();
        for (const cid of input.color_ids) {
          await this.db.prepare('INSERT OR IGNORE INTO variant_colors (variant_id, color_id) VALUES (?, ?)').bind(variant.id, cid).run();
        }
      }
      if (input.size_ids !== undefined) {
        await this.db.prepare('DELETE FROM variant_sizes WHERE variant_id = ?').bind(variant.id).run();
        for (const sid of input.size_ids) {
          await this.db.prepare('INSERT OR IGNORE INTO variant_sizes (variant_id, size_id) VALUES (?, ?)').bind(variant.id, sid).run();
        }
      }
    }
    return this.getProductAdmin(id);
  }

  async setProductActive(id: number, active: boolean): Promise<boolean> {
    const result = await this.db.prepare('UPDATE products SET is_active = ?, updated_at = unixepoch() WHERE id = ?').bind(active ? 1 : 0, id).run();
    return (result.meta.changes ?? 0) > 0;
  }

  async createColor(input: { name: string; name_en?: string; hex?: string }): Promise<Record<string, unknown> | null> {
    const result = await this.db.prepare('INSERT INTO colors (name, name_en, hex) VALUES (?, ?, ?)').bind(input.name, input.name_en ?? '', input.hex ?? '#000000').run();
    return await this.db.prepare('SELECT * FROM colors WHERE id = ?').bind(Number(result.meta.last_row_id)).first<Record<string, unknown>>();
  }

  async updateColor(id: number, input: { name?: string; name_en?: string; hex?: string }): Promise<Record<string, unknown> | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
    if (input.name_en !== undefined) { fields.push('name_en = ?'); values.push(input.name_en); }
    if (input.hex !== undefined) { fields.push('hex = ?'); values.push(input.hex); }
    if (fields.length === 0) return await this.db.prepare('SELECT * FROM colors WHERE id = ?').bind(id).first<Record<string, unknown>>();
    fields.push('updated_at = unixepoch()');
    values.push(id);
    await this.db.prepare(`UPDATE colors SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return await this.db.prepare('SELECT * FROM colors WHERE id = ?').bind(id).first<Record<string, unknown>>();
  }

  async deleteColor(id: number): Promise<boolean> {
    const used = await this.db.prepare('SELECT COUNT(*) AS c FROM variant_colors WHERE color_id = ?').bind(id).first<{ c: number }>();
    if ((used?.c ?? 0) > 0) throw new Error('Color is used in variants');
    const result = await this.db.prepare('DELETE FROM colors WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }

  async createSize(input: { dimensions: string }): Promise<Record<string, unknown> | null> {
    const result = await this.db.prepare('INSERT INTO sizes (dimensions) VALUES (?)').bind(input.dimensions).run();
    return await this.db.prepare('SELECT * FROM sizes WHERE id = ?').bind(Number(result.meta.last_row_id)).first<Record<string, unknown>>();
  }

  async updateSize(id: number, input: { dimensions?: string }): Promise<Record<string, unknown> | null> {
    if (input.dimensions === undefined) return await this.db.prepare('SELECT * FROM sizes WHERE id = ?').bind(id).first<Record<string, unknown>>();
    await this.db.prepare('UPDATE sizes SET dimensions = ?, updated_at = unixepoch() WHERE id = ?').bind(input.dimensions, id).run();
    return await this.db.prepare('SELECT * FROM sizes WHERE id = ?').bind(id).first<Record<string, unknown>>();
  }

  async deleteSize(id: number): Promise<boolean> {
    const used = await this.db.prepare('SELECT COUNT(*) AS c FROM variant_sizes WHERE size_id = ?').bind(id).first<{ c: number }>();
    if ((used?.c ?? 0) > 0) throw new Error('Size is used in variants');
    const result = await this.db.prepare('DELETE FROM sizes WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }

  async createDesign(input: { name: string; name_en?: string }): Promise<Record<string, unknown> | null> {
    const result = await this.db.prepare('INSERT INTO designs (name, name_en) VALUES (?, ?)').bind(input.name, input.name_en ?? '').run();
    return await this.db.prepare('SELECT * FROM designs WHERE id = ?').bind(Number(result.meta.last_row_id)).first<Record<string, unknown>>();
  }

  async updateDesign(id: number, input: { name?: string; name_en?: string }): Promise<Record<string, unknown> | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
    if (input.name_en !== undefined) { fields.push('name_en = ?'); values.push(input.name_en); }
    if (fields.length === 0) return await this.db.prepare('SELECT * FROM designs WHERE id = ?').bind(id).first<Record<string, unknown>>();
    fields.push('updated_at = unixepoch()');
    values.push(id);
    await this.db.prepare(`UPDATE designs SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return await this.db.prepare('SELECT * FROM designs WHERE id = ?').bind(id).first<Record<string, unknown>>();
  }

  async deleteDesign(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM designs WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }

  async listVariantsAdmin(productId?: number): Promise<Record<string, unknown>[]> {
    let query = `SELECT v.*, p.name AS product_name, d.name AS design_name FROM variants v
      LEFT JOIN products p ON p.id = v.product_id LEFT JOIN designs d ON d.id = v.design_id`;
    const values: unknown[] = [];
    if (productId) { query += ' WHERE v.product_id = ?'; values.push(productId); }
    query += ' ORDER BY v.id DESC';
    const { results } = await this.db.prepare(query).bind(...values).all<Record<string, unknown>>();
    const enriched = await Promise.all(results.map(async (v) => {
      const vid = Number(v['id']);
      const colors = await this.db.prepare(
        'SELECT c.* FROM colors c JOIN variant_colors vc ON vc.color_id = c.id WHERE vc.variant_id = ?'
      ).bind(vid).all<Record<string, unknown>>();
      const sizes = await this.db.prepare(
        'SELECT s.* FROM sizes s JOIN variant_sizes vsz ON vsz.size_id = s.id WHERE vsz.variant_id = ?'
      ).bind(vid).all<Record<string, unknown>>();
      return {
        ...v,
        colors: colors.results,
        sizes: sizes.results,
        color_ids: colors.results.map((c) => Number(c['id'])),
        size_ids: sizes.results.map((s) => Number(s['id'])),
      };
    }));
    return enriched;
  }

  async getVariantAdmin(id: number): Promise<Record<string, unknown> | null> {
    const row = await this.db.prepare(
      `SELECT v.*, p.name AS product_name, d.name AS design_name FROM variants v
       LEFT JOIN products p ON p.id = v.product_id LEFT JOIN designs d ON d.id = v.design_id WHERE v.id = ?`
    ).bind(id).first<Record<string, unknown>>();
    if (!row) return null;
    const colors = await this.db.prepare(
      'SELECT c.* FROM colors c JOIN variant_colors vc ON vc.color_id = c.id WHERE vc.variant_id = ?'
    ).bind(id).all<Record<string, unknown>>();
    const sizes = await this.db.prepare(
      'SELECT s.* FROM sizes s JOIN variant_sizes vsz ON vsz.size_id = s.id WHERE vsz.variant_id = ?'
    ).bind(id).all<Record<string, unknown>>();
    return {
      ...row,
      colors: colors.results,
      sizes: sizes.results,
      color_ids: colors.results.map((c) => Number(c['id'])),
      size_ids: sizes.results.map((s) => Number(s['id'])),
    };
  }

  async createVariant(input: { product_id: number; design_id?: number | null; slug?: string | null; is_stock?: number; color_ids?: number[]; size_ids?: number[] }): Promise<Record<string, unknown> | null> {
    const result = await this.db.prepare('INSERT INTO variants (product_id, design_id, slug, is_stock) VALUES (?, ?, ?, ?)').bind(
      input.product_id, input.design_id ?? null, input.slug ?? null, input.is_stock ?? 1
    ).run();
    const variantId = Number(result.meta.last_row_id);
    for (const cid of input.color_ids ?? []) {
      await this.db.prepare('INSERT OR IGNORE INTO variant_colors (variant_id, color_id) VALUES (?, ?)').bind(variantId, cid).run();
    }
    for (const sid of input.size_ids ?? []) {
      await this.db.prepare('INSERT OR IGNORE INTO variant_sizes (variant_id, size_id) VALUES (?, ?)').bind(variantId, sid).run();
    }
    return this.getVariantAdmin(variantId);
  }

  async updateVariant(id: number, input: { product_id?: number; design_id?: number | null; slug?: string | null; is_stock?: number; color_ids?: number[]; size_ids?: number[] }): Promise<Record<string, unknown> | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (input.product_id !== undefined) { fields.push('product_id = ?'); values.push(input.product_id); }
    if (input.design_id !== undefined) { fields.push('design_id = ?'); values.push(input.design_id); }
    if (input.slug !== undefined) { fields.push('slug = ?'); values.push(input.slug); }
    if (input.is_stock !== undefined) { fields.push('is_stock = ?'); values.push(input.is_stock); }
    if (fields.length > 0) {
      fields.push('updated_at = unixepoch()');
      values.push(id);
      await this.db.prepare(`UPDATE variants SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    }
    if (input.color_ids !== undefined) {
      await this.db.prepare('DELETE FROM variant_colors WHERE variant_id = ?').bind(id).run();
      for (const cid of input.color_ids) {
        await this.db.prepare('INSERT OR IGNORE INTO variant_colors (variant_id, color_id) VALUES (?, ?)').bind(id, cid).run();
      }
    }
    if (input.size_ids !== undefined) {
      await this.db.prepare('DELETE FROM variant_sizes WHERE variant_id = ?').bind(id).run();
      for (const sid of input.size_ids) {
        await this.db.prepare('INSERT OR IGNORE INTO variant_sizes (variant_id, size_id) VALUES (?, ?)').bind(id, sid).run();
      }
    }
    return this.getVariantAdmin(id);
  }

  async deleteVariant(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM variants WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }

  async listUsersAdmin(limit = 50, offset = 0, search?: string): Promise<{ users: Record<string, unknown>[]; total: number }> {
    let where = '';
    const values: unknown[] = [];
    if (search) {
      where = 'WHERE first_name LIKE ? OR last_name LIKE ? OR username LIKE ? OR phone LIKE ? OR id LIKE ?';
      const like = `%${search}%`;
      values.push(like, like, like, like, like);
    }
    const totalRow = await this.db.prepare(`SELECT COUNT(*) AS c FROM users ${where}`).bind(...values).first<{ c: number }>();
    const { results } = await this.db.prepare(`SELECT * FROM users ${where} ORDER BY last_active DESC LIMIT ? OFFSET ?`).bind(...values, limit, offset).all<Record<string, unknown>>();
    return { users: results, total: totalRow?.c ?? 0 };
  }

  async listOrdersAdmin(limit = 50, offset = 0): Promise<{ orders: Record<string, unknown>[]; total: number }> {
    const totalRow = await this.db.prepare('SELECT COUNT(*) AS c FROM orders').first<{ c: number }>();
    const { results } = await this.db.prepare(
      `SELECT o.*, u.first_name AS customer_first_name, u.last_name AS customer_last_name, u.username AS customer_username, u.phone AS customer_phone,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
        (SELECT COALESCE(SUM(oi.quantity * oi.price), 0) FROM order_items oi WHERE oi.order_id = o.id) AS total_amount
       FROM orders o LEFT JOIN users u ON u.id = o.customer_id ORDER BY o.id DESC LIMIT ? OFFSET ?`
    ).bind(limit, offset).all<Record<string, unknown>>();
    return { orders: results, total: totalRow?.c ?? 0 };
  }

  async getOrderAdmin(id: number): Promise<{ order: Record<string, unknown> | null; items: Record<string, unknown>[] }> {
    const order = await this.db.prepare(
      `SELECT o.*, u.first_name AS customer_first_name, u.last_name AS customer_last_name, u.username AS customer_username, u.phone AS customer_phone, u.address AS customer_address
       FROM orders o LEFT JOIN users u ON u.id = o.customer_id WHERE o.id = ?`
    ).bind(id).first<Record<string, unknown>>();
    if (!order) return { order: null, items: [] };
    const { results } = await this.db.prepare(
      `SELECT oi.*,
        p.name AS product_name, p.material AS product_material,
        (SELECT c.name FROM colors c JOIN variant_colors vc ON vc.color_id = c.id WHERE vc.variant_id = oi.variant_id LIMIT 1) AS color_name,
        (SELECT c.hex FROM colors c JOIN variant_colors vc ON vc.color_id = c.id WHERE vc.variant_id = oi.variant_id LIMIT 1) AS color_hex,
        (SELECT s.dimensions FROM sizes s JOIN variant_sizes vsz ON vsz.size_id = s.id WHERE vsz.variant_id = oi.variant_id LIMIT 1) AS size_dimensions
       FROM order_items oi LEFT JOIN variants v ON v.id = oi.variant_id LEFT JOIN products p ON p.id = v.product_id
       WHERE oi.order_id = ?`
    ).bind(id).all<Record<string, unknown>>();
    return { order, items: results };
  }

  async updateOrderAdmin(id: number, input: { payment_status?: string; delivery_method?: string | null; notes?: string | null }): Promise<Record<string, unknown> | null> {
    if (input.payment_status !== undefined && !['pending', 'paid'].includes(input.payment_status)) {
      throw new Error('Invalid payment status');
    }
    const fields: string[] = [];
    const values: unknown[] = [];
    if (input.payment_status !== undefined) { fields.push('payment_status = ?'); values.push(input.payment_status); }
    if (input.delivery_method !== undefined) { fields.push('delivery_method = ?'); values.push(input.delivery_method); }
    if (input.notes !== undefined) { fields.push('notes = ?'); values.push(input.notes); }
    if (fields.length === 0) {
      const { order } = await this.getOrderAdmin(id);
      return order;
    }
    fields.push('updated_at = unixepoch()');
    values.push(id);
    await this.db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    const { order } = await this.getOrderAdmin(id);
    return order;
  }

  async deleteOrderAdmin(id: number): Promise<boolean> {
    await this.db.prepare('DELETE FROM order_items WHERE order_id = ?').bind(id).run();
    const result = await this.db.prepare('DELETE FROM orders WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }

  async getOrderReceiptFileId(id: number, type: 'invoice' | 'voice'): Promise<string | null> {
    const row = await this.db.prepare('SELECT invoice_file_id, receipt_file_id, voice_file_id FROM orders WHERE id = ?').bind(id).first<{ invoice_file_id: string | null; receipt_file_id: string | null; voice_file_id: string | null }>();
    if (!row) return null;
    if (type === 'voice') return row.voice_file_id;
    return row.invoice_file_id ?? row.receipt_file_id;
  }

  async updateSetting(key: string, value: string): Promise<Record<string, unknown> | null> {
    await this.db.prepare('UPDATE settings SET value = ? WHERE key = ?').bind(value, key).run();
    return await this.db.prepare('SELECT * FROM settings WHERE key = ?').bind(key).first<Record<string, unknown>>();
  }

  async bulkUpdateSettings(items: { key: string; value: string }[]): Promise<Record<string, unknown>[]> {
    for (const item of items) {
      await this.db.prepare('UPDATE settings SET value = ? WHERE key = ?').bind(item.value, item.key).run();
    }
    const { results } = await this.db.prepare('SELECT * FROM settings ORDER BY id ASC').all<Record<string, unknown>>();
    return results;
  }
}
