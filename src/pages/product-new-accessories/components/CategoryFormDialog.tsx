import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ProductCategory } from "@/pages/product/types";

interface CategoryFormDialogProps {
  productId: string;
  profileId: string | null;
  category: ProductCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CategoryFormData {
  name: string;
  subtitle: string;
}

const CategoryFormDialog = ({
  productId,
  profileId,
  category,
  isOpen,
  onClose,
  onSuccess,
}: CategoryFormDialogProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    defaultValues: {
      name: "",
      subtitle: "",
    },
  });

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        subtitle: category.subtitle || "",
      });
    } else {
      reset({
        name: "",
        subtitle: "",
      });
    }
  }, [category, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (category) {
        // Update existing category
        const { error } = await supabase
          .from("product_category")
          .update({
            name: data.name,
            subtitle: data.subtitle,
            updated_at: new Date().toISOString(),
          })
          .eq("id", category.id);

        if (error) throw error;
      } else {
        // Create new category (for accessories, profileId is null)
        const { error } = await supabase.from("product_category").insert({
          product_id: productId,
          product_profile_id: profileId,
          name: data.name,
          subtitle: data.subtitle,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        category
          ? "Category updated successfully"
          : "Category created successfully"
      );
      onSuccess();
    },
    onError: (error) => {
      toast.error(
        category ? "Failed to update category" : "Failed to create category"
      );
      console.error(error);
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Category" : "Create New Category"}
          </DialogTitle>
          <DialogDescription>
            {category
              ? "Update the category information below"
              : "Fill in the details to create a new category"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name", { required: "Name is required" })}
              placeholder="Enter category name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Subtitle */}
          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Textarea
              id="subtitle"
              {...register("subtitle")}
              placeholder="Enter category subtitle or description"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Saving..."
                : category
                ? "Update Category"
                : "Create Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryFormDialog;
