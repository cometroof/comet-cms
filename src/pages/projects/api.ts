import { supabase } from "@/lib/supabase";
import { Category, Project, ProjectImage } from "./types";

// Categories API
export const categoriesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from("project_categories")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as Category[];
  },

  async create(category: Omit<Category, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("project_categories")
      .insert([category])
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  async update(id: string, category: Partial<Category>) {
    const { data, error } = await supabase
      .from("project_categories")
      .update({ ...category, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  async softDelete(id: string) {
    const { data, error } = await supabase
      .from("project_categories")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },
};

// Projects API
export const projectsApi = {
  async getAll() {
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .order("order", { ascending: true });

    if (projectsError) throw projectsError;

    // Fetch images for all projects
    const { data: images, error: imagesError } = await supabase
      .from("project_images")
      .select("*")
      .order("order", { ascending: true });

    if (imagesError) throw imagesError;

    // Fetch category relations for all projects
    const { data: categoryRelations, error: categoryRelationsError } =
      await supabase.from("project_category_relations").select("*");

    if (categoryRelationsError) throw categoryRelationsError;

    // Group images by project_id
    const imagesMap = (
      images as (ProjectImage & { project_id: string })[]
    ).reduce(
      (acc, img) => {
        if (!acc[img.project_id]) {
          acc[img.project_id] = [];
        }
        acc[img.project_id].push(img);
        return acc;
      },
      {} as Record<string, ProjectImage[]>,
    );

    // Group category IDs by project_id
    const categoriesMap = (
      categoryRelations as { project_id: string; category_id: string }[]
    ).reduce(
      (acc, rel) => {
        if (!acc[rel.project_id]) {
          acc[rel.project_id] = [];
        }
        acc[rel.project_id].push(rel.category_id);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    // Combine projects with their images and categories
    const projectsWithImages = projects.map((project) => ({
      ...project,
      images: imagesMap[project.id] || [],
      category_ids: categoriesMap[project.id] || [],
    }));

    return projectsWithImages as Project[];
  },

  async create(project: Omit<Project, "id" | "created_at" | "updated_at">) {
    const { images, category_ids, ...projectData } = project;

    // Insert project
    const { data: newProject, error: projectError } = await supabase
      .from("projects")
      .insert([projectData])
      .select()
      .single();

    if (projectError) throw projectError;

    // Insert category relations if any
    if (category_ids && category_ids.length > 0) {
      const categoryRelations = category_ids.map((categoryId) => ({
        project_id: newProject.id,
        category_id: categoryId,
      }));

      const { error: categoryError } = await supabase
        .from("project_category_relations")
        .insert(categoryRelations);

      if (categoryError) throw categoryError;
    }

    // Insert images if any
    if (images && images.length > 0) {
      const imagesData = images.map((img) => {
        // Omit the 'id' field to let Supabase auto-generate UUIDs
        const { id, ...imageWithoutId } = img;
        return {
          ...imageWithoutId,
          project_id: newProject.id,
        };
      });

      const { data: newImages, error: imagesError } = await supabase
        .from("project_images")
        .insert(imagesData)
        .select();

      if (imagesError) throw imagesError;

      return {
        ...newProject,
        images: newImages,
        category_ids: category_ids || [],
      } as Project;
    }

    return {
      ...newProject,
      images: [],
      category_ids: category_ids || [],
    } as Project;
  },

  async update(id: string, project: Partial<Project>) {
    const { images, category_ids, ...projectData } = project;

    // Update project
    const { data: updatedProject, error: projectError } = await supabase
      .from("projects")
      .update({ ...projectData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (projectError) throw projectError;

    // Handle category relations update if provided
    if (category_ids !== undefined) {
      // Delete existing category relations
      await supabase
        .from("project_category_relations")
        .delete()
        .eq("project_id", id);

      // Insert new category relations
      if (category_ids.length > 0) {
        const categoryRelations = category_ids.map((categoryId) => ({
          project_id: id,
          category_id: categoryId,
        }));

        const { error: categoryError } = await supabase
          .from("project_category_relations")
          .insert(categoryRelations);

        if (categoryError) throw categoryError;
      }
    }

    // Handle images update if provided
    if (images !== undefined) {
      // Delete existing images
      await supabase.from("project_images").delete().eq("project_id", id);

      // Insert new images
      if (images.length > 0) {
        const imagesData = images.map((img) => {
          // Omit the 'id' field to let Supabase auto-generate UUIDs
          // Only keep id if it's a valid UUID (not temp-*)
          const { id: imgId, ...imageWithoutId } = img;
          const shouldIncludeId =
            imgId &&
            !imgId.startsWith("temp-") &&
            imgId.match(
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            );

          return {
            ...imageWithoutId,
            ...(shouldIncludeId && { id: imgId }),
            project_id: id,
          };
        });

        const { data: newImages, error: imagesError } = await supabase
          .from("project_images")
          .insert(imagesData)
          .select();

        if (imagesError) throw imagesError;

        // Fetch category IDs
        const { data: categoryRelations } = await supabase
          .from("project_category_relations")
          .select("category_id")
          .eq("project_id", id);

        const finalCategoryIds =
          categoryRelations?.map((rel) => rel.category_id) || [];

        return {
          ...updatedProject,
          images: newImages,
          category_ids: finalCategoryIds,
        } as Project;
      }
    }

    // Fetch existing images if not updated
    const { data: existingImages } = await supabase
      .from("project_images")
      .select("*")
      .eq("project_id", id)
      .order("order", { ascending: true });

    // Fetch existing category relations
    const { data: existingCategoryRelations } = await supabase
      .from("project_category_relations")
      .select("category_id")
      .eq("project_id", id);

    const finalCategoryIds =
      existingCategoryRelations?.map((rel) => rel.category_id) || [];

    return {
      ...updatedProject,
      images: existingImages || [],
      category_ids: finalCategoryIds,
    } as Project;
  },

  async delete(id: string) {
    // Delete images first (due to foreign key constraint)
    await supabase.from("project_images").delete().eq("project_id", id);

    // Delete project
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) throw error;
  },

  async updateOrder(projects: { id: string; order: number }[]) {
    const updates = projects.map((project) =>
      supabase
        .from("projects")
        .update({ order: project.order })
        .eq("id", project.id),
    );

    await Promise.all(updates);
  },
};
