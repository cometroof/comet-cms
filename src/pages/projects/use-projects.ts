// hooks/use-projects.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Project,
  ProjectCategory,
  CreateProjectData,
  UpdateProjectData,
} from "./project-types";

// Fetch all projects with images and categories
export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async (): Promise<Project[]> => {
      const { data: projects, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          images:project_images(*),
          category_relations:project_category_relations(
            category:project_categories(*)
          )
        `,
        )
        .order("order", { ascending: true });

      if (error) throw error;

      // Transform data to include category_ids array
      return projects.map((project) => ({
        ...project,
        category_ids:
          project.category_relations?.map((rel) => rel.category.id) || [],
        images: project.images || [],
      }));
    },
  });
};

// Fetch single project
export const useProject = (id: string) => {
  return useQuery({
    queryKey: ["project", id],
    queryFn: async (): Promise<Project | null> => {
      if (!id) return null;

      const { data: project, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          images:project_images(*),
          category_relations:project_category_relations(
            category:project_categories(*)
          )
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      return {
        ...project,
        category_ids:
          project.category_relations?.map((rel) => rel.category.id) || [],
        images: project.images || [],
      };
    },
    enabled: !!id,
  });
};

// Fetch categories
export const useCategories = () => {
  return useQuery({
    queryKey: ["project-categories"],
    queryFn: async (): Promise<ProjectCategory[]> => {
      const { data: categories, error } = await supabase
        .from("project_categories")
        .select("*")
        .is("deleted_at", null)
        .order("order", { ascending: true });

      if (error) throw error;
      return categories;
    },
  });
};

// Create project
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (projectData: CreateProjectData) => {
      const { images, category_ids, ...projectBase } = projectData;

      // Create project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          ...projectBase,
          category_id: category_ids[0], // Keep for backward compatibility
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Create project images
      if (images.length > 0) {
        const { error: imagesError } = await supabase
          .from("project_images")
          .insert(
            images.map((image, index) => ({
              ...image,
              project_id: project.id,
              order: index,
            })),
          );

        if (imagesError) throw imagesError;
      }

      // Create category relations
      if (category_ids.length > 0) {
        const { error: categoriesError } = await supabase
          .from("project_category_relations")
          .insert(
            category_ids.map((category_id) => ({
              project_id: project.id,
              category_id,
            })),
          );

        if (categoriesError) throw categoriesError;
      }

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });
};

// Update project
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProjectData;
    }) => {
      const { images, category_ids, ...projectBase } = data;

      // Update project
      const { error: projectError } = await supabase
        .from("projects")
        .update({
          ...projectBase,
          category_id: category_ids[0], // Keep for backward compatibility
        })
        .eq("id", id);

      if (projectError) throw projectError;

      // Delete existing images and category relations
      await Promise.all([
        supabase.from("project_images").delete().eq("project_id", id),
        supabase
          .from("project_category_relations")
          .delete()
          .eq("project_id", id),
      ]);

      // Create new images
      if (images.length > 0) {
        const { error: imagesError } = await supabase
          .from("project_images")
          .insert(
            images.map((image, index) => ({
              ...image,
              project_id: id,
              order: index,
            })),
          );

        if (imagesError) throw imagesError;
      }

      // Create new category relations
      if (category_ids.length > 0) {
        const { error: categoriesError } = await supabase
          .from("project_category_relations")
          .insert(
            category_ids.map((category_id) => ({
              project_id: id,
              category_id,
            })),
          );

        if (categoriesError) throw categoriesError;
      }

      return { id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    },
  });
};

// Delete project
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    },
  });
};

// Update project order
export const useUpdateProjectOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (projects: { id: string; order: number }[]) => {
      // Update projects in batch
      const updates = projects.map((project) =>
        supabase
          .from("projects")
          .update({ order: project.order })
          .eq("id", project.id),
      );

      const results = await Promise.all(updates);

      // Check for errors
      const errors = results.filter((result) => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} projects`);
      }

      return projects;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Success",
        description: "Project order updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update project order",
        variant: "destructive",
      });
    },
  });
};
