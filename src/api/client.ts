const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('session_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export interface AuthResponse {
  success: boolean;
  customer_id?: string;
  session_token?: string;
  error?: string;
}

export interface Customer {
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
  is_premium: boolean;
  onboarding_version: number;
  created_at: string;
  last_active: string;
}

export interface LoginResponse {
  customer: Customer;
}

export async function login(initData: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ initData }),
  });
}

export async function getCurrentCustomer(): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/auth/me');
}

export async function checkIsAdmin(): Promise<{ is_admin: boolean }> {
  return apiRequest<{ is_admin: boolean }>('/api/auth/is-admin');
}

export async function updateOnboardingVersion(version: number): Promise<{ customer: Customer }> {
  return apiRequest<{ customer: Customer }>('/api/auth/onboarding', {
    method: 'PUT',
    body: JSON.stringify({ version }),
  });
}

export async function updateProfile(data: {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
}): Promise<{ customer: Customer }> {
  return apiRequest<{ customer: Customer }>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getCustomers(limit = 50, offset = 0) {
  return apiRequest<{ customers: Customer[]; total: number }>(`/api/customers?limit=${limit}&offset=${offset}`);
}

// Categories

export interface Category {
  id: number;
  name: string;
  slug: string | null;
  description: string;
  created_at: string;
  updated_at: string;
}

export async function getCategories(): Promise<{ categories: Category[] }> {
  return apiRequest('/api/categories');
}

// Products - images are here (one-to-many)

export interface Product {
  id: number;
  name: string;
  category_id: number;
  slug: string | null;
  description: string;
  short_description: string;
  is_active: boolean;
  material: string;
  images: string[];
  is_stock: boolean;
  sku: string | null;
  color_count: number;
  size_count: number;
  category_name: string;
  created_at: string;
  updated_at: string;
}

export async function getProducts(categoryId?: number, search?: string): Promise<{ items: Product[]; total: number }> {
  const params = new URLSearchParams();
  if (categoryId) params.set('category_id', String(categoryId));
  if (search) params.set('search', search);
  const qs = params.toString();
  return apiRequest(`/api/products${qs ? `?${qs}` : ''}`);
}

export async function getProductColors(productId: number): Promise<{ colors: Color[] }> {
  return apiRequest(`/api/products/${productId}/colors`);
}

export async function getProductSizes(productId: number): Promise<{ sizes: Size[] }> {
  return apiRequest(`/api/products/${productId}/sizes`);
}

// Designs (standalone - no FK to products)

export interface Design {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export async function getDesigns(): Promise<{ items: Design[]; total: number }> {
  return apiRequest('/api/designs');
}

// Colors

export interface Color {
  id: number;
  name: string;
  name_en: string;
  hex: string;
  created_at: string;
  updated_at: string;
}

export async function getColors(): Promise<{ items: Color[]; total: number }> {
  return apiRequest('/api/colors');
}

// Sizes

export interface Size {
  id: number;
  dimensions: string;
  created_at: string;
  updated_at: string;
}

export async function getSizes(): Promise<{ items: Size[]; total: number }> {
  return apiRequest('/api/sizes');
}

// Variant Relations

export async function getVariantColors(variantId: number): Promise<{ colors: Color[] }> {
  return apiRequest(`/api/variants/${variantId}/colors`);
}

export async function setVariantColors(variantId: number, colorIds: number[]): Promise<{ success: boolean }> {
  return apiRequest(`/api/variants/${variantId}/colors`, {
    method: 'PUT',
    body: JSON.stringify({ color_ids: colorIds }),
  });
}

export async function getVariantSizes(variantId: number): Promise<{ sizes: Size[] }> {
  return apiRequest(`/api/variants/${variantId}/sizes`);
}

export async function setVariantSizes(variantId: number, sizeIds: number[]): Promise<{ success: boolean }> {
  return apiRequest(`/api/variants/${variantId}/sizes`, {
    method: 'PUT',
    body: JSON.stringify({ size_ids: sizeIds }),
  });
}

// Orders

export interface Order {
  id: number;
  user_id: string;
  payment_status: 'pending' | 'paid';
  notes: string | null;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  color_id: number | null;
  size_id: number | null;
  quantity: number;
}

export async function getOrders(limit = 50, offset = 0): Promise<{ orders: Order[]; total: number }> {
  return apiRequest(`/api/orders?limit=${limit}&offset=${offset}`);
}

export async function getOrder(id: number): Promise<{ order: Order; items: OrderItem[] }> {
  return apiRequest(`/api/orders/${id}`);
}

export async function createOrder(data: { user_id: string; notes?: string; items: { product_id: number; color_id?: number; size_id?: number; quantity: number }[] }): Promise<{ order: Order }> {
  return apiRequest('/api/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateOrder(id: number, data: Partial<Order>): Promise<{ order: Order }> {
  return apiRequest(`/api/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Coupons

export interface Coupon {
  id: number;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  expires_at: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getCoupons(): Promise<{ coupons: Coupon[]; total: number }> {
  return apiRequest('/api/coupons');
}

export async function getActiveCoupons(): Promise<{ coupons: Coupon[] }> {
  return apiRequest('/api/coupons/active');
}

export async function createCoupon(data: Partial<Coupon>): Promise<{ coupon: Coupon }> {
  return apiRequest('/api/coupons', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
