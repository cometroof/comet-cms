import { supabase } from "@/lib/supabase";
import type {
  Product,
  ProductProfile,
  ProductCategory,
  ProductItem,
  ProductPremium,
  Certificate,
  ProductBadge,
  ProductWithRelations,
  PremiumFormData,
} from "@/pages/product/types";

// Table names
const PRODUCT_TABLE = "product";
const PROFILE_TABLE = "product_profile";
const CATEGORY_TABLE = "product_category";
const ITEM_TABLE = "product_item";
const PREMIUM_TABLE = "product_premium";
const CERTIFICATES_TABLE = "certificates";
const BADGES_TABLE = "product_badges";
const PRODUCT_CERTIFICATES_TABLE = "product_certificates";
const PROFILE_CERTIFICATES_TABLE = "product_profile_certificates";
const PROFILE_BADGES_TABLE = "product_profile_badges";

/**
 * PRODUCT CRUD
 */

/**
 * Get all products with counts
 */
export const getProducts = async (): Promise<ProductWithRelations[]> => {
  const { data, error } = await supabase
    .from(PRODUCT_TABLE)
    .select(
      `
      *,
      profiles:${PROFILE_TABLE}(count),
      items:${ITEM_TABLE}(count)
    `,
    )
    .order("order", { ascending: true });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return (
    data?.map((product) => ({
      ...product,
      profilesCount: product.profiles?.[0]?.count || 0,
      itemsCount: product.items?.[0]?.count || 0,
    })) || []
  );
};

/**
 * Get product by ID with all relations
 */
export const getProductById = async (
  id: string,
): Promise<ProductWithRelations | null> => {
  const { data, error } = await supabase
    .from(PRODUCT_TABLE)
    .select(
      `
      *,
      profiles:${PROFILE_TABLE}(*),
      categories:${CATEGORY_TABLE}(*),
      items:${ITEM_TABLE}(*),
      premium:${PREMIUM_TABLE}(*),
      certificates:${PRODUCT_CERTIFICATES_TABLE}(id, certificate:${CERTIFICATES_TABLE}(*))
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }

  // Normalize certificates data
  const certificates =
    data?.certificates?.map(
      (cert: { certificate: Certificate }) => cert.certificate,
    ) || [];

  // Parse suitables field if it exists
  let parsedSuitables = data?.suitables;
  if (parsedSuitables && typeof parsedSuitables === "string") {
    try {
      parsedSuitables = JSON.parse(parsedSuitables);
    } catch (e) {
      console.error("Error parsing suitables JSON:", e);
      parsedSuitables = [parsedSuitables]; // Fallback to array with single string
    }
  }

  return {
    ...data,
    certificates,
    profilesCount: data?.profiles?.length || 0,
    itemsCount: data?.items?.length || 0,
    brand_image: data?.brand_image,
    suitables: parsedSuitables,
    slug: data?.slug,
    title: data?.title,
    description_en: data?.description_en,
    description_id: data?.description_id,
  };
};

/**
 * Create a new product
 */
export const createProduct = async (
  productData: Omit<Product, "id" | "created_at" | "updated_at">,
): Promise<Product | null> => {
  const { data, error } = await supabase
    .from(PRODUCT_TABLE)
    .insert([productData])
    .select()
    .single();

  if (error) {
    console.error("Error creating product:", error);
    return null;
  }

  return data;
};

/**
 * Update a product
 */
export const updateProduct = async (
  id: string,
  updates: Partial<Omit<Product, "id" | "created_at" | "updated_at">>,
): Promise<Product | null> => {
  const { data, error } = await supabase
    .from(PRODUCT_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating product ${id}:`, error);
    return null;
  }

  return data;
};

/**
 * Delete a product (cascade will delete related data)
 */
export const deleteProduct = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from(PRODUCT_TABLE).delete().eq("id", id);

  if (error) {
    console.error(`Error deleting product ${id}:`, error);
    return false;
  }

  return true;
};

/**
 * PROFILE CRUD
 */

/**
 * Get product profiles by product ID
 */
export const getProductProfiles = async (
  productId: string,
): Promise<ProductProfile[]> => {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select("*")
    .eq("product_id", productId)
    .order("name");

  if (error) {
    console.error("Error fetching product profiles:", error);
    return [];
  }

  // Ensure size is always an array
  return (data || []).map((profile) => ({
    ...profile,
    size: profile.size || [],
  }));
};

/**
 * Get a single profile by ID
 */
export const getProfileById = async (
  profileId: string,
): Promise<ProductProfile | null> => {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select("*")
    .eq("id", profileId)
    .single();

  if (error) {
    console.error(`Error fetching profile ${profileId}:`, error);
    return null;
  }

  // Ensure size is properly formatted
  if (data) {
    return {
      ...data,
      size: data.size || [],
    };
  }

  return null;
};

/**
 * Create a profile
 */
export const createProfile = async (
  profileData: Omit<ProductProfile, "id" | "created_at" | "updated_at">,
): Promise<ProductProfile | null> => {
  // Ensure size field is properly formatted as Json
  const dataToInsert = {
    ...profileData,
    size: profileData.size || [],
  };

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .insert([dataToInsert])
    .select()
    .single();

  if (error) {
    console.error("Error creating profile:", error);
    return null;
  }

  return data;
};

/**
 * Update a profile
 */
export const updateProfile = async (
  id: string,
  updates: Partial<Omit<ProductProfile, "id" | "created_at" | "updated_at">>,
): Promise<ProductProfile | null> => {
  // Ensure size field is properly formatted as Json if present
  const dataToUpdate = {
    ...updates,
    size: updates.size || undefined,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .update(dataToUpdate)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating profile ${id}:`, error);
    return null;
  }

  return data;
};

/**
 * Delete a profile
 */
export const deleteProfile = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from(PROFILE_TABLE).delete().eq("id", id);

  if (error) {
    console.error(`Error deleting profile ${id}:`, error);
    return false;
  }

  return true;
};

/**
 * CATEGORY CRUD
 */

/**
 * Get categories by product ID
 */
export const getProductCategories = async (
  productId: string,
): Promise<ProductCategory[]> => {
  const { data, error } = await supabase
    .from(CATEGORY_TABLE)
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching categories for product ${productId}:`, error);
    return [];
  }

  return data || [];
};

/**
 * Get categories by profile ID
 */
export const getProfileCategories = async (
  profileId: string,
): Promise<ProductCategory[]> => {
  const { data, error } = await supabase
    .from(CATEGORY_TABLE)
    .select("*")
    .eq("product_profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching categories for profile ${profileId}:`, error);
    return [];
  }

  return data || [];
};

/**
 * Get all categories for a product (direct and via profiles)
 */
export const getAllProductCategories = async (
  productId: string,
): Promise<ProductCategory[]> => {
  // Get all profiles for this product first
  const profiles = await getProductProfiles(productId);
  const profileIds = profiles.map((profile) => profile.id);

  // Query for both product categories and profile categories
  const { data, error } = await supabase
    .from(CATEGORY_TABLE)
    .select("*")
    .or(
      `product_id.eq.${productId},product_profile_id.in.(${profileIds.join(",")})`,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      `Error fetching all categories for product ${productId}:`,
      error,
    );
    return [];
  }

  return data || [];
};

/**
 * Get a single category by ID
 */
export const getCategoryById = async (
  id: string,
): Promise<ProductCategory | null> => {
  const { data, error } = await supabase
    .from(CATEGORY_TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching category ${id}:`, error);
    return null;
  }

  return data;
};

/**
 * Create a category
 */
export const createCategory = async (
  categoryData: Omit<ProductCategory, "id" | "created_at" | "updated_at">,
): Promise<ProductCategory | null> => {
  const { data, error } = await supabase
    .from(CATEGORY_TABLE)
    .insert([categoryData])
    .select()
    .single();

  if (error) {
    console.error("Error creating category:", error);
    return null;
  }

  return data;
};

/**
 * Update a category
 */
export const updateCategory = async (
  id: string,
  updates: Partial<Omit<ProductCategory, "id" | "created_at" | "updated_at">>,
): Promise<ProductCategory | null> => {
  const { data, error } = await supabase
    .from(CATEGORY_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating category ${id}:`, error);
    return null;
  }

  return data;
};

/**
 * Delete a category
 */
export const deleteCategory = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from(CATEGORY_TABLE).delete().eq("id", id);

  if (error) {
    console.error(`Error deleting category ${id}:`, error);
    return false;
  }

  return true;
};

/**
 * ITEM CRUD
 */

/**
 * Get all product items for a product
 */
export const getProductItems = async (
  productId: string,
): Promise<ProductItem[]> => {
  const { data, error } = await supabase
    .from(ITEM_TABLE)
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching items for product ${productId}:`, error);
    return [];
  }

  return data || [];
};

/**
 * Get items by profile ID
 */
export const getProfileItems = async (
  profileId: string,
): Promise<ProductItem[]> => {
  const { data, error } = await supabase
    .from(ITEM_TABLE)
    .select("*")
    .eq("product_profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching items for profile ${profileId}:`, error);
    return [];
  }

  return data || [];
};

/**
 * Get items by category ID
 */
export const getCategoryItems = async (
  categoryId: string,
): Promise<ProductItem[]> => {
  const { data, error } = await supabase
    .from(ITEM_TABLE)
    .select("*")
    .eq("product_category_id", categoryId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching items for category ${categoryId}:`, error);
    return [];
  }

  return data || [];
};

/**
 * Get a single item by ID
 */
export const getItemById = async (id: string): Promise<ProductItem | null> => {
  const { data, error } = await supabase
    .from(ITEM_TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching item ${id}:`, error);
    return null;
  }

  return data;
};

/**
 * Create an item
 */
export const createItem = async (
  itemData: Omit<ProductItem, "id" | "created_at" | "updated_at">,
): Promise<ProductItem | null> => {
  const { data, error } = await supabase
    .from(ITEM_TABLE)
    .insert([itemData])
    .select()
    .single();

  if (error) {
    console.error("Error creating item:", error);
    return null;
  }

  return data;
};

/**
 * Update an item
 */
export const updateItem = async (
  id: string,
  updates: Partial<Omit<ProductItem, "id" | "created_at" | "updated_at">>,
): Promise<ProductItem | null> => {
  const { data, error } = await supabase
    .from(ITEM_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating item ${id}:`, error);
    return null;
  }

  return data;
};

/**
 * Delete an item
 */
export const deleteItem = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from(ITEM_TABLE).delete().eq("id", id);

  if (error) {
    console.error(`Error deleting item ${id}:`, error);
    return false;
  }

  return true;
};

/**
 * PREMIUM
 */

/**
 * Get product premium by product ID
 */
export const getProductPremium = async (
  productId: string,
): Promise<ProductPremium | null> => {
  const { data, error } = await supabase
    .from(PREMIUM_TABLE)
    .select("*")
    .eq("product_id", productId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "Row not found" error
    console.error(`Error fetching premium for product ${productId}:`, error);
    return null;
  }

  return data || null;
};

/**
 * Create or update premium specs
 */
export const upsertPremium = async (
  premiumData: PremiumFormData,
): Promise<ProductPremium | null> => {
  // Check if premium record exists
  const existing = await getProductPremium(premiumData.product_id);

  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from(PREMIUM_TABLE)
      .update({
        ...premiumData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating premium ${existing.id}:`, error);
      return null;
    }

    return data;
  } else {
    // Create new record
    const { data, error } = await supabase
      .from(PREMIUM_TABLE)
      .insert([premiumData])
      .select()
      .single();

    if (error) {
      console.error("Error creating premium:", error);
      return null;
    }

    return data;
  }
};

/**
 * CERTIFICATES & BADGES
 */

/**
 * Get all certificates
 */
export const getAllCertificates = async (): Promise<Certificate[]> => {
  const { data, error } = await supabase
    .from(CERTIFICATES_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching certificates:", error);
    return [];
  }

  return data || [];
};

/**
 * Get all badges
 */
export const getAllBadges = async (): Promise<ProductBadge[]> => {
  const { data, error } = await supabase
    .from(BADGES_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching badges:", error);
    return [];
  }

  return data || [];
};

/**
 * Get certificates assigned to a product
 */
export const getProductCertificates = async (
  productId: string,
): Promise<Certificate[]> => {
  const { data, error } = await supabase
    .from(PRODUCT_CERTIFICATES_TABLE)
    .select(
      `
      certificate_id,
      certificate:${CERTIFICATES_TABLE}(*)
    `,
    )
    .eq("product_id", productId);

  if (error) {
    console.error(
      `Error fetching certificates for product ${productId}:`,
      error,
    );
    return [];
  }

  return data.map((item) => item.certificate) || [];
};

/**
 * Get certificates assigned to a profile
 */
export const getProfileCertificates = async (
  profileId: string,
): Promise<Certificate[]> => {
  const { data, error } = await supabase
    .from(PROFILE_CERTIFICATES_TABLE)
    .select(
      `
      certificate_id,
      certificate:${CERTIFICATES_TABLE}(*)
    `,
    )
    .eq("product_profile_id", profileId);

  if (error) {
    console.error(
      `Error fetching certificates for profile ${profileId}:`,
      error,
    );
    return [];
  }

  return data.map((item) => item.certificate) || [];
};

/**
 * Get badges assigned to a profile
 */
export const getProfileBadges = async (
  profileId: string,
): Promise<ProductBadge[]> => {
  const { data, error } = await supabase
    .from(PROFILE_BADGES_TABLE)
    .select(
      `
      badge_id,
      badge:${BADGES_TABLE}(*)
    `,
    )
    .eq("product_profile_id", profileId);

  if (error) {
    console.error(`Error fetching badges for profile ${profileId}:`, error);
    return [];
  }

  return data.map((item) => item.badge) || [];
};

/**
 * Assign certificates to product
 */
export const assignCertificatesToProduct = async (
  productId: string,
  certificateIds: string[],
): Promise<boolean> => {
  // First remove existing certificates
  const { error: deleteError } = await supabase
    .from(PRODUCT_CERTIFICATES_TABLE)
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    console.error(
      `Error removing existing certificates from product ${productId}:`,
      deleteError,
    );
    return false;
  }

  // Then add new certificates
  if (certificateIds.length > 0) {
    const records = certificateIds.map((certificate_id) => ({
      product_id: productId,
      certificate_id,
    }));

    const { error } = await supabase
      .from(PRODUCT_CERTIFICATES_TABLE)
      .insert(records);

    if (error) {
      console.error(
        `Error assigning certificates to product ${productId}:`,
        error,
      );
      return false;
    }
  }

  return true;
};

/**
 * Assign certificates to profile
 */
export const assignCertificatesToProfile = async (
  profileId: string,
  certificateIds: string[],
): Promise<boolean> => {
  // First remove existing certificates
  const { error: deleteError } = await supabase
    .from(PROFILE_CERTIFICATES_TABLE)
    .delete()
    .eq("product_profile_id", profileId);

  if (deleteError) {
    console.error(
      `Error removing existing certificates from profile ${profileId}:`,
      deleteError,
    );
    return false;
  }

  // Then add new certificates
  if (certificateIds.length > 0) {
    const records = certificateIds.map((certificate_id) => ({
      product_profile_id: profileId,
      certificate_id,
    }));

    const { error } = await supabase
      .from(PROFILE_CERTIFICATES_TABLE)
      .insert(records);

    if (error) {
      console.error(
        `Error assigning certificates to profile ${profileId}:`,
        error,
      );
      return false;
    }
  }

  return true;
};

/**
 * Assign badges to profile
 */
export const assignBadgesToProfile = async (
  profileId: string,
  badgeIds: string[],
): Promise<boolean> => {
  // First remove existing badges
  const { error: deleteError } = await supabase
    .from(PROFILE_BADGES_TABLE)
    .delete()
    .eq("product_profile_id", profileId);

  if (deleteError) {
    console.error(
      `Error removing existing badges from profile ${profileId}:`,
      deleteError,
    );
    return false;
  }

  // Then add new badges
  if (badgeIds.length > 0) {
    const records = badgeIds.map((badge_id) => ({
      product_profile_id: profileId,
      badge_id,
    }));

    const { error } = await supabase.from(PROFILE_BADGES_TABLE).insert(records);

    if (error) {
      console.error(`Error assigning badges to profile ${profileId}:`, error);
      return false;
    }
  }

  return true;
};

/**
 * Get product premium by profile ID
 */
export const getProfilePremium = async (
  profileId: string,
): Promise<ProductPremium | null> => {
  const { data, error } = await supabase
    .from(PREMIUM_TABLE)
    .select("*")
    .eq("product_profile_id", profileId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error(`Error fetching premium for profile ${profileId}:`, error);
    return null;
  }

  return data || null;
};

/**
 * Update product order
 */
export const updateProductOrder = async (
  productId: string,
  newOrder: number,
): Promise<boolean> => {
  const { error } = await supabase
    .from(PRODUCT_TABLE)
    .update({ order: newOrder, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) {
    console.error(`Error updating order for product ${productId}:`, error);
    return false;
  }

  return true;
};
