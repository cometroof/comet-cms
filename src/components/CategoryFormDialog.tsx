import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2 } from "lucide-react";
import ImageSelectorDialog from "./ImageSelectorDialog";

// Zod schema for validation
const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(200, "Category name must be less than 200 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be URL-friendly (lowercase letters, numbers, and hyphens)",
    ),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  onSave: (category: Category) => Promise<void> | void;
}

const CategoryFormDialog = ({
  open,
  onOpenChange,
  category,
  onSave,
}: CategoryFormDialogProps) => {
  const { toast } = useToast();
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    trigger,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
    mode: "onChange",
  });

  const nameValue = watch("name");
  const slugValue = watch("slug");

  // Generate slug from name when creating new category
  useEffect(() => {
    if (!category && nameValue) {
      const generatedSlug = nameValue
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setValue("slug", generatedSlug);
    }
  }, [nameValue, category, setValue]);

  // Reset form when dialog opens/closes or category changes
  useEffect(() => {
    if (open) {
      if (category) {
        setValue("name", category.name);
        setValue("slug", category.slug);
        setThumbnail(category.thumbnail);
      } else {
        reset();
        setThumbnail(null);
      }
    }
  }, [open, category, setValue, reset]);

  const handleAddImage = () => {
    setIsImageSelectorOpen(true);
  };

  const handleImageSelect = (imageUrl: string) => {
    setThumbnail(imageUrl);
    toast({
      title: "Thumbnail set",
      description: "Thumbnail has been successfully set for category",
    });
  };

  const handleRemoveThumbnail = () => {
    setThumbnail(null);
  };

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setIsSubmitting(true);
      setIsLoading(true);

      const now = new Date().toISOString();
      const categoryData: Category = {
        id: category?.id || "",
        name: data.name.trim(),
        slug: data.slug.trim(),
        thumbnail: thumbnail,
        deleted_at: null,
        created_at: category?.created_at || now,
        updated_at: now,
      };

      await onSave(categoryData);

      toast({
        title: category ? "Category updated" : "Category created",
        description: `Category "${data.name}" has been ${category ? "updated" : "created"} successfully.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${category ? "update" : "create"} category. Please try again.`,
        variant: "destructive",
      });
      console.error("Error saving category:", error);
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("slug", value, { shouldValidate: true });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("name", value, { shouldValidate: true });
  };

  const isFormValid = !errors.name && !errors.slug && nameValue && slugValue;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {category ? "Edit Category" : "Add Category"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  onChange={handleNameChange}
                  placeholder="Enter category name"
                  maxLength={200}
                  disabled={isSubmitting}
                />
                <div className="flex justify-between">
                  <p className="text-xs text-muted-foreground">
                    {nameValue?.length || 0}/200 characters
                  </p>
                  {errors.name && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Slug Field */}
              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  {...register("slug")}
                  onChange={handleSlugChange}
                  placeholder="category-slug"
                  disabled={isSubmitting}
                />
                <div className="flex justify-between">
                  <p className="text-xs text-muted-foreground">
                    URL-friendly version of the name
                  </p>
                  {errors.slug && (
                    <p className="text-xs text-destructive">
                      {errors.slug.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Thumbnail Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Category Thumbnail</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      This image will be used as the category thumbnail
                    </p>
                  </div>
                  {!thumbnail && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddImage}
                      className="gap-2"
                      disabled={isSubmitting}
                    >
                      <Plus className="h-4 w-4" />
                      Add Thumbnail
                    </Button>
                  )}
                </div>

                {thumbnail ? (
                  <Card className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="relative aspect-square w-32 rounded overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={thumbnail}
                          alt="Category thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-sm font-medium">
                            Thumbnail Preview
                          </p>
                          <p className="text-xs text-muted-foreground">
                            This image will be displayed as the category
                            thumbnail
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddImage}
                            disabled={isSubmitting}
                          >
                            Change Thumbnail
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveThumbnail}
                            disabled={isSubmitting}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div
                    className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={handleAddImage}
                  >
                    <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to add thumbnail
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose from library or upload new image
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!isFormValid || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {category ? "Updating..." : "Creating..."}
                  </>
                ) : category ? (
                  "Update Category"
                ) : (
                  "Create Category"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Selector Dialog */}
      <ImageSelectorDialog
        open={isImageSelectorOpen}
        onOpenChange={setIsImageSelectorOpen}
        onSelect={handleImageSelect}
        title="Select Category Thumbnail"
        multiple={false}
        multipleSelection={false}
        initialSelection={thumbnail || ""}
      />
    </>
  );
};

export default CategoryFormDialog;
