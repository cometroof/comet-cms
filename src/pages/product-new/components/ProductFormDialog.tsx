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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Product } from "@/pages/product/types";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import FileSelectorDialog from "@/components/FileSelectorDialog/FileSelectorDialog";
import { ImageIcon, FileText, X } from "lucide-react";

interface ProductFormDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProductFormData {
  name: string;
  title: string;
  description_en: string;
  description_id: string;
  order: number;
  slug: string;
  brand_image: string;
  product_main_image: string;
  banner_url: string;
  catalogue: string;
}

const ProductFormDialog = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}: ProductFormDialogProps) => {
  const [showBrandImageSelector, setShowBrandImageSelector] = useState(false);
  const [showMainImageSelector, setShowMainImageSelector] = useState(false);
  const [showBannerSelector, setShowBannerSelector] = useState(false);
  const [showCatalogueSelector, setShowCatalogueSelector] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      name: "",
      title: "",
      description_en: "",
      description_id: "",
      order: 0,
      slug: "",
      brand_image: "",
      product_main_image: "",
      banner_url: "",
      catalogue: "",
    },
  });

  const brandImage = watch("brand_image");
  const mainImage = watch("product_main_image");
  const bannerUrl = watch("banner_url");
  const catalogue = watch("catalogue");

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        title: product.title || "",
        description_en: product.description_en || "",
        description_id: product.description_id || "",
        order: product.order,
        slug: product.slug || "",
        brand_image: product.brand_image || "",
        product_main_image: product.product_main_image || "",
        banner_url: product.banner_url || "",
        catalogue: product.catalogue || "",
      });
    } else {
      reset({
        name: "",
        title: "",
        description_en: "",
        description_id: "",
        order: 0,
        slug: "",
        brand_image: "",
        product_main_image: "",
        banner_url: "",
        catalogue: "",
      });
    }
  }, [product, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (product) {
        // Update existing product
        const { error } = await supabase
          .from("product")
          .update({
            name: data.name,
            title: data.title,
            description_en: data.description_en,
            description_id: data.description_id,
            order: data.order,
            slug: data.slug,
            brand_image: data.brand_image || null,
            product_main_image: data.product_main_image || null,
            banner_url: data.banner_url || null,
            catalogue: data.catalogue || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        if (error) throw error;
      } else {
        // Create new product
        const { error } = await supabase.from("product").insert({
          name: data.name,
          title: data.title,
          description_en: data.description_en,
          description_id: data.description_id,
          order: data.order,
          slug: data.slug,
          brand_image: data.brand_image || null,
          product_main_image: data.product_main_image || null,
          banner_url: data.banner_url || null,
          catalogue: data.catalogue || null,
          is_under_product: true,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        product
          ? "Product updated successfully"
          : "Product created successfully",
      );
      onSuccess();
    },
    onError: (error) => {
      toast.error(
        product ? "Failed to update product" : "Failed to create product",
      );
      console.error(error);
    },
  });

  const onSubmit = (data: ProductFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {product ? "Edit Product" : "Create New Product"}
            </DialogTitle>
            <DialogDescription>
              {product
                ? "Update the product information below"
                : "Fill in the details to create a new product"}
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
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Enter product title"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="product-slug"
              />
            </div>

            {/* Order */}
            <div className="space-y-2">
              <Label htmlFor="order">
                Order <span className="text-destructive">*</span>
              </Label>
              <Input
                id="order"
                type="number"
                {...register("order", {
                  required: "Order is required",
                  valueAsNumber: true,
                })}
                placeholder="0"
              />
              {errors.order && (
                <p className="text-sm text-destructive">
                  {errors.order.message}
                </p>
              )}
            </div>

            {/* Brand Image */}
            <div className="space-y-2">
              <Label>Brand Image</Label>
              <div className="flex gap-2">
                <Input
                  value={brandImage}
                  onChange={(e) => setValue("brand_image", e.target.value)}
                  placeholder="Brand image URL"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBrandImageSelector(true)}
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
              {brandImage && (
                <div className="relative w-32 h-32 border rounded overflow-hidden group">
                  <img
                    src={brandImage}
                    alt="Brand"
                    className="w-full h-full object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => setValue("brand_image", "")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Product Main Image */}
            <div className="space-y-2">
              <Label>Product Main Image</Label>
              <div className="flex gap-2">
                <Input
                  value={mainImage}
                  onChange={(e) =>
                    setValue("product_main_image", e.target.value)
                  }
                  placeholder="Main image URL"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMainImageSelector(true)}
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
              {mainImage && (
                <div className="relative w-32 h-32 border rounded overflow-hidden group">
                  <img
                    src={mainImage}
                    alt="Main"
                    className="w-full h-full object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => setValue("product_main_image", "")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Banner Image */}
            <div className="space-y-2">
              <Label>Banner Image</Label>
              <div className="flex gap-2">
                <Input
                  value={bannerUrl}
                  onChange={(e) => setValue("banner_url", e.target.value)}
                  placeholder="Banner image URL"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBannerSelector(true)}
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
              {bannerUrl && (
                <div className="relative w-full h-32 border rounded overflow-hidden group">
                  <img
                    src={bannerUrl}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => setValue("banner_url", "")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Catalogue */}
            <div className="space-y-2">
              <Label>Catalogue (PDF)</Label>
              <div className="flex gap-2">
                <Input
                  value={catalogue}
                  onChange={(e) => setValue("catalogue", e.target.value)}
                  placeholder="Catalogue file URL"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCatalogueSelector(true)}
                >
                  <FileText className="w-4 h-4" />
                </Button>
              </div>
              {catalogue && (
                <div className="flex items-center gap-2 p-2 border rounded">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm truncate flex-1">{catalogue}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setValue("catalogue", "")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Description English */}
            <div className="space-y-2">
              <Label htmlFor="description_en">Description (English)</Label>
              <Textarea
                id="description_en"
                {...register("description_en")}
                placeholder="Enter English description"
                rows={4}
              />
            </div>

            {/* Description Indonesian */}
            <div className="space-y-2">
              <Label htmlFor="description_id">Description (Indonesian)</Label>
              <Textarea
                id="description_id"
                {...register("description_id")}
                placeholder="Enter Indonesian description"
                rows={4}
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
                  : product
                    ? "Update Product"
                    : "Create Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Selectors */}
      <ImageSelectorDialog
        open={showBrandImageSelector}
        onOpenChange={setShowBrandImageSelector}
        onSelect={(url) => setValue("brand_image", url)}
        title="Select Brand Image"
        multipleSelection={false}
        initialSelection={brandImage}
      />

      <ImageSelectorDialog
        open={showMainImageSelector}
        onOpenChange={setShowMainImageSelector}
        onSelect={(url) => setValue("product_main_image", url)}
        title="Select Main Product Image"
        multipleSelection={false}
        initialSelection={mainImage}
      />

      <ImageSelectorDialog
        open={showBannerSelector}
        onOpenChange={setShowBannerSelector}
        onSelect={(url) => setValue("banner_url", url)}
        title="Select Banner Image"
        multipleSelection={false}
        initialSelection={bannerUrl}
      />

      <FileSelectorDialog
        open={showCatalogueSelector}
        onOpenChange={setShowCatalogueSelector}
        onSelect={(url) =>
          setValue("catalogue", typeof url === "string" ? url : url[0])
        }
        title="Select Catalogue PDF"
        acceptedFileTypes=".pdf,application/pdf"
        multipleSelection={false}
        initialSelection={catalogue}
      />
    </>
  );
};

export default ProductFormDialog;
