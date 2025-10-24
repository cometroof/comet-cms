import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import * as productService from "@/services/product.service";
import { toast } from "sonner";

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

  // Profile Categories data
  profileCategories: Record<string, ProductCategory[]>;
  isProfileCategoriesLoading: boolean;
  profileCategoriesError: Error | null;

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

  // Profile mutations
  createProfileMutation: {
    mutate: (profile: Omit<ProductProfile, "id">) => void;
    isPending: boolean;
  };
  updateProfileMutation: {
    mutate: (profile: ProductProfile) => void;
    isPending: boolean;
  };
  deleteProfileMutation: {
    mutate: (id: string) => void;
    isPending: boolean;
  };

  // Category mutations
  createCategoryMutation: {
    mutate: (category: Omit<ProductCategory, "id">) => void;
    isPending: boolean;
  };
  updateCategoryMutation: {
    mutate: (category: ProductCategory) => void;
    isPending: boolean;
  };
  deleteCategoryMutation: {
    mutate: (id: string) => void;
    isPending: boolean;
  };

  // Item mutations
  createItemMutation: {
    mutate: (item: Omit<ProductItem, "id">) => void;
    isPending: boolean;
  };
  updateItemMutation: {
    mutate: (item: ProductItem) => void;
    isPending: boolean;
  };
  deleteItemMutation: {
    mutate: (id: string) => void;
    isPending: boolean;
  };

  // Premium mutations
  upsertPremiumMutation: {
    mutate: (premium: Omit<ProductPremium, "id">) => void;
    isPending: boolean;
  };

  // Certificate mutations
  assignCertificatesToProductMutation: {
    mutate: (certificateIds: string[]) => void;
    isPending: boolean;
  };

  // Profile certificate mutations
  assignCertificatesToProfileMutation: {
    mutate: (data: { profileId: string; certificateIds: string[] }) => void;
    isPending: boolean;
  };

  // Profile badge mutations
  assignBadgesToProfileMutation: {
    mutate: (data: { profileId: string; badgeIds: string[] }) => void;
    isPending: boolean;
  };
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

  // Fetch all product categories (both direct and profile-associated)
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery<ProductCategory[]>({
    queryKey: ["product-categories-all", productId],
    queryFn: () =>
      productId ? productService.getAllProductCategories(productId) : [],
    enabled: !!productId,
  });

  // Fetch profile categories for all profiles
  const {
    data: profileCategories = {},
    isLoading: isProfileCategoriesLoading,
    error: profileCategoriesError,
    refetch: refetchProfileCategories,
  } = useQuery<Record<string, ProductCategory[]>>({
    queryKey: ["profile-categories-map", productId],
    queryFn: async () => {
      if (!productId || profiles.length === 0) return {};

      const profileCatsMap: Record<string, ProductCategory[]> = {};
      for (const profile of profiles) {
        const profileCats = await productService.getProfileCategories(
          profile.id,
        );
        profileCatsMap[profile.id] = profileCats;
      }
      return profileCatsMap;
    },
    enabled: !!productId && profiles.length > 0,
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
      refetchProfileCategories(),
    ]);
  };

  // Profile mutations
  const createProfileMutation = useMutation({
    mutationFn: (newProfile: Omit<ProductProfile, "id">) =>
      productService.createProfile(newProfile),
    onSuccess: () => {
      toast.success("Profile created successfully");
      refetchProfiles();
    },
    onError: (error) => {
      console.error("Error creating profile:", error);
      toast.error("Failed to create profile");
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (profile: ProductProfile) =>
      productService.updateProfile(profile),
    onSuccess: () => {
      toast.success("Profile updated successfully");
      refetchProfiles();
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProfile(id),
    onSuccess: () => {
      toast.success("Profile deleted successfully");
      refetchProfiles();
      refetchCategories();
      refetchItems();
    },
    onError: (error) => {
      console.error("Error deleting profile:", error);
      toast.error("Failed to delete profile");
    },
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (newCategory: Omit<ProductCategory, "id">) =>
      productService.createCategory(newCategory),
    onSuccess: () => {
      toast.success("Category created successfully");
      refetchCategories();
    },
    onError: (error) => {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (category: ProductCategory) =>
      productService.updateCategory(category),
    onSuccess: () => {
      toast.success("Category updated successfully");
      refetchCategories();
    },
    onError: (error) => {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => productService.deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted successfully");
      refetchCategories();
      refetchItems();
    },
    onError: (error) => {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    },
  });

  // Item mutations
  const createItemMutation = useMutation({
    mutationFn: (newItem: Omit<ProductItem, "id">) =>
      productService.createItem(newItem),
    onSuccess: () => {
      toast.success("Item created successfully");
      refetchItems();
    },
    onError: (error) => {
      console.error("Error creating item:", error);
      toast.error("Failed to create item");
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: (item: ProductItem) => productService.updateItem(item),
    onSuccess: () => {
      toast.success("Item updated successfully");
      refetchItems();
    },
    onError: (error) => {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => productService.deleteItem(id),
    onSuccess: () => {
      toast.success("Item deleted successfully");
      refetchItems();
    },
    onError: (error) => {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    },
  });

  // Premium mutations
  const upsertPremiumMutation = useMutation({
    mutationFn: (premiumData: Omit<ProductPremium, "id">) =>
      productService.upsertPremium(productId, premiumData),
    onSuccess: () => {
      toast.success("Premium data saved successfully");
      refetchPremium();
    },
    onError: (error) => {
      console.error("Error saving premium data:", error);
      toast.error("Failed to save premium data");
    },
  });

  // Certificate mutations
  const assignCertificatesToProductMutation = useMutation({
    mutationFn: (certificateIds: string[]) =>
      productService.assignCertificatesToProduct(productId, certificateIds),
    onSuccess: () => {
      toast.success("Certificates updated successfully");
      refetchCertificates();
    },
    onError: (error) => {
      console.error("Error updating certificates:", error);
      toast.error("Failed to update certificates");
    },
  });

  // Profile certificate mutations
  const assignCertificatesToProfileMutation = useMutation({
    mutationFn: (data: { profileId: string; certificateIds: string[] }) =>
      productService.assignCertificatesToProfile(
        data.profileId,
        data.certificateIds,
      ),
    onSuccess: () => {
      toast.success("Profile certificates updated successfully");
      refetchProfiles();
    },
    onError: (error) => {
      console.error("Error updating profile certificates:", error);
      toast.error("Failed to update profile certificates");
    },
  });

  // Profile badge mutations
  const assignBadgesToProfileMutation = useMutation({
    mutationFn: (data: { profileId: string; badgeIds: string[] }) =>
      productService.assignBadgesToProfile(data.profileId, data.badgeIds),
    onSuccess: () => {
      toast.success("Profile badges updated successfully");
      refetchProfiles();
    },
    onError: (error) => {
      console.error("Error updating profile badges:", error);
      toast.error("Failed to update profile badges");
    },
  });

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

    // Profile Categories data
    profileCategories,
    isProfileCategoriesLoading,
    profileCategoriesError,

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

    // Profile mutations
    createProfileMutation: {
      mutate: createProfileMutation.mutate,
      isPending: createProfileMutation.isPending,
    },
    updateProfileMutation: {
      mutate: updateProfileMutation.mutate,
      isPending: updateProfileMutation.isPending,
    },
    deleteProfileMutation: {
      mutate: deleteProfileMutation.mutate,
      isPending: deleteProfileMutation.isPending,
    },

    // Category mutations
    createCategoryMutation: {
      mutate: createCategoryMutation.mutate,
      isPending: createCategoryMutation.isPending,
    },
    updateCategoryMutation: {
      mutate: updateCategoryMutation.mutate,
      isPending: updateCategoryMutation.isPending,
    },
    deleteCategoryMutation: {
      mutate: deleteCategoryMutation.mutate,
      isPending: deleteCategoryMutation.isPending,
    },

    // Item mutations
    createItemMutation: {
      mutate: createItemMutation.mutate,
      isPending: createItemMutation.isPending,
    },
    updateItemMutation: {
      mutate: updateItemMutation.mutate,
      isPending: updateItemMutation.isPending,
    },
    deleteItemMutation: {
      mutate: deleteItemMutation.mutate,
      isPending: deleteItemMutation.isPending,
    },

    // Premium mutations
    upsertPremiumMutation: {
      mutate: upsertPremiumMutation.mutate,
      isPending: upsertPremiumMutation.isPending,
    },

    // Certificate mutations
    assignCertificatesToProductMutation: {
      mutate: assignCertificatesToProductMutation.mutate,
      isPending: assignCertificatesToProductMutation.isPending,
    },

    // Profile certificate mutations
    assignCertificatesToProfileMutation: {
      mutate: assignCertificatesToProfileMutation.mutate,
      isPending: assignCertificatesToProfileMutation.isPending,
    },

    // Profile badge mutations
    assignBadgesToProfileMutation: {
      mutate: assignBadgesToProfileMutation.mutate,
      isPending: assignBadgesToProfileMutation.isPending,
    },
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
