import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ProductsTable from "./ProductsTable";
import ProductForm from "./ProductForm";
import ProductDetail from "./ProductDetail";
import { useNavigate, useParams } from "react-router-dom";
import { Product } from "./types";
import {
  ProductsQueryContext,
  ProductsQueryProvider,
  useProductsQuery,
} from "@/contexts/ProductsQueryContext";

const ProductsContent = () => {
  const { id } = useParams();
  const [showProductForm, setShowProductForm] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const navigate = useNavigate();

  const {
    products,
    isProductsLoading: loading,
    deleteProductMutation,
  } = useProductsQuery();

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  const handleCloseForm = () => {
    setShowProductForm(false);
    setSelectedProduct(null);
  };

  const handleSaveProduct = async (product: Product) => {
    setShowProductForm(false);
    navigate(`/dashboard/products/${product.id}`);
  };

  const handleManageProduct = (product: Product) => {
    navigate(`/dashboard/products/${product.id}`);
  };

  const handleDeleteProduct = async (id: string) => {
    deleteProductMutation.mutate(id);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Product Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your products, profiles, categories and items
            </p>
          </div>
          <Button
            onClick={handleAddProduct}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add Product
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <ProductsTable
            products={products}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onManage={handleManageProduct}
          />
        )}

        {showProductForm && (
          <ProductForm
            product={selectedProduct}
            isOpen={showProductForm}
            onClose={handleCloseForm}
            onSave={handleSaveProduct}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

const Products = () => {
  const { id } = useParams();

  // If we have an ID in the route params, show the product detail view
  if (id) {
    return <ProductDetail />;
  }

  return (
    <ProductsQueryProvider>
      <ProductsContent />
    </ProductsQueryProvider>
  );
};

export default Products;
