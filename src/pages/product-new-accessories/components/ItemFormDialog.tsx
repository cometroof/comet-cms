import { useEffect, useState } from "react";
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
import { toast } from "sonner";
import { ProductItem } from "@/pages/product/types";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import { ImageIcon, X } from "lucide-react";

interface ItemFormDialogProps {
  productId: string;
  profileId: string | null;
  categoryId: string;
  item: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemFormData {
  name: string;
  length: string;
  weight: string;
  image: string;
}

const ItemFormDialog = ({
  productId,
  profileId,
  categoryId,
  item,
  isOpen,
  onClose,
  onSuccess,
}: ItemFormDialogProps) => {
  const [showImageSelector, setShowImageSelector] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ItemFormData>({
    defaultValues: {
      name: "",
      length: "",
      weight: "",
      image: "",
    },
  });

  const imageUrl = watch("image");

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        length: item.length || "",
        weight: item.weight || "",
        image: item.image || "",
      });
    } else {
      reset({
        name: "",
        length: "",
        weight: "",
        image: "",
      });
    }
  }, [item, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      if (item) {
        // Update existing item
        const { error } = await supabase
          .from("product_item")
          .update({
            name: data.name,
            length: data.length,
            weight: data.weight,
            image: data.image || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (error) throw error;
      } else {
        // Create new item (for accessories, profileId is null)
        const { error } = await supabase.from("product_item").insert({
          product_id: productId,
          product_profile_id: profileId,
          product_category_id: categoryId,
          name: data.name,
          length: data.length,
          weight: data.weight,
          image: data.image || null,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        item ? "Item updated successfully" : "Item created successfully"
      );
      onSuccess();
    },
    onError: (error) => {
      toast.error(item ? "Failed to update item" : "Failed to create item");
      console.error(error);
    },
  });

  const onSubmit = (data: ItemFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{item ? "Edit Item" : "Create New Item"}</DialogTitle>
            <DialogDescription>
              {item
                ? "Update the item information below"
                : "Fill in the details to create a new item"}
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
                placeholder="Enter item name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label>Item Image</Label>
              <div className="flex gap-2">
                <Input
                  value={imageUrl}
                  onChange={(e) => setValue("image", e.target.value)}
                  placeholder="Item image URL"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImageSelector(true)}
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
              {imageUrl && (
                <div className="relative w-full h-48 border rounded overflow-hidden group">
                  <img
                    src={imageUrl}
                    alt="Item preview"
                    className="w-full h-full object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100"
                    onClick={() => setValue("image", "")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Length and Weight */}
            {/* <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Length</Label>
                <Input
                  id="length"
                  {...register("length")}
                  placeholder="e.g., 6000mm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  {...register("weight")}
                  placeholder="e.g., 5.5 kg/m²"
                />
              </div>
            </div> */}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? "Saving..."
                  : item
                  ? "Update Item"
                  : "Create Item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Selector */}
      <ImageSelectorDialog
        open={showImageSelector}
        onOpenChange={setShowImageSelector}
        onSelect={(url) => setValue("image", url)}
        title="Select Item Image"
        multipleSelection={false}
        initialSelection={imageUrl}
      />
    </>
  );
};

export default ItemFormDialog;
