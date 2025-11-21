import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  FileText,
  X,
  ImageUp,
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Add product_main_image to the form data
interface AddonFormData {
  name: string;
  slug: string;
  description_en: string;
  description_id: string;
  order: number;
  brand_image: string;
  product_main_image: string;
  banner_url: string;
  catalogue: string;
  // Highlight section fields
  is_highlight_section: boolean;
  highlight_section_image_url: string;
  highlight_section_description_en: string;
  highlight_section_description_id: string;
  // Highlight top fields
  highlight_top_label_en: string;
  highlight_top_label_id: string;
  highlight_top_description_en: string;
  highlight_top_description_id: string;
  // Highlight bottom fields
  highlight_bottom_label_en: string;
  highlight_bottom_label_id: string;
  highlight_bottom_description_en: string;
  highlight_bottom_description_id: string;
  // Highlight icon
  highlight_icon: string;
}

// NOTE: The original file already defined AddonFormData earlier. The new declaration above
// ensures TypeScript knows about product_main_image. If there is an earlier declaration
// (the code previously had AddonFormData without product_main_image), this replaced it.

interface SuitableRow {
  en: string;
  id: string;
}

const AddonFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [showBrandImageSelector, setShowBrandImageSelector] = useState(false);
  const [showBannerSelector, setShowBannerSelector] = useState(false);
  const [showMainImageSelector, setShowMainImageSelector] = useState(false);
  const [showCatalogueSelector, setShowCatalogueSelector] = useState(false);
  const [
    showHighlightSectionImageSelector,
    setShowHighlightSectionImageSelector,
  ] = useState(false);
  const [showHighlightIconSelector, setShowHighlightIconSelector] =
    useState(false);
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
  } = useForm<AddonFormData>({
    defaultValues: {
      name: "",
      description_en: "",
      description_id: "",
      order: 0,
      brand_image: "",
      product_main_image: "",
      banner_url: "",
      catalogue: "",
      is_highlight_section: false,
      highlight_section_image_url: "",
      highlight_section_description_en: "",
      highlight_section_description_id: "",
      highlight_top_label_en: "",
      highlight_top_label_id: "",
      highlight_top_description_en: "",
      highlight_top_description_id: "",
      highlight_bottom_label_en: "",
      highlight_bottom_label_id: "",
      highlight_bottom_description_en: "",
      highlight_bottom_description_id: "",
      highlight_icon: "",
    },
  });

  const brandImage = watch("brand_image");
  const productMainImage = watch("product_main_image");
  const bannerUrl = watch("banner_url");
  const catalogue = watch("catalogue");
  const isHighlightSection = watch("is_highlight_section");
  const highlightSectionImageUrl = watch("highlight_section_image_url");
  const highlightIcon = watch("highlight_icon");

  // Fetch addon data if editing
  const { data: addon, isLoading } = useQuery({
    queryKey: ["addon", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("product")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: isEdit,
  });

  // Reset form when addon data is loaded
  useEffect(() => {
    if (addon) {
      reset({
        name: addon.name,
        description_en: addon.description_en || "",
        description_id: addon.description_id || "",
        order: addon.order,
        brand_image: addon.brand_image || "",
        product_main_image: addon.product_main_image || "",
        banner_url: addon.banner_url || "",
        catalogue: addon.catalogue || "",
        is_highlight_section: addon.is_highlight_section || false,
        highlight_section_image_url: addon.highlight_section_image_url || "",
        highlight_section_description_en:
          addon.highlight_section_description_en || "",
        highlight_section_description_id:
          addon.highlight_section_description_id || "",
        highlight_top_label_en: addon.highlight_top_label_en || "",
        highlight_top_label_id: addon.highlight_top_label_id || "",
        highlight_top_description_en: addon.highlight_top_description_en || "",
        highlight_top_description_id: addon.highlight_top_description_id || "",
        highlight_bottom_label_en: addon.highlight_bottom_label_en || "",
        highlight_bottom_label_id: addon.highlight_bottom_label_id || "",
        highlight_bottom_description_en:
          addon.highlight_bottom_description_en || "",
        highlight_bottom_description_id:
          addon.highlight_bottom_description_id || "",
        highlight_icon: addon.highlight_icon || "",
      });

      // Parse suitables from JSON
      const suitablesEn = addon.suitables
        ? ((Array.isArray(addon.suitables) ? addon.suitables : []) as string[])
        : [];
      const suitablesId = addon.suitables_id
        ? ((Array.isArray(addon.suitables_id)
            ? addon.suitables_id
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
  }, [addon, reset]);

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
    mutationFn: async (data: AddonFormData) => {
      // Prepare suitables data
      const suitablesEn = suitables
        .map((s) => s.en)
        .filter((s) => s.trim() !== "");
      const suitablesId = suitables
        .map((s) => s.id)
        .filter((s) => s.trim() !== "");

      const addonData = {
        name: data.name,
        description_en: data.description_en,
        description_id: data.description_id,
        order: data.order,
        brand_image: data.brand_image || null,
        product_main_image: data.product_main_image || null,
        banner_url: data.banner_url || null,
        catalogue: data.catalogue || null,
        suitables: suitablesEn.length > 0 ? suitablesEn : null,
        suitables_id: suitablesId.length > 0 ? suitablesId : null,
        is_highlight_section: data.is_highlight_section,
        highlight_section_image_url: data.highlight_section_image_url || null,
        highlight_section_description_en:
          data.highlight_section_description_en || null,
        highlight_section_description_id:
          data.highlight_section_description_id || null,
        highlight_top_label_en: data.highlight_top_label_en || null,
        highlight_top_label_id: data.highlight_top_label_id || null,
        highlight_top_description_en: data.highlight_top_description_en || null,
        highlight_top_description_id: data.highlight_top_description_id || null,
        highlight_bottom_label_en: data.highlight_bottom_label_en || null,
        highlight_bottom_label_id: data.highlight_bottom_label_id || null,
        highlight_bottom_description_en:
          data.highlight_bottom_description_en || null,
        highlight_bottom_description_id:
          data.highlight_bottom_description_id || null,
        highlight_icon: data.highlight_icon || null,
      };

      if (isEdit) {
        // Update existing addon
        const { error } = await supabase
          .from("product")
          .update({
            ...addonData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (error) throw error;
      } else {
        // Create new addon
        const { error } = await supabase.from("product").insert({
          ...addonData,
          is_under_product: true,
          type: "add-on",
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        isEdit ? "Add-on updated successfully" : "Add-on created successfully"
      );
      navigate(`/dashboard/product-add-ons/${isEdit ? id : ""}`);
    },
    onError: (error) => {
      toast.error(
        isEdit ? "Failed to update add-on" : "Failed to create add-on"
      );
      console.error(error);
    },
  });

  const onSubmit = (data: AddonFormData) => {
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading add-on...</p>
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
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/product-add-ons")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEdit ? "Edit Product Add-on" : "Create New Product Add-on"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEdit
                ? "Update the add-on information below"
                : "Fill in the details to create a new add-on"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Core add-on details and identification
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
                  placeholder="Enter add-on name"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                {isEdit ? (
                  <Badge className="ml-4" variant="outline">
                    /{addon.slug}
                  </Badge>
                ) : (
                  <Input
                    id="slug"
                    {...register("slug")}
                    placeholder="add-on-slug"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Media & Assets */}
          <Card>
            <CardHeader>
              <CardTitle>Media & Assets</CardTitle>
              <CardDescription>
                Add-on images and catalogue files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Brand Image */}
                <div className="space-y-2">
                  <Label>Brand Image</Label>
                  <div
                    className="relative w-full aspect-square border rounded overflow-hidden group cursor-pointer"
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
                <div className="space-y-2">
                  <Label>Product Main Image</Label>
                  <div
                    className="relative w-full aspect-[16/9] border rounded overflow-hidden group cursor-pointer"
                    onClick={() => setShowMainImageSelector(true)}
                  >
                    {productMainImage ? (
                      <>
                        <img
                          src={productMainImage}
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
                <div className="space-y-2">
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
                Add-on descriptions in both languages (side by side)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* English Description */}
                <div className="space-y-2">
                  <Label htmlFor="description_en">Description (English)</Label>
                  <Textarea
                    id="description_en"
                    {...register("description_en")}
                    placeholder="Enter English description"
                    rows={8}
                  />
                </div>

                {/* Indonesian Description */}
                <div className="space-y-2">
                  <Label htmlFor="description_id">Deskripsi (Indonesian)</Label>
                  <Textarea
                    id="description_id"
                    {...register("description_id")}
                    placeholder="Masukkan deskripsi bahasa Indonesia"
                    rows={8}
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
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {suitables.map((suitable, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-start gap-2">
                      {/* English Input */}
                      <div className="flex-1 space-y-1">
                        {index === 0 && (
                          <Label className="text-xs text-muted-foreground">
                            English
                          </Label>
                        )}
                        <Input
                          value={suitable.en}
                          onChange={(e) =>
                            updateSuitableRow(index, "en", e.target.value)
                          }
                          placeholder="e.g., Residential buildings"
                        />
                      </div>

                      {/* Indonesian Input */}
                      <div className="flex-1 space-y-1">
                        {index === 0 && (
                          <Label className="text-xs text-muted-foreground">
                            Indonesian
                          </Label>
                        )}
                        <Input
                          value={suitable.id}
                          onChange={(e) =>
                            updateSuitableRow(index, "id", e.target.value)
                          }
                          placeholder="e.g., Bangunan residensial"
                        />
                      </div>

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSuitableRow(index)}
                        disabled={suitables.length === 1}
                        className={`${index === 0 ? "mt-5" : ""} flex-shrink-0`}
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {index < suitables.length - 1 && (
                      <Separator className="mt-2" />
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

          {/* Highlight Section */}
          <Card>
            <CardHeader>
              <CardTitle>Highlight Section</CardTitle>
              <CardDescription>
                Enable and configure the highlight section for this add-on
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable Highlight Section */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_highlight_section">
                    Enable Highlight Section
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show a special highlight section for this add-on
                  </p>
                </div>
                <Switch
                  id="is_highlight_section"
                  checked={isHighlightSection}
                  onCheckedChange={(checked) =>
                    setValue("is_highlight_section", checked)
                  }
                />
              </div>

              {isHighlightSection && (
                <>
                  <Separator />

                  {/* Highlight Section Image */}
                  <div className="space-y-2">
                    <Label>Highlight Section Image</Label>
                    <div
                      className="relative w-full aspect-[2/1] border rounded overflow-hidden group cursor-pointer"
                      onClick={() => setShowHighlightSectionImageSelector(true)}
                    >
                      {highlightSectionImageUrl ? (
                        <>
                          <img
                            src={highlightSectionImageUrl}
                            alt="Highlight Section"
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
                              setValue("highlight_section_image_url", "");
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

                  {/* Highlight Section Descriptions - Side by Side */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="highlight_section_description_en">
                        Highlight Section Description (English)
                      </Label>
                      <Textarea
                        id="highlight_section_description_en"
                        {...register("highlight_section_description_en")}
                        placeholder="Enter highlight section description"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="highlight_section_description_id">
                        Deskripsi Highlight Section (Indonesian)
                      </Label>
                      <Textarea
                        id="highlight_section_description_id"
                        {...register("highlight_section_description_id")}
                        placeholder="Masukkan deskripsi highlight section"
                        rows={4}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Highlight Top - Side by Side */}
          <Card>
            <CardHeader>
              <CardTitle>Highlight Top</CardTitle>
              <CardDescription>
                Configure top highlight information in both languages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Labels Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="highlight_top_label_en">
                    Label (English)
                  </Label>
                  <Input
                    id="highlight_top_label_en"
                    {...register("highlight_top_label_en")}
                    placeholder="e.g., Key Feature"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="highlight_top_label_id">
                    Label (Indonesian)
                  </Label>
                  <Input
                    id="highlight_top_label_id"
                    {...register("highlight_top_label_id")}
                    placeholder="e.g., Fitur Utama"
                  />
                </div>
              </div>

              {/* Descriptions Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="highlight_top_description_en">
                    Description (English)
                  </Label>
                  <Textarea
                    id="highlight_top_description_en"
                    {...register("highlight_top_description_en")}
                    placeholder="Enter description"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="highlight_top_description_id">
                    Deskripsi (Indonesian)
                  </Label>
                  <Textarea
                    id="highlight_top_description_id"
                    {...register("highlight_top_description_id")}
                    placeholder="Masukkan deskripsi"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Highlight Bottom - Side by Side */}
          <Card>
            <CardHeader>
              <CardTitle>Highlight Bottom</CardTitle>
              <CardDescription>
                Configure bottom highlight information in both languages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Labels Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="highlight_bottom_label_en">
                    Label (English)
                  </Label>
                  <Input
                    id="highlight_bottom_label_en"
                    {...register("highlight_bottom_label_en")}
                    placeholder="e.g., Additional Benefit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="highlight_bottom_label_id">
                    Label (Indonesian)
                  </Label>
                  <Input
                    id="highlight_bottom_label_id"
                    {...register("highlight_bottom_label_id")}
                    placeholder="e.g., Manfaat Tambahan"
                  />
                </div>
              </div>

              {/* Descriptions Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="highlight_bottom_description_en">
                    Description (English)
                  </Label>
                  <Textarea
                    id="highlight_bottom_description_en"
                    {...register("highlight_bottom_description_en")}
                    placeholder="Enter description"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="highlight_bottom_description_id">
                    Deskripsi (Indonesian)
                  </Label>
                  <Textarea
                    id="highlight_bottom_description_id"
                    {...register("highlight_bottom_description_id")}
                    placeholder="Masukkan deskripsi"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Highlight Icon */}
          <Card>
            <CardHeader>
              <CardTitle>Highlight Icon</CardTitle>
              <CardDescription>Icon for highlight features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label>Icon Image</Label>
              <div
                className="relative size-full border rounded overflow-hidden group cursor-pointer"
                onClick={() => setShowHighlightIconSelector(true)}
              >
                {highlightIcon ? (
                  <>
                    <img
                      src={highlightIcon}
                      alt="Highlight Icon"
                      className="size-full object-contain aspect-[3/1]"
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
                        setValue("highlight_icon", "");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <div className="size-full flex items-center justify-center bg-muted aspect-[3/1]">
                    <ImageUp className="size-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2 sticky bottom-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border rounded-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/product-add-ons")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Saving..."
                : isEdit
                ? "Update Add-on"
                : "Create Add-on"}
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
        open={showBannerSelector}
        onOpenChange={setShowBannerSelector}
        onSelect={(url) => setValue("banner_url", url)}
        title="Select Banner Image"
        multipleSelection={false}
        initialSelection={bannerUrl}
      />

      <ImageSelectorDialog
        open={showMainImageSelector}
        onOpenChange={setShowMainImageSelector}
        onSelect={(url) => setValue("product_main_image", url)}
        title="Select Product Main Image"
        multipleSelection={false}
        initialSelection={productMainImage}
      />

      <ImageSelectorDialog
        open={showHighlightSectionImageSelector}
        onOpenChange={setShowHighlightSectionImageSelector}
        onSelect={(url) => setValue("highlight_section_image_url", url)}
        title="Select Highlight Section Image"
        multipleSelection={false}
        initialSelection={highlightSectionImageUrl}
      />

      <ImageSelectorDialog
        open={showHighlightIconSelector}
        onOpenChange={setShowHighlightIconSelector}
        onSelect={(url) => setValue("highlight_icon", url)}
        title="Select Highlight Icon"
        multipleSelection={false}
        initialSelection={highlightIcon}
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

export default AddonFormPage;
