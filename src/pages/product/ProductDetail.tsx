import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ProductQueryProvider,
  useProductQuery,
} from "@/contexts/ProductQueryContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ProfileManager from "./ProfileManager";
import CategoryManager from "./CategoryManager";
import ItemManager from "./ItemManager";
import PremiumManager from "./PremiumManager";
import ProductForm from "./ProductForm";
import { Product, ProductWithRelations } from "./types";
import InfoTab from "./detail-tabs/InfoTab";

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
                {product?.name}
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
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="info">Basic Info</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="premium">
              <Crown className="h-4 w-4 mr-1 text-amber-500" />
              Premium
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <InfoTab product={product} handleEditProduct={handleEditProduct} />
          </TabsContent>

          <TabsContent value="profiles" className="space-y-4">
            <ProfileManager
              productId={product?.id || ""}
              product={product!}
              onUpdate={() =>
                queryClient.invalidateQueries({ queryKey: ["product", id] })
              }
            />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <CategoryManager
              productId={product?.id || ""}
              product={product!}
              onUpdate={() =>
                queryClient.invalidateQueries({ queryKey: ["product", id] })
              }
            />
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <ItemManager
              productId={product?.id || ""}
              product={product!}
              onUpdate={() =>
                queryClient.invalidateQueries({ queryKey: ["product", id] })
              }
            />
          </TabsContent>

          <TabsContent value="premium" className="space-y-4">
            <PremiumManager
              productId={product?.id || ""}
              product={product!}
              onUpdate={() =>
                queryClient.invalidateQueries({ queryKey: ["product", id] })
              }
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Form Dialog */}
      {showProductForm && product && (
        <ProductForm
          product={product}
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
