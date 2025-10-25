import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { Product } from "../../types";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";

interface BrandImageSelectorProps {
  product: Product;
  onProductChange: (updates: Partial<Product>) => void;
}

export default function BrandImageSelector({
  product,
  onProductChange,
}: BrandImageSelectorProps) {
  const [brandImageDialogOpen, setBrandImageDialogOpen] = useState(false);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);

  const handleBrandImageSelect = (imageUrl: string) => {
    onProductChange({ brand_image: imageUrl });
    setBrandImageDialogOpen(false);
  };

  const handleBrandImageRemove = () => {
    onProductChange({ brand_image: null });
  };

  const handleBannerSelect = (imageUrl: string) => {
    onProductChange({ banner_url: imageUrl });
    setBannerDialogOpen(false);
  };

  const handleBannerRemove = () => {
    onProductChange({ banner_url: null });
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Product Images
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Brand Image */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Brand Image</Label>
          {product?.brand_image ? (
            <>
              <div className="w-full aspect-video overflow-hidden rounded-lg border bg-muted/20 flex items-center justify-center group relative">
                <img
                  src={product.brand_image}
                  alt={`${product.name} brand`}
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={handleBrandImageRemove}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBrandImageDialogOpen(true)}
                className="w-full flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Change Brand Image
              </Button>
            </>
          ) : (
            <>
              <div className="w-full aspect-video border-2 border-dashed rounded-lg bg-muted/20 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Upload className="h-8 w-8" />
                <p className="text-sm">No brand image</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBrandImageDialogOpen(true)}
                className="w-full flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Select Brand Image
              </Button>
            </>
          )}
        </div>

        <Separator />

        {/* Banner Image */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Banner Image</Label>
          {product?.banner_url ? (
            <>
              <div className="w-full aspect-video overflow-hidden rounded-lg border bg-muted/20 flex items-center justify-center group relative">
                <img
                  src={product.banner_url}
                  alt={`${product.name} banner`}
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={handleBannerRemove}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBannerDialogOpen(true)}
                className="w-full flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Change Banner Image
              </Button>
            </>
          ) : (
            <>
              <div className="w-full aspect-video border-2 border-dashed rounded-lg bg-muted/20 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Upload className="h-8 w-8" />
                <p className="text-sm">No banner image</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBannerDialogOpen(true)}
                className="w-full flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Select Banner Image
              </Button>
            </>
          )}
        </div>
      </CardContent>

      {/* Image Selector Dialogs */}
      <ImageSelectorDialog
        open={brandImageDialogOpen}
        onOpenChange={setBrandImageDialogOpen}
        onSelect={handleBrandImageSelect}
        title="Select Brand Image"
        multiple={false}
        multipleSelection={false}
        initialSelection={product?.brand_image || ""}
      />
      <ImageSelectorDialog
        open={bannerDialogOpen}
        onOpenChange={setBannerDialogOpen}
        onSelect={handleBannerSelect}
        title="Select Banner Image"
        multiple={false}
        multipleSelection={false}
        initialSelection={product?.banner_url || ""}
      />
    </Card>
  );
}
