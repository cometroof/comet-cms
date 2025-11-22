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
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/RichTextEditor";

interface ProductFormData {
  name: string;
  title: string;
  title_id: string;
  description_en: string;
  description_id: string;
  order: number;
  slug: string;
  brand_image: string;
  product_main_image: string;
  banner_url: string;
  catalogue: string;
  meta_desc_en: string;
  meta_desc_id: string;
}

interface ProductPremiumData {
  id?: string;
  material_name: string;
  material_fullname: string;
  description_en: string;
  description_id: string;
  size_per_panel: string;
  effective_size: string;
  reng_distance: string;
  premium_image_url: string;
  content_image_url: string;
}

interface SuitableRow {
  en: string;
  id: string;
}

const ProductFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [showBrandImageSelector, setShowBrandImageSelector] = useState(false);
  const [showMainImageSelector, setShowMainImageSelector] = useState(false);
  const [showBannerSelector, setShowBannerSelector] = useState(false);
  const [showCatalogueSelector, setShowCatalogueSelector] = useState(false);
  const [showPremiumImageSelector, setShowPremiumImageSelector] =
    useState(false);
  const [suitables, setSuitables] = useState<SuitableRow[]>([
    { en: "", id: "" },
  ]);
  const [premiumEnabled, setPremiumEnabled] = useState(false);
  const [premiumData, setPremiumData] = useState<ProductPremiumData>({
    material_name: "",
    material_fullname: "",
    description_en: "",
    description_id: "",
    size_per_panel: "",
    effective_size: "",
    reng_distance: "",
    premium_image_url: "",
    content_image_url: "",
  });

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
      title_id: "",
      description_en: "",
      description_id: "",
      order: 0,
      slug: "",
      brand_image: "",
      product_main_image: "",
      banner_url: "",
      catalogue: "",
      meta_desc_en: "",
      meta_desc_id: "",
    },
  });

  const brandImage = watch("brand_image");
  const mainImage = watch("product_main_image");
  const bannerUrl = watch("banner_url");
  const catalogue = watch("catalogue");

  // Fetch product data if editing
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product-new", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product")
        .select("*")
        .eq("id", id)
        .eq("is_under_product", true)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: isEditMode,
  });

  // Fetch product premium data if editing
  const { data: productPremium, isLoading: premiumLoading } = useQuery({
    queryKey: ["product-premium", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_premium")
        .select("*")
        .eq("product_id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: isEditMode,
  });

  // Reset form when product data is loaded
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        title: product.title || "",
        title_id: product.title_id || "",
        description_en: product.description_en || "",
        description_id: product.description_id || "",
        order: product.order,
        slug: product.slug || "",
        brand_image: product.brand_image || "",
        product_main_image: product.product_main_image || "",
        banner_url: product.banner_url || "",
        catalogue: product.catalogue || "",
        meta_desc_en: product.meta_desc_en || "",
        meta_desc_id: product.meta_desc_id || "",
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

  // Load premium data when available
  useEffect(() => {
    if (productPremium) {
      setPremiumEnabled(true);
      setPremiumData({
        id: productPremium.id,
        material_name: productPremium.material_name || "",
        material_fullname: productPremium.material_fullname || "",
        description_en: productPremium.description_en || "",
        description_id: productPremium.description_id || "",
        size_per_panel: productPremium.size_per_panel || "",
        effective_size: productPremium.effective_size || "",
        reng_distance: productPremium.reng_distance || "",
        premium_image_url: productPremium.premium_image_url || "",
        content_image_url: productPremium.content_image_url || "",
      });
    }
  }, [productPremium]);

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
            title_id: data.title_id,
            description_en: data.description_en,
            description_id: data.description_id,
            meta_desc_en: data.meta_desc_en || null,
            meta_desc_id: data.meta_desc_id || null,
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

        // Handle product premium
        if (premiumEnabled) {
          // Check if premium already exists
          if (premiumData.id) {
            // Update existing premium
            const { error: premiumError } = await supabase
              .from("product_premium")
              .update({
                material_name: premiumData.material_name || null,
                material_fullname: premiumData.material_fullname || null,
                description_en: premiumData.description_en || null,
                description_id: premiumData.description_id || null,
                size_per_panel: premiumData.size_per_panel || null,
                effective_size: premiumData.effective_size || null,
                reng_distance: premiumData.reng_distance || null,
                premium_image_url: premiumData.premium_image_url || null,
                content_image_url: premiumData.content_image_url || null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", premiumData.id);

            if (premiumError) throw premiumError;
          } else {
            // Insert new premium
            const { error: premiumError } = await supabase
              .from("product_premium")
              .insert({
                product_id: id,
                material_name: premiumData.material_name || null,
                material_fullname: premiumData.material_fullname || null,
                description_en: premiumData.description_en || null,
                description_id: premiumData.description_id || null,
                size_per_panel: premiumData.size_per_panel || null,
                effective_size: premiumData.effective_size || null,
                reng_distance: premiumData.reng_distance || null,
                premium_image_url: premiumData.premium_image_url || null,
                content_image_url: premiumData.content_image_url || null,
              });

            if (premiumError) throw premiumError;
          }
        } else {
          // Delete premium if disabled
          if (premiumData.id) {
            const { error: deleteError } = await supabase
              .from("product_premium")
              .delete()
              .eq("id", premiumData.id);

            if (deleteError) throw deleteError;
          }
        }
      } else {
        // Create new product
        const { data: newProduct, error } = await supabase
          .from("product")
          .insert({
            name: data.name,
            title: data.title,
            title_id: data.title_id,
            description_en: data.description_en,
            description_id: data.description_id,
            meta_desc_en: data.meta_desc_en || null,
            meta_desc_id: data.meta_desc_id || null,
            order: data.order,
            slug: data.slug,
            brand_image: data.brand_image || null,
            product_main_image: data.product_main_image || null,
            banner_url: data.banner_url || null,
            catalogue: data.catalogue || null,
            suitables: suitablesEn.length > 0 ? suitablesEn : null,
            suitables_id: suitablesId.length > 0 ? suitablesId : null,
            is_under_product: true,
            type: "product",
          })
          .select()
          .single();

        if (error) throw error;

        // Create premium if enabled
        if (premiumEnabled && newProduct) {
          const { error: premiumError } = await supabase
            .from("product_premium")
            .insert({
              product_id: newProduct.id,
              material_name: premiumData.material_name || null,
              material_fullname: premiumData.material_fullname || null,
              description_en: premiumData.description_en || null,
              description_id: premiumData.description_id || null,
              size_per_panel: premiumData.size_per_panel || null,
              effective_size: premiumData.effective_size || null,
              reng_distance: premiumData.reng_distance || null,
              premium_image_url: premiumData.premium_image_url || null,
              content_image_url: premiumData.content_image_url || null,
            });

          if (premiumError) throw premiumError;
        }
      }
    },
    onSuccess: () => {
      toast.success(
        isEditMode
          ? "Product updated successfully"
          : "Product created successfully"
      );
      navigate(`/dashboard/product-new/${id || ""}`);
    },
    onError: (error) => {
      toast.error(
        isEditMode ? "Failed to update product" : "Failed to create product"
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

  if (isEditMode && (productLoading || premiumLoading)) {
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
              {isEditMode ? "Edit Brand" : "Create New Brand"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditMode
                ? "Update the brand information below"
                : "Fill in the details to create a new brand"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information Group */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Core product details and identificationsss
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

              <div className="grid grid-cols-2 gap-6 lg:gap-8">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="Enter product title"
                  />
                </div>

                {/* Title (Indonesian) */}
                <div className="space-y-2">
                  <Label htmlFor="title_id">Title (Indonesian)</Label>
                  <Input
                    id="title_id"
                    {...register("title_id")}
                    placeholder="Masukkan judul produk"
                  />
                </div>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                {product ? (
                  <Badge className="ml-4" variant="outline">
                    <span className="text-primary/60">/product</span>/
                    {product.slug}
                  </Badge>
                ) : (
                  <Input
                    id="slug"
                    {...register("slug")}
                    placeholder="product-slug"
                  />
                )}
              </div>

              {/* Meta Descriptions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_desc_en">
                    Meta Description (English)
                  </Label>
                  <Textarea
                    id="meta_desc_en"
                    {...register("meta_desc_en")}
                    placeholder="Enter meta description (EN)"
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_desc_id">
                    Meta Description (Indonesian)
                  </Label>
                  <Textarea
                    id="meta_desc_id"
                    {...register("meta_desc_id")}
                    placeholder="Masukkan meta deskripsi (ID)"
                    rows={3}
                    className="resize-none"
                  />
                </div>
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
                <div className="col-span-1 flex flex-col gap-2">
                  <Label>Brand Image</Label>
                  <div
                    className="relative w-full flex-1 border rounded overflow-hidden group cursor-pointer"
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
                <div className="col-span-1 flex flex-col gap-2">
                  <Label>Product Main Image</Label>
                  <div
                    className="relative w-full flex-1 border rounded overflow-hidden group cursor-pointer"
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
                <div className="col-span-2 flex flex-col gap-2">
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

          {/* Product Premium */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Premium</CardTitle>
                  <CardDescription>
                    Premium product information and specifications
                  </CardDescription>
                </div>
                <Switch
                  checked={premiumEnabled}
                  onCheckedChange={(checked) => {
                    setPremiumEnabled(checked);
                    if (!checked) {
                      // Reset premium data when disabled
                      setPremiumData({
                        material_name: "",
                        material_fullname: "",
                        description_en: "",
                        description_id: "",
                        size_per_panel: "",
                        effective_size: "",
                        reng_distance: "",
                        premium_image_url: "",
                        content_image_url: "",
                      });
                    }
                  }}
                />
              </div>
            </CardHeader>
            {premiumEnabled && (
              <CardContent className="space-y-4">
                {/* Material Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="material_name">Material Name</Label>
                    <Input
                      id="material_name"
                      value={premiumData.material_name}
                      onChange={(e) =>
                        setPremiumData({
                          ...premiumData,
                          material_name: e.target.value,
                        })
                      }
                      placeholder="Enter material name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="material_fullname">
                      Material Full Name
                    </Label>
                    <Input
                      id="material_fullname"
                      value={premiumData.material_fullname}
                      onChange={(e) =>
                        setPremiumData({
                          ...premiumData,
                          material_fullname: e.target.value,
                        })
                      }
                      placeholder="Enter material full name"
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="premium_description_en">
                      Description (English)
                    </Label>
                    <RichTextEditor
                      value={premiumData.description_en}
                      onChange={(html) =>
                        setPremiumData({
                          ...premiumData,
                          description_en: html,
                        })
                      }
                      className="min-h-[200px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="premium_description_id">
                      Description (Indonesian)
                    </Label>
                    <RichTextEditor
                      value={premiumData.description_id}
                      onChange={(html) =>
                        setPremiumData({
                          ...premiumData,
                          description_id: html,
                        })
                      }
                      className="min-h-[200px]"
                    />
                  </div>
                </div>

                {/* Specifications */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="size_per_panel">Size Per Panel</Label>
                    <Input
                      id="size_per_panel"
                      value={premiumData.size_per_panel}
                      onChange={(e) =>
                        setPremiumData({
                          ...premiumData,
                          size_per_panel: e.target.value,
                        })
                      }
                      placeholder="e.g., 1000 x 500 mm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="effective_size">Effective Size</Label>
                    <Input
                      id="effective_size"
                      value={premiumData.effective_size}
                      onChange={(e) =>
                        setPremiumData({
                          ...premiumData,
                          effective_size: e.target.value,
                        })
                      }
                      placeholder="e.g., 950 x 450 mm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reng_distance">Reng Distance</Label>
                    <Input
                      id="reng_distance"
                      value={premiumData.reng_distance}
                      onChange={(e) =>
                        setPremiumData({
                          ...premiumData,
                          reng_distance: e.target.value,
                        })
                      }
                      placeholder="e.g., 600 mm"
                    />
                  </div>
                </div>

                {/* Images */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Premium Image</Label>
                    <div
                      className="relative w-full aspect-video border rounded overflow-hidden group cursor-pointer"
                      onClick={() => setShowPremiumImageSelector(true)}
                    >
                      {premiumData.premium_image_url ? (
                        <>
                          <img
                            src={premiumData.premium_image_url}
                            alt="Premium"
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
                              setPremiumData({
                                ...premiumData,
                                premium_image_url: "",
                              });
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

                  {/*<div className="space-y-2">
                    <Label>Content Image</Label>
                    <div
                      className="relative w-full aspect-video border rounded overflow-hidden group cursor-pointer"
                      onClick={() => setShowContentImageSelector(true)}
                    >
                      {premiumData.content_image_url ? (
                        <>
                          <img
                            src={premiumData.content_image_url}
                            alt="Content"
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
                              setPremiumData({
                                ...premiumData,
                                content_image_url: "",
                              });
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
                  </div>*/}
                </div>
              </CardContent>
            )}
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

      <ImageSelectorDialog
        open={showPremiumImageSelector}
        onOpenChange={setShowPremiumImageSelector}
        onSelect={(url) =>
          setPremiumData({ ...premiumData, premium_image_url: url })
        }
        title="Select Premium Image"
        multipleSelection={false}
        initialSelection={premiumData.premium_image_url}
      />

      {/*<ImageSelectorDialog
        open={showContentImageSelector}
        onOpenChange={setShowContentImageSelector}
        onSelect={(url) =>
          setPremiumData({ ...premiumData, content_image_url: url })
        }
        title="Select Content Image"
        multipleSelection={false}
        initialSelection={premiumData.content_image_url}
      />*/}
    </DashboardLayout>
  );
};

export default ProductFormPage;
