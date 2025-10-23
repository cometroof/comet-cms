import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as productService from "@/services/product.service";

// Define types for our context
export interface ProductProfile {
  id: string;
  name: string;
  product_id: string;
  size_per_panel?: string;
  effective_size?: string;
  panel_amount?: number;
  materials?: string;
  tkdn_value?: string;
  thickness?: string;
  weight?: string;
  size?: Array<{
    name: string;
    weight: string;
    thickness: string;
  }> | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ProductCategory {
  id: string;
  name: string;
  product_id?: string;
  product_profile_id?: string;
  subtitle?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ProductItem {
  id: string;
  name: string;
  product_id?: string;
  product_profile_id?: string;
  product_category_id?: string;
  weight?: string;
  length?: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface Certificate {
  id: string;
  name: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ProductBadge {
  id: string;
  name: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ProductPremium {
  id: string;
  product_id: string;
  material_fullname?: string;
  material_name?: string;
  size_per_panel?: string;
  effective_size?: string;
  reng_distance?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

// Context state interface
interface ProductQueryContextState {
  // Product data
  product: Record<string, unknown> | null;
  isProductLoading: boolean;
  productError: Error | null;

  // Profiles data
  profiles: ProductProfile[];
  isProfilesLoading: boolean;
  profilesError: Error | null;

  // Categories data
  categories: ProductCategory[];
  isCategoriesLoading: boolean;
  categoriesError: Error | null;

  // Items data
  items: ProductItem[];
  isItemsLoading: boolean;
  itemsError: Error | null;

  // Premium data
  premium: ProductPremium | null;
  isPremiumLoading: boolean;
  premiumError: Error | null;

  // Certificates data
  certificates: Certificate[];
  isCertificatesLoading: boolean;
  certificatesError: Error | null;

  // Badges data
  badges: ProductBadge[];
  isBadgesLoading: boolean;
  badgesError: Error | null;

  // Available certificates and badges for assignment
  availableCertificates: Certificate[];
  isAvailableCertificatesLoading: boolean;
  availableBadges: ProductBadge[];
  isAvailableBadgesLoading: boolean;

  // Utility functions
  refetchProduct: () => Promise<void>;
  refetchAll: () => Promise<void>;
}

// Create the context
const ProductQueryContext = createContext<ProductQueryContextState | undefined>(
  undefined,
);

// Props for the provider
interface ProductQueryProviderProps {
  productId: string;
  children: ReactNode;
}

// Provider component
export const ProductQueryProvider: React.FC<ProductQueryProviderProps> = ({
  productId,
  children,
}) => {
  const queryClient = useQueryClient();

  // Fetch product details
  const {
    data: product,
    isLoading: isProductLoading,
    error: productError,
    refetch: refetchProductQuery,
  } = useQuery<Record<string, unknown>>({
    queryKey: ["product", productId],
    queryFn: () =>
      productId ? productService.getProductById(productId) : null,
    enabled: !!productId,
  });

  // Fetch product profiles
  const {
    data: profiles = [],
    isLoading: isProfilesLoading,
    error: profilesError,
    refetch: refetchProfiles,
  } = useQuery<ProductProfile[]>({
    queryKey: ["product-profiles", productId],
    queryFn: () =>
      productId ? productService.getProductProfiles(productId) : [],
    enabled: !!productId,
  });

  // Fetch product categories
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery<ProductCategory[]>({
    queryKey: ["product-categories", productId],
    queryFn: () =>
      productId ? productService.getProductCategories(productId) : [],
    enabled: !!productId,
  });

  // Fetch product items
  const {
    data: items = [],
    isLoading: isItemsLoading,
    error: itemsError,
    refetch: refetchItems,
  } = useQuery<ProductItem[]>({
    queryKey: ["product-items", productId],
    queryFn: () => (productId ? productService.getProductItems(productId) : []),
    enabled: !!productId,
  });

  // Fetch product premium
  const {
    data: premium = null,
    isLoading: isPremiumLoading,
    error: premiumError,
    refetch: refetchPremium,
  } = useQuery<ProductPremium | null>({
    queryKey: ["product-premium", productId],
    queryFn: () =>
      productId ? productService.getProductPremium(productId) : null,
    enabled: !!productId,
  });

  // Fetch product certificates
  const {
    data: certificates = [],
    isLoading: isCertificatesLoading,
    error: certificatesError,
    refetch: refetchCertificates,
  } = useQuery<Certificate[]>({
    queryKey: ["product-certificates", productId],
    queryFn: () =>
      productId ? productService.getProductCertificates(productId) : [],
    enabled: !!productId,
  });

  // Fetch all available certificates for assignment
  const {
    data: availableCertificates = [],
    isLoading: isAvailableCertificatesLoading,
  } = useQuery<Certificate[]>({
    queryKey: ["certificates-all"],
    queryFn: () => productService.getAllCertificates(),
  });

  // Fetch all available badges for assignment
  const { data: availableBadges = [], isLoading: isAvailableBadgesLoading } =
    useQuery<ProductBadge[]>({
      queryKey: ["badges-all"],
      queryFn: () => productService.getAllBadges(),
    });

  // Refetch product data
  const refetchProduct = async () => {
    await refetchProductQuery();
  };

  // Refetch all data
  const refetchAll = async () => {
    await Promise.all([
      refetchProductQuery(),
      refetchProfiles(),
      refetchCategories(),
      refetchItems(),
      refetchPremium(),
      refetchCertificates(),
    ]);
  };

  // Define the context value
  const contextValue: ProductQueryContextState = {
    // Product data
    product,
    isProductLoading,
    productError,

    // Profiles data
    profiles,
    isProfilesLoading,
    profilesError,

    // Categories data
    categories,
    isCategoriesLoading,
    categoriesError,

    // Items data
    items,
    isItemsLoading,
    itemsError,

    // Premium data
    premium,
    isPremiumLoading,
    premiumError,

    // Certificates data
    certificates,
    isCertificatesLoading,
    certificatesError,

    // Badges data
    badges: [], // Need to implement fetching badges for product if needed
    isBadgesLoading: false,
    badgesError: null,

    // Available certificates and badges
    availableCertificates,
    isAvailableCertificatesLoading,
    availableBadges,
    isAvailableBadgesLoading,

    // Utility functions
    refetchProduct,
    refetchAll,
  };

  return (
    <ProductQueryContext.Provider value={contextValue}>
      {children}
    </ProductQueryContext.Provider>
  );
};

// Custom hook to use the ProductQuery context
export const useProductQuery = () => {
  const context = useContext(ProductQueryContext);
  if (context === undefined) {
    throw new Error(
      "useProductQuery must be used within a ProductQueryProvider",
    );
  }
  return context;
};

// Use named export instead of default export to fix fast refresh warning
export { ProductQueryContext };
