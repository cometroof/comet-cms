import { Button } from "@/components";
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
import {
  CheckCircle,
  FileText,
  Package,
  Image as ImageIcon,
  ChevronRight,
} from "lucide-react";
import { ProductWithRelations, Product, ProductProfile } from "../types";

export default function InfoTab({
  product,
  handleEditProduct,
  onTabChange,
}: {
  product: Product;
  handleEditProduct: () => void;
  onTabChange?: (tab: string) => void;
}) {
  // Parse suitables
  const getSuitableItems = () => {
    if (!product?.suitables) return [];

    let suitableItems = [];
    try {
      if (typeof product.suitables === "string") {
        suitableItems = JSON.parse(product.suitables);
      } else if (Array.isArray(product.suitables)) {
        suitableItems = product.suitables;
      } else {
        suitableItems = [String(product.suitables)];
      }
    } catch {
      suitableItems = [String((product as ProductWithRelations).suitables)];
    }

    if (!Array.isArray(suitableItems)) {
      suitableItems = [String(suitableItems)];
    }

    return suitableItems;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Product Information */}
      <div className="lg:col-span-2 space-y-6">
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
                <label className="text-sm font-medium text-muted-foreground">
                  Product Name
                </label>
                <p className="text-lg font-semibold">{product?.name || "-"}</p>
              </div>

              {product?.title && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Title
                    </label>
                    <p className="text-base">{product.title}</p>
                  </div>
                </>
              )}

              {product?.slug && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Slug
                    </label>
                    <code className="block px-3 py-2 bg-muted rounded-md text-sm font-mono">
                      {product.slug}
                    </code>
                  </div>
                </>
              )}
            </div>

            {/* Description */}
            {(product?.description_en || product?.description_id) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">
                    Description
                  </label>
                  <Tabs defaultValue="en" className="w-full">
                    <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                      <TabsTrigger value="en">English</TabsTrigger>
                      <TabsTrigger value="id">Indonesian</TabsTrigger>
                    </TabsList>
                    <TabsContent value="en" className="mt-4">
                      <div className="prose prose-sm max-w-none">
                        {product.description_en || (
                          <span className="text-muted-foreground italic">
                            No English description available
                          </span>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="id" className="mt-4">
                      <div className="prose prose-sm max-w-none">
                        {product.description_id || (
                          <span className="text-muted-foreground italic">
                            No Indonesian description available
                          </span>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}

            {/* Suitables */}
            {getSuitableItems().length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">
                    Suitable For
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {getSuitableItems().map((suitable, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1.5 px-3 py-1.5"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        <span>{suitable}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Catalogue */}
            {product?.catalogue && (
              <>
                <Separator />
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">
                    Catalogue
                  </label>
                  <Button variant="outline" size="sm" asChild className="w-fit">
                    <a
                      href={product.catalogue}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Catalogue
                    </a>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit Button */}
        <Button onClick={handleEditProduct} className="w-full sm:w-auto">
          Edit Product Details
        </Button>
      </div>

      {/* Images Sidebar */}
      <div className="space-y-6">
        {/* Brand Image */}
        {product?.brand_image && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Brand Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-hidden flex items-center justify-center">
                <img
                  src={product.brand_image}
                  alt={`${product.name} brand`}
                  className="size-full object-contain"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Profiles */}
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
  );
}
