export interface CompanyProfile {
  id: string;
  file_url: string;
  filename: string;
  file_size: number;
  uploaded_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  name: string;
  info: string;
  is_important: boolean;
  description_en: string;
  description_id: string;
  file_url: string;
  filename: string;
  created_at: string;
  updated_at: string;
}

export type CertificateFormData = Omit<Certificate, "id" | "created_at" | "updated_at">;
export type CompanyProfileFormData = Omit<CompanyProfile, "id" | "uploaded_at" | "updated_at">;