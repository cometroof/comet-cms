// types/project-types.ts
import { Tables } from "@/lib/supabase-types";
import { ProjectFormData } from "./project-schema";

export type Project = Tables<"projects"> & {
  images: Tables<"project_images">[];
  category_ids: string[];
};

export type ProjectCategory = Tables<"project_categories">;

export type ProjectImage = Tables<"project_images">;

// For form operations
export type CreateProjectData = Omit<ProjectFormData, "id"> & {
  order: number;
};

export type UpdateProjectData = ProjectFormData & {
  id: string;
};
