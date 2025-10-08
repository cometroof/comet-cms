// Types for Contacts & Location feature
// These types are structured to be compatible with Supabase tables

export interface Contacts {
  id: string;
  head_office: string; // Rich text HTML
  head_office_link: string; // Google Maps embed link
  phone: string;
  fax: string;
  email: string;
  whatsapp_contact_service: string;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  province_id: string;
  name: string;
  link: string; // Google Maps or location link
  created_at: string;
  updated_at: string;
}

export interface Province {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// Form types (without auto-generated fields)
export type ContactsFormData = Omit<Contacts, "id" | "created_at" | "updated_at">;
export type CityFormData = Omit<City, "id" | "created_at" | "updated_at">;
export type ProvinceFormData = Omit<Province, "id" | "created_at" | "updated_at">;
