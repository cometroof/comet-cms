// Types for Contacts & Location feature
// These types are structured to be compatible with Supabase tables

import { Database } from "@/lib/supabase-types";

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
  email_form: string;
  whatsapp_contact_service: string;
  created_at?: string;
  updated_at?: string;
}

export interface SocialMediaItem {
  value: string; // Social media URL
  image?: string; // Optional image URL
}

export interface SocialMediaEntry {
  id?: string;
  type: string; // e.g., 'twitter', 'instagram', or custom
  value: string; // social url
  image?: string;
  order?: number;
  is_social_media?: boolean;
  created_at?: string;
  updated_at?: string;
}
// export type SocialMediaEntry = Partial<
//   Database["public"]["Tables"]["contacts-location"]["Row"]
// >;

export interface SocialMedia {
  id: string;
  twitter?: SocialMediaItem;
  instagram?: SocialMediaItem;
  facebook?: SocialMediaItem;
  youtube?: SocialMediaItem;
  telegram?: SocialMediaItem;
  created_at?: string;
  updated_at?: string;
}

export interface Location {
  id: string;
  name: string;
  link: string; // Google Maps or location link
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: string;
  name: string;
  order: number;
  locations: Location[];
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
