// schemas/project-schema.ts
import { z } from "zod";

export const projectImageSchema = z.object({
  id: z.string(),
  image_url: z.string().url("Must be a valid URL"),
  is_highlight: z.boolean().default(false),
  order: z.number().min(0),
});

export const projectFormSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(200, "Project name must be less than 200 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  location_text: z.string().min(1, "Location is required"),
  location_link: z.string().url("Must be a valid URL").or(z.literal("")),
  roof_type: z.string().min(1, "Roof type is required"),
  category_ids: z
    .array(z.string())
    .min(1, "Please select at least one category"),
  images: z.array(projectImageSchema).min(1, "Please add at least one image"),
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;
export type ProjectImage = z.infer<typeof projectImageSchema>;
