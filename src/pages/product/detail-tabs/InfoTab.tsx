import { useState } from "react";
import { Button } from "@/components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, ChevronRight } from "lucide-react";
import { Product, ProductProfile, ProductWithRelations } from "../types";
import {
  ProductInfoForm,
  HighlightSectionForm,
  BrandImageSelector,
  AdditionalInfoForm,
  CategorySection,
  ItemSection,
} from "./components";
import { useProductQuery } from "@/contexts/ProductQueryContext";
import { toast } from "sonner";
import * as productService from "@/services/product.service";

export default function InfoTab({
  product,
  onTabChange,
}: {
  product: ProductWithRelations;
  handleEditProduct: () => void;
  onTabChange?: (tab: string) => void;
}) {
  const [formUpdates, setFormUpdates] = useState<Partial<Product>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { refetchProduct } = useProductQuery();

  // Handler untuk mengumpulkan perubahan dari semua form
  const handleProductChange = (updates: Partial<Product>) => {
    setFormUpdates((prev) => ({ ...prev, ...updates }));
  };

  // Handler untuk menyimpan semua perubahan
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Prepare the data for updating
      const updateData: Partial<Product> = {};

      // Map all the form updates to the correct database fields
      if (formUpdates.name !== undefined) updateData.name = formUpdates.name;
      if (formUpdates.title !== undefined) updateData.title = formUpdates.title;
      if (formUpdates.description_en !== undefined)
        updateData.description_en = formUpdates.description_en;
      if (formUpdates.description_id !== undefined)
        updateData.description_id = formUpdates.description_id;
      if (formUpdates.brand_image !== undefined)
        updateData.brand_image = formUpdates.brand_image;
      if (formUpdates.catalogue !== undefined)
        updateData.catalogue = formUpdates.catalogue;
      if (formUpdates.banner_url !== undefined)
        updateData.banner_url = formUpdates.banner_url;
      if (formUpdates.slug !== undefined) updateData.slug = formUpdates.slug;

      // Handle suitables field - ensure it's properly formatted as JSON
      if (formUpdates.suitables !== undefined) {
        updateData.suitables = formUpdates.suitables;
      }

      // Handle highlight section fields
      if (formUpdates.is_highlight_section !== undefined)
        updateData.is_highlight_section = formUpdates.is_highlight_section;
      if (formUpdates.highlight_section_description_en !== undefined)
        updateData.highlight_section_description_en =
          formUpdates.highlight_section_description_en;
      if (formUpdates.highlight_section_description_id !== undefined)
        updateData.highlight_section_description_id =
          formUpdates.highlight_section_description_id;
      if (formUpdates.highlight_icon !== undefined)
        updateData.highlight_icon = formUpdates.highlight_icon;
      if (formUpdates.highlight_section_image_url !== undefined)
        updateData.highlight_section_image_url =
          formUpdates.highlight_section_image_url;

      // Handle highlight top fields
      if (formUpdates.highlight_top_label_en !== undefined)
        updateData.highlight_top_label_en = formUpdates.highlight_top_label_en;
      if (formUpdates.highlight_top_label_id !== undefined)
        updateData.highlight_top_label_id = formUpdates.highlight_top_label_id;
      if (formUpdates.highlight_top_description_en !== undefined)
        updateData.highlight_top_description_en =
          formUpdates.highlight_top_description_en;
      if (formUpdates.highlight_top_description_id !== undefined)
        updateData.highlight_top_description_id =
          formUpdates.highlight_top_description_id;

      // Handle highlight bottom fields
      if (formUpdates.highlight_bottom_label_en !== undefined)
        updateData.highlight_bottom_label_en =
          formUpdates.highlight_bottom_label_en;
      if (formUpdates.highlight_bottom_label_id !== undefined)
        updateData.highlight_bottom_label_id =
          formUpdates.highlight_bottom_label_id;
      if (formUpdates.highlight_bottom_description_en !== undefined)
        updateData.highlight_bottom_description_en =
          formUpdates.highlight_bottom_description_en;
      if (formUpdates.highlight_bottom_description_id !== undefined)
        updateData.highlight_bottom_description_id =
          formUpdates.highlight_bottom_description_id;

      // Handle other boolean flags
      if (formUpdates.is_highlight !== undefined)
        updateData.is_highlight = formUpdates.is_highlight;
      if (formUpdates.is_profile_highlight !== undefined)
        updateData.is_profile_highlight = formUpdates.is_profile_highlight;
      if (formUpdates.is_under_product !== undefined)
        updateData.is_under_product = formUpdates.is_under_product;

      // Update the product in the database
      const result = await productService.updateProduct(product.id, updateData);

      if (!result) {
        throw new Error("Failed to update product");
      }

      // Reset form updates after successful save
      setFormUpdates({});

      // Refetch product data to get the latest state
      await refetchProduct();

      // Show success message
      toast.success("Product updated successfully!");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = Object.keys(formUpdates).length > 0;

  // Check if product has profiles
  const hasProfiles =
    product?.profiles &&
    Array.isArray(product.profiles) &&
    product.profiles.length > 0 &&
    typeof product.profiles[0] === "object" &&
    !("count" in product.profiles[0]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Main Product Information */}
        <div className="md:grid-cols-1 lg:col-span-2 space-y-6">
          <ProductInfoForm
            product={product}
            onProductChange={handleProductChange}
          />

          {/* Additional Info Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Additional Information
              </CardTitle>
              <CardDescription>
                Suitable items and product catalogue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdditionalInfoForm
                product={product}
                onProductChange={handleProductChange}
              />
            </CardContent>
          </Card>

          {/* Categories Section - Only show if product has no profiles */}
          {!hasProfiles && <CategorySection productId={product.id} />}

          {/* Items Section - Only show if product has no profiles */}
          {!hasProfiles && <ItemSection productId={product.id} />}
        </div>

        {/* Images and Highlight Sidebar */}
        <div className="space-y-6">
          {/* Brand Image */}
          <BrandImageSelector
            product={{ ...product, ...formUpdates }}
            onProductChange={handleProductChange}
          />

          {/* Highlight Section */}
          <HighlightSectionForm
            product={{ ...product, ...formUpdates }}
            onProductChange={handleProductChange}
          />

          {/* Product Profiles Preview */}
          {product?.profiles &&
            Array.isArray(product.profiles) &&
            product.profiles.length > 0 &&
            typeof product.profiles[0] === "object" &&
            !("count" in product.profiles[0]) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Profile
                  </CardTitle>
                  <CardDescription>Product profile variations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.profiles.slice(0, 2).map((profile) => (
                    <div
                      key={profile.id}
                      className="space-y-2 pb-4 border-b last:border-b-0 last:pb-0"
                    >
                      <div className="font-medium text-sm">{profile.name}</div>
                      {profile.subtitle && (
                        <p className="text-xs text-muted-foreground">
                          {profile.subtitle}
                        </p>
                      )}
                      {profile.image && (
                        <div className="aspect-video rounded-lg overflow-hidden border bg-muted/20">
                          <img
                            src={profile.image}
                            alt={profile.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  {product.profiles.length > 2 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => onTabChange?.("profiles")}
                    >
                      See More
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      {/* Save Button Section */}
      <div className="sticky bottom-0 bg-background border-t pt-4 pb-2">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {hasChanges ? (
              <span className="text-amber-600 font-medium">
                You have unsaved changes
              </span>
            ) : (
              <span>No changes to save</span>
            )}
          </div>
          <div className="flex gap-3">
            {hasChanges && (
              <Button
                variant="outline"
                onClick={() => setFormUpdates({})}
                disabled={isSaving}
              >
                Discard Changes
              </Button>
            )}
            <Button
              onClick={handleSaveChanges}
              disabled={!hasChanges || isSaving}
              className="min-w-[120px]"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
