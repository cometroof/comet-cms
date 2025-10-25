// Product Management Types
// These types match the database schema and include additional types for the UI
import {
  Database,
  type Tables,
  type TablesInsert,
  type TablesUpdate,
} from "@/lib/supabase-types";

// Use Database types directly
export type Product = Tables<"product">;
export type ProductProfile = Tables<"product_profile">;
export type ProductCategory = Tables<"product_category">;
export type ProductItem = Tables<"product_item">;
export type ProductPremium = Tables<"product_premium">;
export type Certificate = Tables<"certificates">;
export type ProductBadge = Tables<"product_badges">;
export type ProductCertificate = Tables<"product_certificates">;
export type ProductProfileCertificate = Tables<"product_profile_certificates">;
export type ProductProfileBadge = Tables<"product_profile_badges">;

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

type ProductProfileFormDB = Omit<
  Database["public"]["Tables"]["product_profile"]["Insert"],
  "size"
>;

export interface ProfileFormData extends ProductProfileFormDB {
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
  spec_info?: Record<string, string>;
  image: string;
  flow_type: ProductFlowType;
}

export interface PremiumFormData {
  product_id: string;
  product_profile_id?: string;
  material_fullname?: string;
  material_name?: string;
  size_per_panel?: string;
  effective_size?: string;
  reng_distance?: string;
  description_en?: string;
  description_id?: string;
  premium_image_url?: string;
  content_image_url?: string;
  created_at?: string | null;
  updated_at?: string | null;
}
