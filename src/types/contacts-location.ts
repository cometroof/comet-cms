// Types for Contacts & Location feature
// These types are structured to be compatible with Supabase tables

// Base Supabase entry type for contacts-location table
export interface ContactLocationEntry {
  id: string;
  type: string; // Field identifier (e.g., 'head_office', 'phone', 'provinces', 'cities_1')
  value: string; // Field value (text, HTML, URL, or JSON string)
  created_at: string;
  updated_at: string;
}

export interface Contacts {
  id: string;
  head_office: string; // Rich text HTML
  head_office_link: string; // Google Maps embed link
  phone: string;
  fax: string;
  email: string;
  whatsapp_contact_service: string;
  created_at?: string;
  updated_at?: string;
}

export interface Location {
  id: string;
  province_code: string;
  name: string;
  link: string; // Google Maps or location link
  created_at: string;
  updated_at: string;
}

export interface Province {
  code: string;
  name: string;
}

// Form types (without auto-generated fields)
export type ContactsFormData = Omit<
  Contacts,
  "id" | "created_at" | "updated_at"
>;
export type LocationFormData = Omit<
  Location,
  "id" | "created_at" | "updated_at"
>;
