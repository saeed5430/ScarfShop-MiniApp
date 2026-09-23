import type { D1Database } from '@cloudflare/workers-types';

export interface BaleUserRow {
  id: string;
  user_type: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
  language_code: string | null;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
  invite_code: string | null;
  is_premium: number;
  created_at: number;
  last_active: number;
}

export interface BaleCategory {
  id: number;
  name: string;
  slug: string | null;
  created_at: number;
  updated_at: number;
}

export interface BaleProduct {
  id: number;
  name: string;
  category_id: number | null;
  description: string;
  short_description: string;
  is_active: number;
  material: string;
  slug: string | null;
  price: number;
  sku: string | null;
  images: string[];
  is_stock: number;
  created_at: number;
  updated_at: number;
}

export interface BaleVariant {
  id: number;
  product_id: number;
  design_id: number | null;
  slug: string | null;
  is_stock: number;
  created_at: number;
  updated_at: number;
}

export interface BaleColor {
  id: number;
  name: string;
  name_en: string;
  hex: string;
  created_at: number;
  updated_at: number;
}

export interface BaleSize {
  id: number;
  dimensions: string;
  created_at: number;
  updated_at: number;
}

export interface BaleDesign {
  id: number;
  name: string;
  name_en: string;
  created_at: number;
  updated_at: number;
}

export interface BaleOrder {
  id: number;
  customer_id: string;
  payment_status: string;
  delivery_method: string | null;
  notes: string | null;
  receipt_file_id: string | null;
  receipt_file_type: string | null;
  receipt_uploaded_at: number | null;
  invoice_file_id: string | null;
  invoice_uploaded_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface BaleOrderItem {
  id: number;
  order_id: number;
  variant_id: number;
  quantity: number;
  price: number;
}

export interface BaleSetting {
  id: number;
  key: string;
  value: string | null;
  type: string | null;
  label: string | null;
  created_at: number;
  updated_at: number;
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

function parseImages(raw: unknown): string[] {
  if (raw == null) return [];
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  const out: string[] = [];
  for (const item of parsed) {
    const url = normalizeImageUrl(item);
    if (url) out.push(url);
  }
  return out;
}

export class BaleDB {
  constructor(private db: D1Database) {}

  async getUser(id: string): Promise<BaleUserRow | null> {
    return await this.db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<BaleUserRow>();
  }

  async updateUserProfile(id: string, input: { first_name?: string; last_name?: string; phone?: string; address?: string; postal_code?: string }): Promise<BaleUserRow | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (input.first_name !== undefined) { fields.push('first_name = ?'); values.push(input.first_name); }
    if (input.last_name !== undefined) { fields.push('last_name = ?'); values.push(input.last_name); }
    if (input.phone !== undefined) { fields.push('phone = ?'); values.push(input.phone); }
    if (input.address !== undefined) { fields.push('address = ?'); values.push(input.address); }
    if (input.postal_code !== undefined) { fields.push('postal_code = ?'); values.push(input.postal_code); }
    if (fields.length === 0) return this.getUser(id);
    fields.push('last_active = unixepoch()');
    values.push(id);
    await this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return this.getUser(id);
  }

  async listCategories(): Promise<BaleCategory[]> {
    const { results } = await this.db.prepare('SELECT * FROM categories ORDER BY name ASC').all<BaleCategory>();
    return results;
  }

  async listProducts(categoryId?: number, search?: string): Promise<BaleProduct[]> {
    let query = 'SELECT * FROM products WHERE is_active = 1';
    const values: unknown[] = [];
    if (categoryId) { query += ' AND category_id = ?'; values.push(categoryId); }
    if (search) { query += ' AND (name LIKE ? OR description LIKE ?)'; values.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY id DESC';
    const { results } = await this.db.prepare(query).bind(...values).all<Record<string, unknown>>();
    return results.map((r) => ({ ...(r as unknown as BaleProduct), images: parseImages(r['images']) }));
  }

  async getProduct(id: number): Promise<BaleProduct | null> {
    const row = await this.db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').bind(id).first<Record<string, unknown>>();
    if (!row) return null;
    return { ...(row as unknown as BaleProduct), images: parseImages(row['images']) };
  }

  async getVariantDetails(variantId: number): Promise<(BaleVariant & { product_name: string | null; design_name: string | null }) | null> {
    return await this.db.prepare(
      `SELECT v.*, p.name AS product_name, d.name AS design_name
       FROM variants v
       LEFT JOIN products p ON p.id = v.product_id
       LEFT JOIN designs d ON d.id = v.design_id
       WHERE v.id = ?`
    ).bind(variantId).first<BaleVariant & { product_name: string | null; design_name: string | null }>();
  }

  async listVariantColors(variantId: number): Promise<BaleColor[]> {
    const { results } = await this.db.prepare(
      'SELECT c.* FROM colors c JOIN variant_colors vc ON vc.color_id = c.id WHERE vc.variant_id = ?'
    ).bind(variantId).all<BaleColor>();
    return results;
  }

  async listVariantSizes(variantId: number): Promise<BaleSize[]> {
    const { results } = await this.db.prepare(
      'SELECT s.* FROM sizes s JOIN variant_sizes vs ON vs.size_id = s.id WHERE vs.variant_id = ?'
    ).bind(variantId).all<BaleSize>();
    return results;
  }

  async listProductVariants(productId: number): Promise<BaleVariant[]> {
    const { results } = await this.db.prepare('SELECT * FROM variants WHERE product_id = ? AND is_stock = 1').bind(productId).all<BaleVariant>();
    return results;
  }

  async createOrder(customerId: string, input: { delivery_method?: string | null; notes?: string | null; items: { variant_id: number; quantity: number }[] }): Promise<BaleOrder> {
    const result = await this.db.prepare(
      'INSERT INTO orders (customer_id, delivery_method, notes) VALUES (?, ?, ?)'
    ).bind(customerId, input.delivery_method ?? null, input.notes ?? null).run();
    const orderId = Number(result.meta.last_row_id);
    for (const item of input.items) {
      const variant = await this.getVariantDetails(item.variant_id);
      if (!variant) throw new Error(`Variant ${item.variant_id} not found`);
      const product = variant.product_id ? await this.getProduct(variant.product_id) : null;
      await this.db.prepare(
        'INSERT INTO order_items (order_id, variant_id, quantity, price) VALUES (?, ?, ?, ?)'
      ).bind(orderId, item.variant_id, item.quantity, product?.price ?? 0).run();
    }
    const order = await this.db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first<BaleOrder>();
    if (!order) throw new Error('Order creation failed');
    return order;
  }

  async listOrdersByCustomer(customerId: string): Promise<BaleOrder[]> {
    const { results } = await this.db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC').bind(customerId).all<BaleOrder>();
    return results;
  }

  async listOrderItems(orderId: number): Promise<(BaleOrderItem & { product_name: string | null; color_name: string | null; size_dimensions: string | null })[]> {
    const { results } = await this.db.prepare(
      `SELECT oi.*,
        p.name AS product_name,
        (SELECT c.name FROM colors c JOIN variant_colors vc ON vc.color_id = c.id WHERE vc.variant_id = oi.variant_id LIMIT 1) AS color_name,
        (SELECT s.dimensions FROM sizes s JOIN variant_sizes vs ON vs.size_id = s.id WHERE vs.variant_id = oi.variant_id LIMIT 1) AS size_dimensions
       FROM order_items oi
       LEFT JOIN variants v ON v.id = oi.variant_id
       LEFT JOIN products p ON p.id = v.product_id
       WHERE oi.order_id = ?`
    ).bind(orderId).all<BaleOrderItem & { product_name: string | null; color_name: string | null; size_dimensions: string | null }>();
    return results;
  }

  async getSetting(key: string): Promise<BaleSetting | null> {
    return await this.db.prepare('SELECT * FROM settings WHERE key = ?').bind(key).first<BaleSetting>();
  }

  async listSettings(): Promise<BaleSetting[]> {
    const { results } = await this.db.prepare('SELECT * FROM settings ORDER BY id ASC').all<BaleSetting>();
    return results;
  }
}
