import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ProductQueryProvider,
  useProductQuery,
} from "@/contexts/ProductQueryContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Loader2, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ProfileManager from "./ProfileManager";
import CategoryManager from "./CategoryManager";
import ItemManager from "./ItemManager";
import ProductForm from "./ProductForm";
import { Product, ProductWithRelations, ProductItem } from "./types";
const ProductDetailContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("info");
  const [showProductForm, setShowProductForm] = useState(false);

  // Use the ProductQuery context instead of direct queries
  const {
    product,
    isProductLoading: isLoading,
    productError: error,
    refetchProduct: refetch,
  } = useProductQuery();

  // Handle error separately since onError is not available in the options
  if (error) {
    console.error("Error loading product:", error);
    toast.error("Failed to load product details");
  }

  const handleBackClick = () => {
    navigate("/dashboard/products");
  };

  const handleEditProduct = () => {
    setShowProductForm(true);
  };

  const handleProductUpdate = (updatedProduct: Product) => {
    setShowProductForm(false);
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    }
  };

  const handlePremiumUpdate = () => {
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">
            Loading product details...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!product && id) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-semibold">Product Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={handleBackClick} className="mt-4">
            Back to Products
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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
                {product && (product as ProductWithRelations).name}
              </h1>
              <div className="text-muted-foreground flex items-center gap-2">
                <span>Product Management</span>
              </div>
            </div>
          </div>
          <Button onClick={handleEditProduct}>Edit Product</Button>
        </div>

        {/* Tabs for product management */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="info">Basic Info</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-medium mb-4">
                  Product Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Name
                    </div>
                    <div className="text-base">
                      {product && (product as ProductWithRelations).name}
                    </div>
                  </div>
                  {product && (product as ProductWithRelations).title && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Title
                      </div>
                      <div className="text-base">
                        {(product as ProductWithRelations).title}
                      </div>
                    </div>
                  )}
                  {product && (product as ProductWithRelations).slug && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Slug
                      </div>
                      <div className="font-mono text-sm">
                        {(product as ProductWithRelations).slug}
                      </div>
                    </div>
                  )}
                  {product &&
                    ((product as ProductWithRelations).description_en ||
                      (product as ProductWithRelations).description_id) && (
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
                              {(product as ProductWithRelations)
                                .description_en || (
                                <span className="text-muted-foreground italic">
                                  No English description available
                                </span>
                              )}
                            </div>
                          </TabsContent>
                          <TabsContent value="id" className="pt-2">
                            <div className="text-base">
                              {(product as ProductWithRelations)
                                .description_id || (
                                <span className="text-muted-foreground italic">
                                  No Indonesian description available
                                </span>
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  {product && (product as ProductWithRelations).suitables && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Suitable For
                      </div>
                      <div className="text-base">
                        <ul className="list-none pl-0 space-y-1.5">
                          {(() => {
                            let suitableItems = [];
                            try {
                              if (
                                typeof (product as ProductWithRelations)
                                  .suitables === "string"
                              ) {
                                suitableItems = JSON.parse(
                                  (product as ProductWithRelations)
                                    .suitables as string,
                                );
                              } else if (
                                Array.isArray(
                                  (product as ProductWithRelations).suitables,
                                )
                              ) {
                                suitableItems = (
                                  product as ProductWithRelations
                                ).suitables as string[];
                              } else {
                                suitableItems = [
                                  String(
                                    (product as ProductWithRelations).suitables,
                                  ),
                                ];
                              }
                            } catch {
                              suitableItems = [
                                String(
                                  (product as ProductWithRelations).suitables,
                                ),
                              ];
                            }

                            // Ensure we have an array
                            if (!Array.isArray(suitableItems)) {
                              suitableItems = [String(suitableItems)];
                            }

                            return suitableItems.map((suitable, index) => (
                              <li
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>{suitable}</span>
                              </li>
                            ));
                          })()}
                        </ul>
                      </div>
                    </div>
                  )}
                  {product && (product as ProductWithRelations).catalogue && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Catalogue
                      </div>
                      <div className="text-base">
                        <a
                          href={(product as ProductWithRelations).catalogue}
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
                <Button
                  variant="outline"
                  onClick={handleEditProduct}
                  className="mt-6"
                >
                  Edit Product Details
                </Button>
              </div>

              <div className="space-y-6">
                {/* Show brand image if available */}
                {product && (product as ProductWithRelations).brand_image && (
                  <div>
                    <h3 className="text-md font-medium mb-2">Brand Image</h3>
                    <div className="rounded-lg overflow-hidden border w-64 h-64 p-4 flex items-center justify-center">
                      <img
                        src={(product as ProductWithRelations).brand_image}
                        alt={`${(product as ProductWithRelations).name} brand`}
                        className="object-contain max-w-full max-h-full"
                      />
                    </div>
                  </div>
                )}

                {/* Show preview of the first item image if available */}
                {product &&
                  (product as ProductWithRelations).items &&
                  (product as ProductWithRelations).items.length > 0 &&
                  typeof (product as ProductWithRelations).items[0] ===
                    "object" &&
                  (product as ProductWithRelations).items[0] !== null &&
                  ((product as ProductWithRelations).items[0] as ProductItem)
                    .image && (
                    <div>
                      <h3 className="text-md font-medium mb-2">
                        Product Preview
                      </h3>
                      <div className="rounded-lg overflow-hidden border">
                        <img
                          src={
                            (
                              (product as ProductWithRelations)
                                .items[0] as ProductItem
                            ).image
                          }
                          alt={(product as ProductWithRelations).name}
                          className="object-cover w-full h-64"
                        />
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profiles" className="space-y-4">
            <ProfileManager
              productId={(product as ProductWithRelations)?.id || ""}
              product={product as Product}
              onUpdate={() =>
                queryClient.invalidateQueries({ queryKey: ["product", id] })
              }
            />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <CategoryManager
              productId={(product as ProductWithRelations)?.id || ""}
              product={(product || {}) as Product}
              onUpdate={() =>
                queryClient.invalidateQueries({ queryKey: ["product", id] })
              }
            />
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <ItemManager
              productId={(product as ProductWithRelations)?.id || ""}
              product={(product || {}) as Product}
              onUpdate={() =>
                queryClient.invalidateQueries({ queryKey: ["product", id] })
              }
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Form Dialog */}
      {showProductForm && (
        <ProductForm
          product={product as Product}
          isOpen={showProductForm}
          onClose={() => setShowProductForm(false)}
          onSave={handleProductUpdate}
        />
      )}
    </DashboardLayout>
  );
};

// Wrapper component that provides the ProductQuery context
const ProductDetail = () => {
  const { id } = useParams();

  if (!id) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-semibold">Product ID Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            No product ID was specified in the URL.
          </p>
          <Button onClick={() => window.history.back()} className="mt-4">
            Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProductQueryProvider productId={id}>
      <ProductDetailContent />
    </ProductQueryProvider>
  );
};

export default ProductDetail;
