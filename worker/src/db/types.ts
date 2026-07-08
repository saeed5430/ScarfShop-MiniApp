export interface User {
  id: string;
  user_type: 'new' | 'old';
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
  username: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  created_at: number;
}

export interface Session {
  session_id: string;
  user_id: string;
  token: string;
  created_at: number;
  expires_at: number;
}

export interface Chat {
  id: number;
  user_id: string;
  message: string;
  sender_type: 'user' | 'assistant';
  ai_connected: boolean;
  timestamp: number;
}

export interface CreateUserInput {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  avatar_url?: string;
  is_premium?: boolean;
  invite_code?: string;
}

export interface UpdateUserInput {
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
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryInput {
  name: string;
}

export interface UpdateCategoryInput {
  name?: string;
}

// Products (Mother) - images are here (one-to-many)

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

export interface CreateProductInput {
  name: string;
  category_id: number;
  description?: string;
  short_description?: string;
  is_active?: boolean;
  material?: string;
  images?: string[];
}

export interface UpdateProductInput {
  name?: string;
  category_id?: number;
  description?: string;
  short_description?: string;
  is_active?: boolean;
  material?: string;
  images?: string[];
}

// Designs (standalone - no FK to products)

export interface Design {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDesignInput {
  name: string;
}

export interface UpdateDesignInput {
  name?: string;
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

export interface CreateVariantInput {
  product_id: number;
  design_id?: number | null;
  color?: string;
  size?: string;
  is_stock?: boolean;
  images?: string[];
}

export interface UpdateVariantInput {
  product_id?: number;
  design_id?: number | null;
  color?: string;
  size?: string;
  is_stock?: boolean;
  images?: string[];
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

// Junction: variant <-> color
export interface VariantColor {
  variant_id: number;
  color_id: number;
}

// Junction: variant <-> size
export interface VariantSize {
  variant_id: number;
  size_id: number;
}
