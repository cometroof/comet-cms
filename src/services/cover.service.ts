import { supabase } from "@/lib/supabase";
import type { Cover } from "@/pages/home/types";

const TABLE_NAME = "cover";

/**
 * Get all covers
 */
export const getAllCovers = async (): Promise<Cover[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("order", { ascending: true });

  if (error) {
    console.error("Error fetching covers:", error);
    return [];
  }

  return data || [];
};

/**
 * Get cover by type
 */
export const getCoverByType = async (type: string): Promise<Cover | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("type", type)
    .single();

  if (error) {
    console.error("Error fetching cover:", error);
    return null;
  }

  return data;
};

/**
 * Get a single cover by ID
 */
export const getCoverById = async (id: string): Promise<Cover | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching cover:", error);
    return null;
  }

  return data;
};

/**
 * Create a new cover
 */
export const createCover = async (
  cover: Omit<Cover, "id" | "created_at" | "updated_at">
): Promise<Cover | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([cover])
    .select()
    .single();

  if (error) {
    console.error("Error creating cover:", error);
    return null;
  }

  return data;
};

/**
 * Update a cover
 */
export const updateCover = async (
  id: string,
  updates: Partial<Omit<Cover, "id" | "created_at" | "updated_at">>
): Promise<Cover | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating cover:", error);
    return null;
  }

  return data;
};

/**
 * Delete a cover
 */
export const deleteCover = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting cover:", error);
    return false;
  }

  return true;
};

/**
 * Bulk upsert covers (for seeding or restoration)
 */
export const bulkUpsertCovers = async (
  covers: Omit<Cover, "created_at" | "updated_at">[]
): Promise<boolean> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(covers, { onConflict: "id" });

  if (error) {
    console.error("Error bulk upserting covers:", error);
    return false;
  }

  return true;
};
