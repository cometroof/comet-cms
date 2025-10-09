import { supabase } from "@/lib/supabase";
import type {
  ContactLocationEntry,
  Contacts,
  Province,
  Location,
  Area,
} from "@/types/contacts-location";
import provinceData from "@/pages/contacts-location/province.json";

const TABLE_NAME = "contacts-location";

/**
 * Generic function to get a value by type
 */
export const getValueByType = async (type: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("value")
    .eq("type", type)
    .single();

  if (error) {
    console.error(`Error fetching ${type}:`, error);
    return null;
  }

  return data?.value || null;
};

/**
 * Generic function to set a value by type
 */
export const setValueByType = async (
  type: string,
  value: string,
): Promise<boolean> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert({ type, value }, { onConflict: "type" });

  if (error) {
    console.error(`Error setting ${type}:`, error);
    return false;
  }

  return true;
};

/**
 * Get all contacts information
 */
export const getContacts = async (): Promise<Contacts | null> => {
  const types = [
    "head_office",
    "head_office_link",
    "phone",
    "fax",
    "email",
    "whatsapp_contact_service",
  ];

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .in("type", types);

  if (error) {
    console.error("Error fetching contacts:", error);
    return null;
  }

  // Transform array of {type, value} into Contacts object
  const contacts: Partial<Contacts> = {
    id: "1", // Single record
  };

  data.forEach((item) => {
    contacts[item.type as keyof Contacts] = item.value;
    if (item.created_at) contacts.created_at = item.created_at;
    if (item.updated_at) contacts.updated_at = item.updated_at;
  });

  return contacts as Contacts;
};

/**
 * Update contacts information
 */
export const updateContacts = async (
  contacts: Partial<Contacts>,
): Promise<boolean> => {
  const updates = Object.entries(contacts)
    .filter(([key]) => !["id", "created_at", "updated_at"].includes(key))
    .map(([type, value]) => ({ type, value: value as string }));

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(updates, { onConflict: "type" });

  if (error) {
    console.error("Error updating contacts:", error);
    return false;
  }

  return true;
};

/**
 * Get all provinces from static data
 */
export const getProvinces = async (): Promise<Province[]> => {
  return provinceData.data;
};

/**
 * Get all areas with their locations (stored under data_type: "location_product")
 * Returns areas sorted by order
 */
export const getAllAreas = async (): Promise<Area[]> => {
  const value = await getValueByType("location_product");

  if (!value) return [];

  try {
    const areas = JSON.parse(value);
    // Sort areas by order and locations within each area
    return areas
      .sort((a: Area, b: Area) => (a.order || 0) - (b.order || 0))
      .map((area: Area) => ({
        ...area,
        locations: (area.locations || []).sort(
          (a, b) => (a.order || 0) - (b.order || 0),
        ),
      }));
  } catch (error) {
    console.error("Error parsing areas:", error);
    return [];
  }
};

/**
 * Update all areas (stored under data_type: "location_product")
 */
export const updateAllAreas = async (areas: Area[]): Promise<boolean> => {
  return setValueByType("location_product", JSON.stringify(areas));
};

/**
 * Get a specific area by ID
 */
export const getAreaById = async (areaId: string): Promise<Area | null> => {
  const areas = await getAllAreas();
  return areas.find((a) => a.id === areaId) || null;
};

/**
 * Get a specific area by name
 */
export const getAreaByName = async (areaName: string): Promise<Area | null> => {
  const areas = await getAllAreas();
  return (
    areas.find((a) => a.name.toLowerCase() === areaName.toLowerCase()) || null
  );
};

/**
 * Add a new area
 */
export const addArea = async (areaName: string): Promise<Area | null> => {
  const areas = await getAllAreas();

  // Check if area already exists
  const existingArea = areas.find(
    (a) => a.name.toLowerCase() === areaName.toLowerCase(),
  );
  if (existingArea) {
    return existingArea;
  }

  // Set order as the highest order + 1
  const maxOrder =
    areas.length > 0 ? Math.max(...areas.map((a) => a.order || 0)) : 0;

  const newArea: Area = {
    id: Date.now().toString(),
    name: areaName,
    order: maxOrder + 1,
    locations: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  areas.push(newArea);
  const success = await updateAllAreas(areas);

  return success ? newArea : null;
};

/**
 * Add a new location to an area
 */
export const addLocation = async (
  areaName: string,
  location: Omit<Location, "id" | "created_at" | "updated_at">,
): Promise<Location | null> => {
  const areas = await getAllAreas();

  // Find or create area
  let area = areas.find((a) => a.name.toLowerCase() === areaName.toLowerCase());

  if (!area) {
    // Create new area if it doesn't exist
    const maxAreaOrder =
      areas.length > 0 ? Math.max(...areas.map((a) => a.order || 0)) : 0;

    area = {
      id: Date.now().toString(),
      name: areaName,
      order: maxAreaOrder + 1,
      locations: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    areas.push(area);
  }

  // Set order as the highest order + 1 within this area
  const maxLocationOrder =
    area.locations.length > 0
      ? Math.max(...area.locations.map((l) => l.order || 0))
      : 0;

  // Add location to area
  const newLocation: Location = {
    id: Date.now().toString(),
    ...location,
    order: maxLocationOrder + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  area.locations.push(newLocation);
  area.updated_at = new Date().toISOString();

  const success = await updateAllAreas(areas);

  return success ? newLocation : null;
};

/**
 * Update a location within an area
 */
export const updateLocation = async (
  locationId: string,
  updates: Partial<Location>,
): Promise<boolean> => {
  const areas = await getAllAreas();
  let found = false;

  const updatedAreas = areas.map((area) => {
    const updatedLocations = area.locations.map((location) => {
      if (location.id === locationId) {
        found = true;
        return {
          ...location,
          ...updates,
          updated_at: new Date().toISOString(),
        };
      }
      return location;
    });

    if (found) {
      return {
        ...area,
        locations: updatedLocations,
        updated_at: new Date().toISOString(),
      };
    }
    return area;
  });

  if (!found) return false;

  return updateAllAreas(updatedAreas);
};

/**
 * Delete a location from an area
 */
export const deleteLocation = async (locationId: string): Promise<boolean> => {
  const areas = await getAllAreas();
  let found = false;

  const updatedAreas = areas.map((area) => {
    const filteredLocations = area.locations.filter((location) => {
      if (location.id === locationId) {
        found = true;
        return false;
      }
      return true;
    });

    if (found) {
      return {
        ...area,
        locations: filteredLocations,
        updated_at: new Date().toISOString(),
      };
    }
    return area;
  });

  if (!found) return false;

  return updateAllAreas(updatedAreas);
};

/**
 * Delete an area and all its locations
 */
export const deleteArea = async (areaId: string): Promise<boolean> => {
  const areas = await getAllAreas();
  const filtered = areas.filter((a) => a.id !== areaId);

  return updateAllAreas(filtered);
};

/**
 * Delete all areas and locations
 */
export const deleteAllAreas = async (): Promise<boolean> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("type", "location_product");

  if (error) {
    console.error("Error deleting areas:", error);
    return false;
  }

  return true;
};

/**
 * Reorder areas
 */
export const reorderAreas = async (
  reorderedAreas: Area[],
): Promise<boolean> => {
  // Update order numbers based on array position
  const areasWithUpdatedOrder = reorderedAreas.map((area, index) => ({
    ...area,
    order: index + 1,
    updated_at: new Date().toISOString(),
  }));

  return updateAllAreas(areasWithUpdatedOrder);
};

/**
 * Reorder locations within an area
 */
export const reorderLocations = async (
  areaId: string,
  reorderedLocations: Location[],
): Promise<boolean> => {
  const areas = await getAllAreas();

  const updatedAreas = areas.map((area) => {
    if (area.id === areaId) {
      // Update order numbers based on array position
      const locationsWithUpdatedOrder = reorderedLocations.map(
        (location, index) => ({
          ...location,
          order: index + 1,
          updated_at: new Date().toISOString(),
        }),
      );

      return {
        ...area,
        locations: locationsWithUpdatedOrder,
        updated_at: new Date().toISOString(),
      };
    }
    return area;
  });

  return updateAllAreas(updatedAreas);
};

/**
 * Get all data (for backup or migration purposes)
 */
export const getAllData = async (): Promise<ContactLocationEntry[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("type");

  if (error) {
    console.error("Error fetching all data:", error);
    return [];
  }

  return data || [];
};

/**
 * Bulk upsert data (for seeding or restoration)
 */
export const bulkUpsertData = async (
  entries: Omit<ContactLocationEntry, "id" | "created_at" | "updated_at">[],
): Promise<boolean> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(entries, { onConflict: "type" });

  if (error) {
    console.error("Error bulk upserting data:", error);
    return false;
  }

  return true;
};
