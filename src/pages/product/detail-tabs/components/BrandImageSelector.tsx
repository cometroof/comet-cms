import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { Product } from "../../types";

interface BrandImageSelectorProps {
  product: Product;
  onImageSelect: () => void;
  onImageRemove: () => void;
}

export default function BrandImageSelector({
  product,
  onImageSelect,
  onImageRemove,
}: BrandImageSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Brand Image
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {product?.brand_image ? (
          <>
            <div className="w-full aspect-video overflow-hidden rounded-lg border bg-muted/20 flex items-center justify-center group relative">
              <img
                src={product.brand_image}
                alt={`${product.name} brand`}
                className="w-full h-full object-contain"
              />
              <button
                onClick={onImageRemove}
                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onImageSelect}
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
              onClick={onImageSelect}
              className="w-full flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Select Brand Image
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
