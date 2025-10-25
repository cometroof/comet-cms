import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Package } from "lucide-react";
import { Product } from "../../types";

interface ProductInfoFormProps {
  product: Product;
  onProductChange: (updates: Partial<Product>) => void;
}

export default function ProductInfoForm({
  product,
  onProductChange,
}: ProductInfoFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    title: product?.title || "",
    cover_color_hex: product?.cover_color_hex || "#f00",
    slug: product?.slug || "",
    is_under_product: product?.is_under_product || false,
    description_en: product?.description_en || "",
    description_id: product?.description_id || "",
  });

  const handleFieldChange = (field: string, value: string | boolean) => {
    const updates = { ...formData, [field]: value };
    setFormData(updates);
    onProductChange(updates);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Information
        </CardTitle>
        <CardDescription>
          Basic details and information about this product
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name & Title */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-name" className="text-sm font-medium">
              Product Name
            </Label>
            <Input
              id="product-name"
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder="Enter product name"
              className="text-lg font-semibold"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="product-title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="product-title"
              value={formData.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="Enter product title"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="cover-color-hex" className="text-sm font-medium">
              Hero Section Background Color
            </Label>
            <div className="flex gap-2">
              <div className="relative">
                <Input
                  id="cover-color-hex"
                  type="color"
                  value={formData.cover_color_hex || "#ffffff"}
                  onChange={(e) =>
                    handleFieldChange("cover_color_hex", e.target.value)
                  }
                  className="size-0 opacity-0 absolute cursor-pointer"
                />
                <label
                  htmlFor="cover-color-hex"
                  className="w-14 h-10 rounded-md block"
                  style={{ backgroundColor: formData.cover_color_hex }}
                />
              </div>
              <Input
                id="cover-color-hex-display"
                type="text"
                value={formData.cover_color_hex}
                onChange={(e) =>
                  handleFieldChange("cover_color_hex", e.target.value)
                }
                placeholder="#000000"
                className="font-mono"
                readOnly
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Choose the background color for the hero section on the product
              page
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="product-slug" className="text-sm font-medium">
                Slug
              </Label>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="is_under_product"
                  className="text-xs text-muted-foreground"
                >
                  Under <Badge className="font-mono">/product</Badge>
                </Label>
                <Switch
                  id="is_under_product"
                  checked={formData.is_under_product}
                  onCheckedChange={(checked) =>
                    handleFieldChange("is_under_product", checked)
                  }
                />
              </div>
            </div>
            <Input
              id="product-slug"
              value={formData.slug}
              onChange={(e) => handleFieldChange("slug", e.target.value)}
              placeholder="product-slug"
              className="font-mono"
            />
            <code className="block px-3 py-2 bg-muted rounded-md text-sm font-mono text-muted-foreground">
              {formData.is_under_product ? "/product/" : "/"}
              {formData.slug || "product-slug"}
            </code>
          </div>
        </div>

        {/* Description */}
        <Separator />
        <div className="space-y-3">
          <Label className="text-sm font-medium">Description</Label>
          <Tabs defaultValue="en" className="w-full">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="id">Indonesian</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="mt-4 space-y-2">
              <Label htmlFor="description-en" className="text-xs">
                English Description
              </Label>
              <Textarea
                id="description-en"
                value={formData.description_en}
                onChange={(e) =>
                  handleFieldChange("description_en", e.target.value)
                }
                placeholder="Enter English description"
                rows={6}
                className="resize-none"
              />
            </TabsContent>
            <TabsContent value="id" className="mt-4 space-y-2">
              <Label htmlFor="description-id" className="text-xs">
                Indonesian Description
              </Label>
              <Textarea
                id="description-id"
                value={formData.description_id}
                onChange={(e) =>
                  handleFieldChange("description_id", e.target.value)
                }
                placeholder="Enter Indonesian description"
                rows={6}
                className="resize-none"
              />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
