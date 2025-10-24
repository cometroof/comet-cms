// Product Management Types
// These types match the database schema and include additional types for the UI
import { type Json } from "@/lib/supabase-types";

export interface Product {
  id: string;
  name: string;
  title: string | null;
  description_en: string | null;
  description_id: string | null;
  catalogue: string | null;
  suitables: Json | null;
  is_highlight: boolean | null;
  brand_image: string | null;
  slug: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProductProfile {
  id: string;
  product_id: string;
  name: string;
  size_per_panel: string | null;
  effective_size: string | null;
  panel_amount: number | null;
  materials: string | null;
  tkdn_value: string | null;
  thickness: string | null;
  weight: string | null;
  size?: Array<{
    name: string;
    weight: string;
    thickness: string;
  }> | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProductCategory {
  id: string;
  product_id: string | null;
  product_profile_id: string | null;
  name: string;
  subtitle: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProductItem {
  id: string;
  product_id: string;
  product_profile_id: string | null;
  product_category_id: string | null;
  name: string;
  weight: string | null;
  length: string | null;
  image: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProductPremium {
  id: string;
  product_id: string;
  material_fullname: string | null;
  material_name: string | null;
  size_per_panel: string | null;
  effective_size: string | null;
  reng_distance: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Certificate {
  id: string;
  name: string;
  image: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProductBadge {
  id: string;
  name: string;
  image: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProductCertificate {
  id: string;
  product_id: string;
  certificate_id: string;
  created_at: string | null;
}

export interface ProductProfileCertificate {
  id: string;
  product_profile_id: string;
  certificate_id: string;
  created_at: string | null;
}

export interface ProductProfileBadge {
  id: string;
  product_profile_id: string;
  badge_id: string;
  created_at: string | null;
}

// Extended types with relationships
export interface ProductWithRelations extends Product {
  profiles?: ProductProfile[] | Array<{ count: number }>;
  categories?: ProductCategory[];
  items?: ProductItem[] | Array<{ count: number }>;
  premium?: ProductPremium;
  profilesCount?: number;
  itemsCount?: number;
  certificates?: Certificate[];
}

export interface ProductProfileWithRelations extends ProductProfile {
  categories?: ProductCategory[];
  items?: ProductItem[];
  certificates?: Certificate[];
  badges?: ProductBadge[];
}

export interface ProductCategoryWithRelations extends ProductCategory {
  items?: ProductItem[];
  product?: Product;
  profile?: ProductProfile;
}

// Flow types for product items
export type ProductFlowType =
  | "direct" // product → item
  | "category" // product → category → item
  | "profile" // product → profile → item
  | "profile-category"; // product → profile → category → item

// Form data types
export interface ProductFormData {
  name: string;
  title?: string;
  description_en?: string;
  description_id?: string;
  catalogue?: string;
  suitables?: string[];
  is_highlight?: boolean;
  brand_image?: string;
  slug?: string;
}

export interface ProfileFormData {
  product_id: string;
  name: string;
  size_per_panel?: string;
  effective_size?: string;
  panel_amount?: number;
  materials?: string;
  tkdn_value?: string;
  thickness?: string;
  weight?: string;
  size?: Array<{
    name: string;
    weight: string;
    thickness: string;
  }>;
  certificates?: string[];
  badges?: string[];
}

export interface CategoryFormData {
  product_id?: string;
  product_profile_id?: string;
  name: string;
  subtitle?: string;
}

export interface ItemFormData {
  product_id: string;
  product_profile_id?: string;
  product_category_id?: string;
  name: string;
  weight?: string;
  length?: string;
  image: string;
  flow_type: ProductFlowType;
}

export interface PremiumFormData {
  product_id: string;
  material_fullname?: string;
  material_name?: string;
  size_per_panel?: string;
  effective_size?: string;
  reng_distance?: string;
}
