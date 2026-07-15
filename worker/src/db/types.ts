export interface Customer {
  id: string;
  user_type: 'new' | 'regular' | 'vip';
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

export interface Admin {
  id: string;
  customer_id: string | null;
  username: string;
  email: string | null;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  session_id: string;
  customer_id: string;
  token: string;
  created_at: number;
  expires_at: number;
}

export interface Chat {
  id: number;
  customer_id: string;
  message: string;
  sender_type: 'user' | 'assistant';
  ai_connected: boolean;
  timestamp: number;
}

export interface CreateCustomerInput {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  avatar_url?: string;
  is_premium?: boolean;
  invite_code?: string;
}

export interface UpdateCustomerInput {
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
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

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
}

// Products (Mother) - images are here (one-to-many)

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
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  name: string;
  category_id: number;
  slug?: string;
  description?: string;
  short_description?: string;
  is_active?: boolean;
  material?: string;
  images?: string[];
  is_stock?: boolean;
  sku?: string;
}

export interface UpdateProductInput {
  name?: string;
  category_id?: number;
  slug?: string;
  description?: string;
  short_description?: string;
  is_active?: boolean;
  material?: string;
  images?: string[];
  is_stock?: boolean;
  sku?: string;
}

// Designs (standalone - no FK to products)

export interface Design {
  id: number;
  name: string;
  name_en: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDesignInput {
  name: string;
  name_en?: string;
}

export interface UpdateDesignInput {
  name?: string;
  name_en?: string;
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

export interface CreateColorInput {
  name: string;
  name_en: string;
  hex: string;
}

export interface UpdateColorInput {
  name?: string;
  name_en?: string;
  hex?: string;
}

// Sizes

export interface Size {
  id: number;
  dimensions: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSizeInput {
  dimensions: string;
}

export interface UpdateSizeInput {
  dimensions?: string;
}

// Junction: product <-> color
export interface ProductColor {
  product_id: number;
  color_id: number;
}

// Junction: product <-> size
export interface ProductSize {
  product_id: number;
  size_id: number;
}

// Orders

export interface Order {
  id: number;
  customer_id: string;
  total: number;
  payment_status: 'pending' | 'paid';
  fulfillment_status: 'processing' | 'shipped' | 'delivered';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderInput {
  customer_id: string;
  total?: number;
  payment_status?: 'pending' | 'paid';
  fulfillment_status?: 'processing' | 'shipped' | 'delivered';
  notes?: string;
}

export interface UpdateOrderInput {
  total?: number;
  payment_status?: 'pending' | 'paid';
  fulfillment_status?: 'processing' | 'shipped' | 'delivered';
  notes?: string;
}

// Order Items

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  color_id: number | null;
  size_id: number | null;
  quantity: number;
  price: number;
}

export interface CreateOrderItemInput {
  order_id: number;
  product_id: number;
  color_id?: number;
  size_id?: number;
  quantity: number;
  price: number;
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

export interface CreateCouponInput {
  code: string;
  discount: number;
  type?: 'percentage' | 'fixed';
  expires_at?: number;
  is_active?: boolean;
}

export interface UpdateCouponInput {
  code?: string;
  discount?: number;
  type?: 'percentage' | 'fixed';
  expires_at?: number;
  is_active?: boolean;
}

// Settings

export interface Setting {
  id: number;
  key: string;
  value: string | null;
  type: 'text' | 'image' | 'boolean' | 'json';
  label: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingInput {
  value: string;
}
