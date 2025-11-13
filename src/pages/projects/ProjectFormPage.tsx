// pages/ProjectFormPage.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Star, X, Loader2 } from "lucide-react";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useCategories,
  useProject,
  useCreateProject,
  useUpdateProject,
} from "./use-projects";
import {
  projectFormSchema,
  ProjectFormData,
  ProjectImage,
} from "./project-schema";
import { DashboardLayout } from "@/components";

// Fungsi generateSlug
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

const ProjectFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const { data: categories = [] } = useCategories();
  const { data: project, isLoading: isLoadingProject } = useProject(id || "");
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      location_text: "",
      location_link: "",
      roof_type: "",
      category_ids: [],
      images: [],
    },
  });

  // Load project data when editing
  useState(() => {
    if (project && isEditing) {
      form.reset({
        name: project.name,
        slug: project.slug || "",
        location_text: project.location_text,
        location_link: project.location_link,
        roof_type: project.roof_type,
        category_ids: project.category_ids,
        images: project.images,
      });
    }
  });

  // Handle name change with auto-slug generation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;

    // Update name field
    form.setValue("name", newName);

    // Auto-generate slug only for new projects and if slug is empty or matches current generated slug
    if (!isEditing) {
      const currentSlug = form.getValues("slug");
      const generatedSlug = generateSlug(newName);

      // Only auto-update slug if:
      // 1. Slug is empty, OR
      // 2. Slug matches the previously generated slug (user hasn't manually modified it)
      if (
        !currentSlug ||
        currentSlug === generateSlug(form.getValues("name"))
      ) {
        form.setValue("slug", generatedSlug);
      }
    }
  };

  // Handle slug change manually
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlug = e.target.value;
    form.setValue("slug", newSlug);
  };

  const handleAddImage = () => {
    setImageDialogOpen(true);
  };

  const handleImageSelect = (imageUrl: string) => {
    const currentImages = form.getValues("images");
    const newImage: ProjectImage = {
      id: `temp-${Date.now()}`,
      image_url: imageUrl,
      is_highlight: false,
      order: currentImages.length,
    };
    form.setValue("images", [...currentImages, newImage]);
    setImageDialogOpen(false);
  };

  const handleToggleHighlight = (index: number) => {
    const currentImages = form.getValues("images");
    const updatedImages = currentImages.map((img, i) => ({
      ...img,
      is_highlight: i === index ? !img.is_highlight : false,
    }));
    form.setValue("images", updatedImages);
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = form.getValues("images");
    const updatedImages = currentImages.filter((_, i) => i !== index);
    form.setValue("images", updatedImages);
  };

  const onSubmit = async (data: ProjectFormData) => {
    try {
      if (isEditing && id) {
        await updateProject.mutateAsync({ id, data });
      } else {
        await createProject.mutateAsync({
          ...data,
          order: 0, // Will be calculated on backend
        });
      }
      navigate("/dashboard/projects");
    } catch (error) {
      // Error handled in mutation
    }
  };

  const isLoading = form.formState.isSubmitting;

  if (isEditing && isLoadingProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-0 px-0 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/projects")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Edit Project" : "Add Project"}
          </h1>
        </div>

        {/* Form */}
        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Project Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter project name"
                        maxLength={200}
                        disabled={isLoading}
                        {...field}
                        onChange={handleNameChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Slug <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="auto-generated-slug"
                        disabled={isLoading}
                        {...field}
                        onChange={handleSlugChange}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      URL-friendly identifier (auto-generated from name)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Location <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Jakarta, Indonesia"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Link</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://maps.google.com/..."
                          type="url"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="roof_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Roof Type <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Metal Roof"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Categories <span className="text-destructive">*</span>
                      </FormLabel>
                      <Popover
                        open={categoryPopoverOpen}
                        onOpenChange={setCategoryPopoverOpen}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-start text-left font-normal"
                              disabled={isLoading}
                            >
                              {field.value.length > 0
                                ? `${field.value.length} selected`
                                : "Select categories..."}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search categories..." />
                            <CommandEmpty>No category found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {categories.map((category) => (
                                <CommandItem
                                  key={category.id}
                                  onSelect={() => {
                                    const newValue = field.value.includes(
                                      category.id,
                                    )
                                      ? field.value.filter(
                                          (id) => id !== category.id,
                                        )
                                      : [...field.value, category.id];
                                    field.onChange(newValue);
                                  }}
                                >
                                  <Checkbox
                                    checked={field.value.includes(category.id)}
                                    className="mr-2"
                                  />
                                  {category.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.map((catId) => {
                            const category = categories.find(
                              (c) => c.id === catId,
                            );
                            return category ? (
                              <Badge
                                key={catId}
                                variant="secondary"
                                className="gap-1"
                              >
                                {category.name}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newValue = field.value.filter(
                                      (id) => id !== catId,
                                    );
                                    field.onChange(newValue);
                                  }}
                                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                                  disabled={isLoading}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>
                        Images <span className="text-destructive">*</span>
                      </FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddImage}
                        className="gap-2"
                        disabled={isLoading}
                      >
                        <Plus className="h-4 w-4" />
                        Add Image
                      </Button>
                    </div>

                    {field.value.length === 0 ? (
                      <Card className="p-6 text-center text-muted-foreground">
                        No images added yet
                      </Card>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {field.value.map((image, index) => (
                          <Card key={image.id} className="p-3 space-y-2">
                            <div className="relative aspect-video rounded overflow-hidden bg-muted">
                              <img
                                src={image.image_url}
                                alt={`Project image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {image.is_highlight && (
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                  <Star className="h-3 w-3 fill-current" />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`highlight-${index}`}
                                  checked={image.is_highlight}
                                  onCheckedChange={() =>
                                    handleToggleHighlight(index)
                                  }
                                  disabled={isLoading}
                                />
                                <Label
                                  htmlFor={`highlight-${index}`}
                                  className="text-xs cursor-pointer"
                                >
                                  Highlight
                                </Label>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveImage(index)}
                                disabled={isLoading}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard/projects")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{isEditing ? "Update" : "Create"} Project</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Card>

        <ImageSelectorDialog
          open={imageDialogOpen}
          onOpenChange={setImageDialogOpen}
          onSelect={handleImageSelect}
        />
      </div>
    </DashboardLayout>
  );
};

export default ProjectFormPage;
