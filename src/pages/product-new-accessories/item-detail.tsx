import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Loader2, ImageIcon, X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductItem, ProductCategory } from "@/pages/product/types";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";

interface ItemFormData {
  name: string;
  length: string;
  weight: string;
  image: string;
  product_category_id: string;
  // field array for spec info entries (bilingual label)
  spec_info_entries?: { label: { en: string; id: string }; value: string }[];
}

interface SpecInfoEntry {
  label: { en: string; id: string };
  value: string;
}

const ItemAccessoriesDetailPage = () => {
  const {
    id: productId,
    categoryId,
    itemId,
  } = useParams<{
    id: string;
    categoryId?: string;
    itemId?: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showImageSelector, setShowImageSelector] = useState(false);

  const isEditMode = !!itemId; // itemId ada = edit mode (UUID), tidak ada = create mode
  const isFromCategoryPage = !isEditMode && !!categoryId; // Create mode DAN ada categoryId di URL

  // Fetch product categories for dropdown
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["product-accessories-categories", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_category")
        .select("*")
        .eq("product_id", productId)
        .is("product_profile_id", null)
        .order("order", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as ProductCategory[];
    },
    enabled: !!productId,
  });

  // Fetch item details if editing
  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ["product-item-accessories", itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_item")
        .select("*")
        .eq("id", itemId)
        .single();

      if (error) throw error;
      return data as ProductItem;
    },
    enabled: isEditMode && !!itemId,
    staleTime: 0, // Tidak cache data
  });

  const getDefaultValues = useCallback((): ItemFormData => {
    if (isEditMode && item) {
      // Edit mode: gunakan data dari item
      return {
        name: item.name,
        length: item.length || "",
        weight: item.weight || "",
        image: item.image || "",
        product_category_id: item.product_category_id || "none",
      };
    } else if (isFromCategoryPage && categoryId) {
      // Create mode dari category page: auto-fill categoryId
      return {
        name: "",
        length: "",
        weight: "",
        image: "",
        product_category_id: categoryId, // Langsung dari URL!
      };
    } else {
      // Create mode biasa
      return {
        name: "",
        length: "",
        weight: "",
        image: "",
        product_category_id: "none",
      };
    }
  }, [isEditMode, item, isFromCategoryPage, categoryId]);

  const getDefaultSpecInfo = useCallback((): SpecInfoEntry[] => {
    if (isEditMode && item?.spec_info) {
      try {
        // Jika spec_info adalah string (JSON), parse dulu
        let specData = item.spec_info;
        if (typeof specData === "string") {
          specData = JSON.parse(specData);
        }

        // Format baru: array of { label: { en, id }, value }
        if (Array.isArray(specData)) {
          // eslint-disable-next-line
          return specData.map((entry: any) => {
            // Jika entry sudah dalam format baru
            if (entry && entry.label && typeof entry.label === "object") {
              return {
                label: {
                  en: entry.label.en || "",
                  id: entry.label.id || "",
                },
                value: String(entry.value || ""),
              };
            }

            // Jika entry dalam format lama: { key, value }
            if (entry && entry.key) {
              return {
                label: {
                  en: entry.key || "",
                  id: entry.key || "",
                },
                value: String(entry.value || ""),
              };
            }

            // Fallback untuk entry yang tidak valid
            return { label: { en: "", id: "" }, value: "" };
          });
        }

        // Format legacy: object { key: value } (bukan array)
        if (
          typeof specData === "object" &&
          specData !== null &&
          !Array.isArray(specData)
        ) {
          return Object.entries(specData).map(([key, value]) => ({
            label: { en: key, id: key },
            value: String(value),
          }));
        }
      } catch (error) {
        console.error("Error parsing spec_info:", error);
      }
    }

    return [];
  }, [isEditMode, item]);

  // Initialize form dengan computed default values
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<ItemFormData>({
    defaultValues: {
      ...getDefaultValues(),
      spec_info_entries: getDefaultSpecInfo(),
    },
  });

  const imageUrl = watch("image");
  const selectedCategoryId = watch("product_category_id");

  const { fields, append, remove } = useFieldArray({
    name: "spec_info_entries",
    control,
  });

  const [specLanguage, setSpecLanguage] = useState<"en" | "id">("en");

  // When item (async) loads, reset the form so spec fields are populated on first render
  useEffect(() => {
    const defaults = getDefaultValues();
    const specEntries = getDefaultSpecInfo();
    reset({ ...defaults, spec_info_entries: specEntries });
  }, [
    item,
    categoryId,
    isEditMode,
    reset,
    getDefaultValues,
    getDefaultSpecInfo,
  ]);

  const saveMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      // Process spec_info_entries untuk format baru
      const rawSpecEntries = data.spec_info_entries || [];
      const specInfoArray = rawSpecEntries
        .filter((entry) => {
          // Filter entries yang memiliki label (salah satu bahasa) dan value
          const hasEnglishLabel = entry?.label?.en?.trim();
          const hasIndonesianLabel = entry?.label?.id?.trim();
          const hasValue = entry?.value?.trim();

          return (hasEnglishLabel || hasIndonesianLabel) && hasValue;
        })
        .map((entry) => ({
          label: {
            en: (entry.label?.en || "").trim(),
            id: (entry.label?.id || "").trim(),
          },
          value: (entry.value || "").trim(),
        }));

      const categoryId =
        data.product_category_id && data.product_category_id !== "none"
          ? data.product_category_id
          : null;

      if (isEditMode && itemId) {
        const { error } = await supabase
          .from("product_item")
          .update({
            name: data.name,
            length: data.length || null,
            weight: data.weight || null,
            image: data.image || null,
            product_category_id: categoryId,
            spec_info: specInfoArray.length > 0 ? specInfoArray : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", itemId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("product_item").insert({
          product_id: productId!,
          product_profile_id: null,
          product_category_id: categoryId,
          name: data.name,
          length: data.length || null,
          weight: data.weight || null,
          image: data.image || null,
          spec_info: specInfoArray.length > 0 ? specInfoArray : null,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        isEditMode ? "Item updated successfully" : "Item created successfully"
      );

      queryClient.invalidateQueries({
        queryKey: ["product-accessories-direct-items", productId],
      });
      queryClient.invalidateQueries({
        queryKey: ["category-accessories-items"],
      });
      queryClient.invalidateQueries({
        queryKey: ["product-accessories-categories", productId],
      });

      handleBackClick();
    },
    onError: (error) => {
      toast.error(
        isEditMode ? "Failed to update item" : "Failed to create item"
      );
      console.error(error);
    },
  });

  const handleBackClick = () => {
    if (categoryId) {
      navigate(
        `/dashboard/product-accessories/${productId}/category/${categoryId}`
      );
    } else {
      navigate(`/dashboard/product-accessories/${productId}/items`);
    }
  };

  const onSubmit = (data: ItemFormData) => {
    saveMutation.mutate(data);
  };

  const addSpecInfoEntry = () =>
    append({ label: { en: "", id: "" }, value: "" });
  const removeSpecInfoEntry = (index: number) => remove(index);

  if (itemLoading || categoriesLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading item details...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
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
              {isEditMode ? "Edit Item" : "Create New Item"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditMode
                ? "Update the item information below"
                : "Fill in the details to create a new item"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details for this item
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="space-y-2">
                <Label htmlFor="product_category_id">Product Category</Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={(value) =>
                    setValue("product_category_id", value)
                  }
                  disabled={isFromCategoryPage}
                >
                  <SelectTrigger id="product_category_id">
                    <SelectValue placeholder="Select a category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isFromCategoryPage && (
                  <p className="text-sm text-muted-foreground">
                    Category is auto-selected and cannot be changed when
                    creating from a category page
                  </p>
                )}
              </div>

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

              {/*<div className="grid grid-cols-2 gap-4  hidden">
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
              </div>*/}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Specification Informationxxx</CardTitle>
                  <CardDescription>
                    Add custom key-value pairs for additional specifications
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={specLanguage === "en" ? "default" : "outline"}
                    onClick={() => setSpecLanguage("en")}
                  >
                    EN
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={specLanguage === "id" ? "default" : "outline"}
                    onClick={() => setSpecLanguage("id")}
                  >
                    ID
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSpecInfoEntry}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No specification fields yet. Click "Add Field" to create one.
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-2 gap-6 lg:gap-8"
                    >
                      {specLanguage === "id" ? (
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={`spec-id-${index}`}
                            className="text-xs"
                          >
                            Label (Indonesian)
                          </Label>
                          <Input
                            id={`spec-id-${index}`}
                            placeholder="e.g., Material"
                            {...register(
                              `spec_info_entries.${index}.label.id` as const
                            )}
                          />
                        </div>
                      ) : (
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={`spec-en-${index}`}
                            className="text-xs"
                          >
                            Label (English)
                          </Label>
                          <Input
                            id={`spec-en-${index}`}
                            placeholder="e.g., Material"
                            {...register(
                              `spec_info_entries.${index}.label.en` as const
                            )}
                          />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={`spec-value-${index}`}
                            className="text-xs"
                          >
                            Value
                          </Label>
                          <Input
                            id={`spec-value-${index}`}
                            placeholder="e.g., Aluminum"
                            {...register(
                              `spec_info_entries.${index}.value` as const
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSpecInfoEntry(index)}
                          className="text-destructive hover:text-destructive mt-6"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleBackClick}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Saving..."
                : isEditMode
                ? "Update Item"
                : "Create Item"}
            </Button>
          </div>
        </form>
      </div>

      <ImageSelectorDialog
        open={showImageSelector}
        onOpenChange={setShowImageSelector}
        onSelect={(url) => setValue("image", url)}
        title="Select Item Image"
        multipleSelection={false}
        initialSelection={imageUrl}
      />
    </DashboardLayout>
  );
};

export default ItemAccessoriesDetailPage;
