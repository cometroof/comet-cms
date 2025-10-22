import type { Tables } from "@/lib/supabase-types";

// Re-export types from Supabase schema
export type Certificate = Tables<"certificates">;
export type CompanyProfile = Tables<"company_profile">;
export type ProductBadge = Tables<"product_badges">;

// Form data types - omitting fields that are managed by the server
export type CertificateFormData = Omit<
  Certificate,
  "id" | "created_at" | "updated_at"
>;
export type CompanyProfileFormData = Omit<
  CompanyProfile,
  "id" | "uploaded_at" | "updated_at"
>;

export type ProductBadgeFormData = Omit<
  ProductBadge,
  "id" | "created_at" | "updated_at"
>;
