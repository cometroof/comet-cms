import { supabase } from "@/lib/supabase";
import type {
  ContactLocationEntry,
  Contacts,
  Province,
  Location,
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
 * Get locations by province code
 */
export const getLocationsByProvince = async (
  provinceCode: string,
): Promise<Location[]> => {
  const value = await getValueByType(`location_${provinceCode}`);

  if (!value) return [];

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("Error parsing locations:", error);
    return [];
  }
};

/**
 * Get all locations
 */
export const getAllLocations = async (): Promise<Location[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .like("type", "location_%");

  if (error) {
    console.error("Error fetching locations:", error);
    return [];
  }

  const allLocations: Location[] = [];

  data.forEach((item) => {
    try {
      const locations = JSON.parse(item.value);
      allLocations.push(...locations);
    } catch (error) {
      console.error(`Error parsing locations from ${item.type}:`, error);
    }
  });

  return allLocations;
};

/**
 * Update locations for a province
 */
export const updateLocationsForProvince = async (
  provinceCode: string,
  locations: Location[],
): Promise<boolean> => {
  return setValueByType(`location_${provinceCode}`, JSON.stringify(locations));
};

/**
 * Add a new location
 */
export const addLocation = async (
  location: Omit<Location, "id" | "created_at" | "updated_at">,
): Promise<Location | null> => {
  const locations = await getLocationsByProvince(location.province_code);

  const newLocation: Location = {
    id: Date.now().toString(),
    ...location,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  locations.push(newLocation);
  const success = await updateLocationsForProvince(
    location.province_code,
    locations,
  );

  return success ? newLocation : null;
};

/**
 * Update a location
 */
export const updateLocation = async (
  locationId: string,
  updates: Partial<Location>,
): Promise<boolean> => {
  const allLocations = await getAllLocations();
  const location = allLocations.find((l) => l.id === locationId);

  if (!location) return false;

  const locations = await getLocationsByProvince(location.province_code);
  const updatedLocations = locations.map((l) =>
    l.id === locationId
      ? { ...l, ...updates, updated_at: new Date().toISOString() }
      : l,
  );

  return updateLocationsForProvince(location.province_code, updatedLocations);
};

/**
 * Delete a location
 */
export const deleteLocation = async (locationId: string): Promise<boolean> => {
  const allLocations = await getAllLocations();
  const location = allLocations.find((l) => l.id === locationId);

  if (!location) return false;

  const locations = await getLocationsByProvince(location.province_code);
  const filtered = locations.filter((l) => l.id !== locationId);

  return updateLocationsForProvince(location.province_code, filtered);
};

/**
 * Delete all locations for a province
 */
export const deleteLocationsByProvince = async (
  provinceCode: string,
): Promise<boolean> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("type", `location_${provinceCode}`);

  if (error) {
    console.error("Error deleting locations:", error);
    return false;
  }

  return true;
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
