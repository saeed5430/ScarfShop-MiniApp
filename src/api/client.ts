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
  user_id?: string;
  session_token?: string;
  error?: string;
}

export interface User {
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
  created_at: string;
  last_active: string;
}

export interface LoginResponse {
  user: User;
}

export async function login(initData: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ initData }),
  });
}

export async function getCurrentUser(): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/auth/me');
}

export async function getUsers(limit = 50, offset = 0) {
  return apiRequest<{ users: User[]; total: number }>(`/api/users?limit=${limit}&offset=${offset}`);
}

// Categories

export interface Category {
  id: number;
  name: string;
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
  description: string;
  short_description: string;
  is_active: boolean;
  material: string;
  images: string[];
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

// Variants

export interface Variant {
  id: number;
  product_id: number;
  design_id: number | null;
  slug: string;
  color: string;
  size: string;
  is_stock: boolean;
  images: string[];
  created_at: string;
  updated_at: string;
}

export async function getVariants(productId?: number, inStock?: boolean): Promise<{ items: Variant[]; total: number }> {
  const params = new URLSearchParams();
  if (productId) params.set('product_id', String(productId));
  if (inStock) params.set('in_stock', 'true');
  const qs = params.toString();
  return apiRequest(`/api/variants${qs ? `?${qs}` : ''}`);
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
