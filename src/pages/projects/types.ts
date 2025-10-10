export interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectImage {
  id: string;
  image_url: string;
  is_highlight: boolean;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  location_text: string;
  location_link: string;
  roof_type: string;
  category_id: string; // Kept for backward compatibility, but will be deprecated
  category_ids: string[]; // New field for multiple categories
  order: number;
  images: ProjectImage[];
  created_at: string;
  updated_at: string;
}

export type CategoryFormData = Omit<
  Category,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;
export type ProjectFormData = Omit<Project, "id" | "created_at" | "updated_at">;
export type ProjectImageFormData = Omit<ProjectImage, "id">;
