const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function baleRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('bale_session_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export interface BaleUser {
  id: string;
  user_type: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
}

export interface BaleCategory {
  id: number;
  name: string;
  slug: string | null;
}

export interface BaleColor {
  id: number;
  name: string;
  name_en: string;
  hex: string;
}

export interface BaleSize {
  id: number;
  dimensions: string;
}

export interface BaleVariant {
  id: number;
  product_id: number;
  design_id: number | null;
  slug: string | null;
  is_stock: number;
  colors?: BaleColor[];
  sizes?: BaleSize[];
}

export interface BaleProduct {
  id: number;
  name: string;
  category_id: number | null;
  description: string;
  short_description: string;
  material: string;
  slug: string | null;
  price: number;
  sku: string | null;
  images: string[];
  is_stock: number;
}

export interface BaleOrderItem {
  variant_id: number;
  quantity: number;
  price: number;
  product_name: string | null;
  product_images: string[];
  color_name: string | null;
  color_hex: string | null;
  size_dimensions: string | null;
}

export interface BaleOrder {
  id: number;
  payment_status: string;
  delivery_method: string | null;
  notes: string | null;
  invoice_uploaded_at: number | null;
  voice_uploaded_at: number | null;
  receipt_uploaded_at: number | null;
  created_at: number;
  items?: BaleOrderItem[];
}

export async function baleLogin(initData: string): Promise<{ success: boolean; user_id?: string; session_token?: string; error?: string }> {
  return baleRequest('/api/bale/auth/login', { method: 'POST', body: JSON.stringify({ initData }) });
}

export async function baleMe(): Promise<{ user: BaleUser }> {
  return baleRequest('/api/bale/auth/me');
}

export async function baleUpdateProfile(data: { first_name?: string; last_name?: string; phone?: string; address?: string; postal_code?: string }): Promise<{ user: BaleUser }> {
  return baleRequest('/api/bale/auth/profile', { method: 'PUT', body: JSON.stringify(data) });
}

export async function baleGetCategories(): Promise<{ categories: BaleCategory[]; total: number }> {
  return baleRequest('/api/bale/categories');
}

export async function baleGetProducts(categoryId?: number, search?: string): Promise<{ items: BaleProduct[]; total: number }> {
  const params = new URLSearchParams();
  if (categoryId) params.set('category_id', String(categoryId));
  if (search) params.set('search', search);
  const qs = params.toString();
  return baleRequest(`/api/bale/products${qs ? `?${qs}` : ''}`);
}

export async function baleGetProduct(id: number): Promise<{ product: BaleProduct; variants: BaleVariant[] }> {
  return baleRequest(`/api/bale/products/${id}`);
}

export async function baleGetSizes(): Promise<{ items: BaleSize[]; total: number }> {
  return baleRequest('/api/bale/sizes');
}

export async function baleGetProductColors(productId: number): Promise<{ colors: BaleColor[] }> {
  return baleRequest(`/api/bale/products/${productId}/colors`);
}

export async function baleGetProductSizes(productId: number): Promise<{ sizes: BaleSize[] }> {
  return baleRequest(`/api/bale/products/${productId}/sizes`);
}

export type BaleDeliveryMethod = 'in_person' | 'tipax' | 'carrier';

export const BALE_DELIVERY_LABELS: Record<BaleDeliveryMethod, string> = {
  in_person: 'تحویل حضوری',
  tipax: 'ارسال با تیپاکس',
  carrier: 'ارسال با باربری',
};

export async function baleCreateOrder(data: { delivery_method?: string; notes?: string; items: { variant_id?: number; product_id?: number; color_id?: number | null; size_id?: number | null; quantity: number }[] }): Promise<{ order: BaleOrder }> {
  return baleRequest('/api/bale/orders', { method: 'POST', body: JSON.stringify(data) });
}

export async function baleGetMyOrders(): Promise<{ orders: BaleOrder[] }> {
  return baleRequest('/api/bale/my-orders');
}
