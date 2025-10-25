import { useState } from "react";
import { Button } from "@/components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Package, ChevronRight } from "lucide-react";
import { ProductWithRelations, Product, ProductProfile } from "../types";
import {
  ProductInfoForm,
  HighlightSectionForm,
  BrandImageSelector,
  AdditionalInfoForm,
} from "./components";

export default function InfoTab({
  product,
  handleEditProduct,
  onTabChange,
}: {
  product: Product;
  handleEditProduct: () => void;
  onTabChange?: (tab: string) => void;
}) {
  const [formUpdates, setFormUpdates] = useState<Partial<Product>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Handler untuk mengumpulkan perubahan dari semua form
  const handleProductChange = (updates: Partial<Product>) => {
    setFormUpdates((prev) => ({ ...prev, ...updates }));
  };

  // Handler untuk menyimpan semua perubahan
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement actual save logic here
      // Example: await updateProduct(product.id, formUpdates);
      console.log("Saving changes:", formUpdates);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reset form updates after successful save
      setFormUpdates({});

      // Optionally show success message
      alert("Product updated successfully!");
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product changes");
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers untuk dialog selectors
  const handleBrandImageSelect = () => {
    // TODO: Open image selector dialog
    console.log("Open brand image selector");
  };

  const handleBrandImageRemove = () => {
    handleProductChange({ brand_image: "" });
  };

  const handleHighlightIconSelect = () => {
    // TODO: Open icon selector dialog
    console.log("Open highlight icon selector");
  };

  const handleCatalogueSelect = () => {
    // TODO: Open file selector dialog
    console.log("Open catalogue file selector");
  };

  const hasChanges = Object.keys(formUpdates).length > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Product Information */}
        <div className="lg:col-span-2 space-y-6">
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
                onCatalogueSelect={handleCatalogueSelect}
              />
            </CardContent>
          </Card>
        </div>

        {/* Images and Highlight Sidebar */}
        <div className="space-y-6">
          {/* Brand Image */}
          <BrandImageSelector
            product={{ ...product, ...formUpdates }}
            onImageSelect={handleBrandImageSelect}
            onImageRemove={handleBrandImageRemove}
          />

          {/* Highlight Section */}
          <HighlightSectionForm
            product={{ ...product, ...formUpdates }}
            onProductChange={handleProductChange}
            onIconSelect={handleHighlightIconSelect}
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
                  {(product.profiles as ProductProfile[])
                    .slice(0, 2)
                    .map((profile) => (
                      <div
                        key={profile.id}
                        className="space-y-2 pb-4 border-b last:border-b-0 last:pb-0"
                      >
                        <div className="font-medium text-sm">
                          {profile.name}
                        </div>
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
