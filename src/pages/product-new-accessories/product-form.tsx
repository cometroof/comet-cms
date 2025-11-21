import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Product } from "@/pages/product/types";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import FileSelectorDialog from "@/components/FileSelectorDialog/FileSelectorDialog";
import {
  ChevronLeft,
  FileText,
  X,
  ImageUp,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

interface SuitableRow {
  en: string;
  id: string;
}

const ProductAccessoriesFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [showBrandImageSelector, setShowBrandImageSelector] = useState(false);
  const [showMainImageSelector, setShowMainImageSelector] = useState(false);
  const [showBannerSelector, setShowBannerSelector] = useState(false);
  const [showCatalogueSelector, setShowCatalogueSelector] = useState(false);
  const [suitables, setSuitables] = useState<SuitableRow[]>([
    { en: "", id: "" },
  ]);

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

  // Fetch product data if editing
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product-accessories", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product")
        .select("*")
        .eq("id", id)
        .eq("is_under_product", true)
        .eq("type", "accessories")
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: isEditMode,
  });

  // Reset form when product data is loaded
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

      // Parse suitables from JSON
      const suitablesEn = product.suitables
        ? ((Array.isArray(product.suitables)
            ? product.suitables
            : []) as string[])
        : [];
      const suitablesId = product.suitables_id
        ? ((Array.isArray(product.suitables_id)
            ? product.suitables_id
            : []) as string[])
        : [];

      const maxLength = Math.max(suitablesEn.length, suitablesId.length, 1);
      const suitablesData: SuitableRow[] = [];
      for (let i = 0; i < maxLength; i++) {
        suitablesData.push({
          en: suitablesEn[i] || "",
          id: suitablesId[i] || "",
        });
      }
      setSuitables(suitablesData);
    }
  }, [product, reset]);

  const addSuitableRow = () => {
    setSuitables([...suitables, { en: "", id: "" }]);
  };

  const removeSuitableRow = (index: number) => {
    if (suitables.length > 1) {
      setSuitables(suitables.filter((_, i) => i !== index));
    }
  };

  const updateSuitableRow = (
    index: number,
    field: "en" | "id",
    value: string
  ) => {
    const updated = [...suitables];
    updated[index][field] = value;
    setSuitables(updated);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // Prepare suitables data
      const suitablesEn = suitables
        .map((s) => s.en)
        .filter((s) => s.trim() !== "");
      const suitablesId = suitables
        .map((s) => s.id)
        .filter((s) => s.trim() !== "");

      if (isEditMode) {
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
            suitables: suitablesEn.length > 0 ? suitablesEn : null,
            suitables_id: suitablesId.length > 0 ? suitablesId : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

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
          suitables: suitablesEn.length > 0 ? suitablesEn : null,
          suitables_id: suitablesId.length > 0 ? suitablesId : null,
          is_under_product: true,
          type: "accessories",
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        isEditMode
          ? "Accessories brand updated successfully"
          : "Accessories brand created successfully"
      );
      navigate(`/dashboard/product-accessories/${id || ""}`);
    },
    onError: (error) => {
      toast.error(
        isEditMode
          ? "Failed to update accessories brand"
          : "Failed to create accessories brand"
      );
      console.error(error);
    },
  });

  const onSubmit = (data: ProductFormData) => {
    saveMutation.mutate(data);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  if (isEditMode && productLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading product...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBackClick}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEditMode
                ? "Edit Accessories Brand"
                : "Create New Accessories Brand"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditMode
                ? "Update the accessories brand information below"
                : "Fill in the details to create a new accessories brand"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information Group */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Core product details and identification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                {product ? (
                  <Badge className="ml-4" variant="outline">
                    /{product.slug}
                  </Badge>
                ) : (
                  <Input
                    id="slug"
                    {...register("slug")}
                    placeholder="accessories-product-slug"
                  />
                )}
              </div>

              {/* Order */}
              {/*<div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  {...register("order", { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>*/}
            </CardContent>
          </Card>

          {/* Media Group */}
          <Card>
            <CardHeader>
              <CardTitle>Media & Assets</CardTitle>
              <CardDescription>
                Product images and catalogue files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {/* Brand Image */}
                <div className="space-y-2 col-span-1">
                  <Label>Brand Image</Label>
                  <div
                    className="relative size-full border rounded overflow-hidden group cursor-pointer"
                    onClick={() => setShowBrandImageSelector(true)}
                  >
                    {brandImage ? (
                      <>
                        <img
                          src={brandImage}
                          alt="Brand"
                          className="size-full object-contain"
                        />
                        <div className="absolute left-0 top-0 size-full bg-black/40 opacity-0 flex items-center justify-center group-hover:opacity-100 pointer-events-none text-sm text-white">
                          <ImageUp className="size-6" />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setValue("brand_image", "");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="size-full flex items-center justify-center bg-muted">
                        <ImageUp className="size-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Main Image */}
                <div className="space-y-2 col-span-1">
                  <Label>Product Main Image</Label>
                  <div
                    className="relative size-full border rounded overflow-hidden group cursor-pointer"
                    onClick={() => setShowMainImageSelector(true)}
                  >
                    {mainImage ? (
                      <>
                        <img
                          src={mainImage}
                          alt="Main"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute left-0 top-0 size-full bg-black/40 opacity-0 flex items-center justify-center group-hover:opacity-100 pointer-events-none text-sm text-white">
                          <ImageUp className="size-6" />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setValue("product_main_image", "");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="size-full flex items-center justify-center bg-muted">
                        <ImageUp className="size-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Image */}
                <div className="space-y-2 col-span-2">
                  <Label>Banner Image</Label>
                  <div
                    className="relative w-full aspect-[2.5/1] border rounded overflow-hidden group cursor-pointer"
                    onClick={() => setShowBannerSelector(true)}
                  >
                    {bannerUrl ? (
                      <>
                        <img
                          src={bannerUrl}
                          alt="Banner"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute left-0 top-0 size-full bg-black/40 opacity-0 flex items-center justify-center group-hover:opacity-100 pointer-events-none text-sm text-white">
                          <ImageUp className="size-6" />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setValue("banner_url", "");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="size-full flex items-center justify-center bg-muted">
                        <ImageUp className="size-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
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
            </CardContent>
          </Card>

          {/* Descriptions - Side by Side */}
          <Card>
            <CardHeader>
              <CardTitle>Descriptions</CardTitle>
              <CardDescription>
                Product descriptions in multiple languages (side-by-side)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* English Description */}
                <div className="space-y-2">
                  <Label
                    htmlFor="description_en"
                    className="text-base font-semibold"
                  >
                    English
                  </Label>
                  <Textarea
                    id="description_en"
                    {...register("description_en")}
                    placeholder="Enter English description"
                    rows={8}
                    className="resize-none"
                  />
                </div>

                {/* Indonesian Description */}
                <div className="space-y-2">
                  <Label
                    htmlFor="description_id"
                    className="text-base font-semibold"
                  >
                    Indonesian
                  </Label>
                  <Textarea
                    id="description_id"
                    {...register("description_id")}
                    placeholder="Masukkan deskripsi bahasa Indonesia"
                    rows={8}
                    className="resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suitables - Side by Side */}
          <Card>
            <CardHeader>
              <CardTitle>Suitables</CardTitle>
              <CardDescription>
                List of suitable applications or use cases in both languages
                (side-by-side)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {/* Header Labels */}
                <div className="grid grid-cols-[1fr,1fr,auto] gap-2">
                  <Label className="text-sm text-muted-foreground">
                    English
                  </Label>
                  <Label className="text-sm text-muted-foreground">
                    Indonesian
                  </Label>
                  <div className="w-10"></div>
                </div>

                {/* Suitable Rows */}
                {suitables.map((suitable, index) => (
                  <div key={index}>
                    <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-start">
                      {/* English Input */}
                      <Input
                        value={suitable.en}
                        onChange={(e) =>
                          updateSuitableRow(index, "en", e.target.value)
                        }
                        placeholder="e.g., Residential buildings"
                      />

                      {/* Indonesian Input */}
                      <Input
                        value={suitable.id}
                        onChange={(e) =>
                          updateSuitableRow(index, "id", e.target.value)
                        }
                        placeholder="e.g., Bangunan residensial"
                      />

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSuitableRow(index)}
                        disabled={suitables.length === 1}
                        className="flex-shrink-0"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {index < suitables.length - 1 && (
                      <Separator className="mt-3" />
                    )}
                  </div>
                ))}
              </div>

              {/* Add Row Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSuitableRow}
                className="w-full mt-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Suitable Item
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2 pb-8 sticky bottom-0 bg-background py-4 border-t">
            <Button type="button" variant="outline" onClick={handleBackClick}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Saving..."
                : isEditMode
                ? "Update Product"
                : "Create Product"}
            </Button>
          </div>
        </form>
      </div>

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
    </DashboardLayout>
  );
};

export default ProductAccessoriesFormPage;
