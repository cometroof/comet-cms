import { supabase } from "@/lib/supabase";
import type { Slider } from "@/pages/home/types";

const TABLE_NAME = "slider";

/**
 * Get all sliders by type
 */
export const getSlidersByType = async (
  type: string = "home-cover",
): Promise<Slider[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("type", type)
    .order("order", { ascending: true });

  if (error) {
    console.error("Error fetching sliders:", error);
    return [];
  }

  return data || [];
};

/**
 * Get all sliders (all types)
 */
export const getAllSliders = async (): Promise<Slider[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("type")
    .order("order", { ascending: true });

  if (error) {
    console.error("Error fetching all sliders:", error);
    return [];
  }

  return data || [];
};

/**
 * Get a single slider by ID
 */
export const getSliderById = async (id: string): Promise<Slider | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching slider:", error);
    return null;
  }

  return data;
};

/**
 * Create a new slider
 */
export const createSlider = async (
  slider: Omit<Slider, "id" | "created_at" | "updated_at">,
): Promise<Slider | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([slider])
    .select()
    .single();

  if (error) {
    console.error("Error creating slider:", error);
    return null;
  }

  return data;
};

/**
 * Update a slider
 */
export const updateSlider = async (
  id: string,
  updates: Partial<Omit<Slider, "id" | "created_at" | "updated_at">>,
): Promise<Slider | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating slider:", error);
    return null;
  }

  return data;
};

/**
 * Delete a slider
 */
export const deleteSlider = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);

  if (error) {
    console.error("Error deleting slider:", error);
    return false;
  }

  return true;
};

/**
 * Update slider order (reorder sliders)
 */
export const updateSliderOrder = async (
  sliders: Array<{ id: string; order: number }>,
): Promise<boolean> => {
  try {
    // Update each slider's order
    const updates = sliders.map(({ id, order }) =>
      supabase.from(TABLE_NAME).update({ order }).eq("id", id),
    );

    await Promise.all(updates);
    return true;
  } catch (error) {
    console.error("Error updating slider order:", error);
    return false;
  }
};

/**
 * Delete all sliders of a specific type
 */
export const deleteSlidersByType = async (type: string): Promise<boolean> => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq("type", type);

  if (error) {
    console.error("Error deleting sliders by type:", error);
    return false;
  }

  return true;
};

/**
 * Bulk upsert sliders (for seeding or restoration)
 */
export const bulkUpsertSliders = async (
  sliders: Omit<Slider, "created_at" | "updated_at">[],
): Promise<boolean> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(sliders, { onConflict: "id" });

  if (error) {
    console.error("Error bulk upserting sliders:", error);
    return false;
  }

  return true;
};
