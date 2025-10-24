import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as productService from "@/services/product.service";
import { Product } from "@/pages/product/types";
import { toast } from "sonner";

// Context state interface
interface ProductsQueryContextState {
  // Products list data
  products: Product[];
  isProductsLoading: boolean;
  productsError: Error | null;

  // Mutations
  createProductMutation: {
    mutate: (product: Omit<Product, "id">) => void;
    isPending: boolean;
  };
  updateProductMutation: {
    mutate: (product: Product) => void;
    isPending: boolean;
  };
  deleteProductMutation: {
    mutate: (id: string) => void;
    isPending: boolean;
  };

  // Refetch function
  refetchProducts: () => Promise<void>;
}

// Create the context
const ProductsQueryContext = createContext<
  ProductsQueryContextState | undefined
>(undefined);

// Props for the provider
interface ProductsQueryProviderProps {
  children: ReactNode;
}

// Provider component
export const ProductsQueryProvider: React.FC<ProductsQueryProviderProps> = ({
  children,
}) => {
  const queryClient = useQueryClient();

  // Fetch products list
  const {
    data: products = [],
    isLoading: isProductsLoading,
    error: productsError,
    refetch: refetchProductsQuery,
  } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => productService.getProducts(),
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (newProduct: Omit<Product, "id">) => {
      return productService.createProduct(newProduct);
    },
    onSuccess: () => {
      toast.success("Product created successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: (updatedProduct: Product) =>
      productService.updateProduct(updatedProduct.id, updatedProduct),
    onSuccess: (_, variables) => {
      toast.success("Product updated successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    },
  });

  // Refetch products list
  const refetchProducts = async () => {
    await refetchProductsQuery();
  };

  // Define the context value
  const contextValue: ProductsQueryContextState = {
    // Products list data
    products,
    isProductsLoading,
    productsError,

    // Mutations
    createProductMutation: {
      mutate: createProductMutation.mutate,
      isPending: createProductMutation.isPending,
    },
    updateProductMutation: {
      mutate: updateProductMutation.mutate,
      isPending: updateProductMutation.isPending,
    },
    deleteProductMutation: {
      mutate: deleteProductMutation.mutate,
      isPending: deleteProductMutation.isPending,
    },

    // Refetch function
    refetchProducts,
  };

  return (
    <ProductsQueryContext.Provider value={contextValue}>
      {children}
    </ProductsQueryContext.Provider>
  );
};

// Custom hook to use the ProductsQuery context
export const useProductsQuery = () => {
  const context = useContext(ProductsQueryContext);
  if (context === undefined) {
    throw new Error(
      "useProductsQuery must be used within a ProductsQueryProvider",
    );
  }
  return context;
};

// Export the context without default to keep consistent with other contexts
export { ProductsQueryContext };
