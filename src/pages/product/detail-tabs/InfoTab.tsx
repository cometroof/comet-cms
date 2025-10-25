import { Button } from "@/components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, FileText } from "lucide-react";

export default function InfoTab({
  product,
  handleEditProduct,
}: {
  product: any;
  handleEditProduct: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <h2 className="text-lg font-medium mb-4">Product Information</h2>
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              Name
            </div>
            <div className="text-base">{product && product.name}</div>
          </div>
          {product && product.title && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Title
              </div>
              <div className="text-base">{product.title}</div>
            </div>
          )}
          {product && product.slug && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Slug
              </div>
              <div className="font-mono text-sm">{product.slug}</div>
            </div>
          )}
          {product && (product.description_en || product.description_id) && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Description
              </div>
              <Tabs defaultValue="en" className="mt-2">
                <TabsList className="grid w-full grid-cols-2 mb-2">
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="id">Indonesian</TabsTrigger>
                </TabsList>
                <TabsContent value="en" className="pt-2">
                  <div className="text-base">
                    {product.description_en || (
                      <span className="text-muted-foreground italic">
                        No English description available
                      </span>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="id" className="pt-2">
                  <div className="text-base">
                    {product.description_id || (
                      <span className="text-muted-foreground italic">
                        No Indonesian description available
                      </span>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          {product && product.suitables && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Suitable For
              </div>
              <div className="text-base">
                <ul className="list-none pl-0 space-y-1.5">
                  {(() => {
                    let suitableItems = [];
                    try {
                      if (typeof product.suitables === "string") {
                        suitableItems = JSON.parse(product.suitables as string);
                      } else if (Array.isArray(product.suitables)) {
                        suitableItems = product.suitables as string[];
                      } else {
                        suitableItems = [String(product.suitables)];
                      }
                    } catch {
                      suitableItems = [
                        String((product as ProductWithRelations).suitables),
                      ];
                    }

                    // Ensure we have an array
                    if (!Array.isArray(suitableItems)) {
                      suitableItems = [String(suitableItems)];
                    }

                    return suitableItems.map((suitable, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{suitable}</span>
                      </li>
                    ));
                  })()}
                </ul>
              </div>
            </div>
          )}
          {product && product.catalogue && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Catalogue
              </div>
              <div className="text-base">
                <a
                  href={product.catalogue}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  View Catalogue
                </a>
              </div>
            </div>
          )}
        </div>
        <Button variant="outline" onClick={handleEditProduct} className="mt-6">
          Edit Product Details
        </Button>
      </div>

      <div className="space-y-6">
        {/* Show brand image if available */}
        {product && product.brand_image && (
          <div>
            <h3 className="text-md font-medium mb-2">Brand Image</h3>
            <div className="rounded-lg overflow-hidden border w-64 h-64 p-4 flex items-center justify-center">
              <img
                src={product.brand_image}
                alt={`${product.name} brand`}
                className="object-contain max-w-full max-h-full"
              />
            </div>
          </div>
        )}

        {/* Show preview of the first item image if available */}
        {product &&
          product.items &&
          product.items.length > 0 &&
          typeof product.items[0] === "object" &&
          product.items[0] !== null &&
          product.items[0].image && (
            <div>
              <h3 className="text-md font-medium mb-2">Product Preview</h3>
              <div className="rounded-lg overflow-hidden border">
                <img
                  src={product.items[0].image}
                  alt={product.name}
                  className="object-cover w-full h-64"
                />
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
