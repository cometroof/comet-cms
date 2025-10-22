import { supabase } from "./supabase";
import type { Tables, TablesInsert, TablesUpdate } from "./supabase-types";
import { LibraryImage, deleteFromR2, uploadToR2 } from "./r2-actions";

// Type aliases
type Certificate = Tables<"certificates">;
type CertificateInsert = TablesInsert<"certificates">;
type CertificateUpdate = TablesUpdate<"certificates">;

type ProductBadge = Tables<"product_badges">;
type ProductBadgeInsert = TablesInsert<"product_badges">;
type ProductBadgeUpdate = TablesUpdate<"product_badges">;

type CompanyProfile = Tables<"company_profile">;
type CompanyProfileInsert = TablesInsert<"company_profile">;
type CompanyProfileUpdate = TablesUpdate<"company_profile">;

// Company Profile Functions
export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  const { data, error } = await supabase
    .from("company_profile")
    .select("*")
    .single();

  if (error) {
    console.error("Error fetching company profile:", error);
    return null;
  }

  return data;
}

export async function updateCompanyProfile(
  profileData: CompanyProfileUpdate,
  id?: string,
): Promise<CompanyProfile | null> {
  // If we have an existing profile, update it
  if (id) {
    const { data, error } = await supabase
      .from("company_profile")
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating company profile:", error);
      return null;
    }

    return data;
  }
  // Otherwise create a new one
  else {
    const { data, error } = await supabase
      .from("company_profile")
      .insert({
        ...(profileData as CompanyProfileInsert),
        uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating company profile:", error);
      return null;
    }

    return data;
  }
}

export async function uploadCompanyProfileFile(
  formData: FormData,
): Promise<LibraryImage | null> {
  try {
    return await uploadToR2(formData);
  } catch (error) {
    console.error("Error uploading company profile file:", error);
    return null;
  }
}

// Certificates Functions
export async function getCertificates(): Promise<Certificate[]> {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .order("is_important_info", { ascending: false })
    .order("order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching certificates:", error);
    return [];
  }

  return data || [];
}

export async function getCertificateById(
  id: string,
): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching certificate with id ${id}:`, error);
    return null;
  }

  return data;
}

export async function createCertificate(
  certData: CertificateInsert,
): Promise<Certificate | null> {
  // Get the highest order value from existing certificates
  const { data: certificates } = await supabase
    .from("certificates")
    .select("order")
    .order("order", { ascending: false })
    .limit(1);

  // Set the new certificate's order to highest + 1, or 0 if no certificates exist
  const highestOrder =
    certificates && certificates.length > 0 && certificates[0].order != null
      ? certificates[0].order
      : -1;

  const { data, error } = await supabase
    .from("certificates")
    .insert({
      ...certData,
      order: highestOrder + 1, // Assign next available order
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating certificate:", error);
    return null;
  }

  return data;
}

export async function updateCertificate(
  id: string,
  certData: CertificateUpdate,
): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from("certificates")
    .update({
      ...certData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating certificate with id ${id}:`, error);
    return null;
  }

  return data;
}

export async function updateCertificateOrder(
  certificates: { id: string; order: number }[],
): Promise<boolean> {
  try {
    // Use Promise.all to perform multiple updates concurrently
    await Promise.all(
      certificates.map(({ id, order }) =>
        supabase
          .from("certificates")
          .update({ order, updated_at: new Date().toISOString() })
          .eq("id", id),
      ),
    );

    return true;
  } catch (error) {
    console.error("Error updating certificate orders:", error);
    return false;
  }
}

export async function deleteCertificate(id: string): Promise<boolean> {
  // First get the certificate to check if we need to delete the file from R2
  const certificate = await getCertificateById(id);

  // Delete from Supabase
  const { error } = await supabase.from("certificates").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting certificate with id ${id}:`, error);
    return false;
  }

  // If the certificate has a file_url that contains R2 bucket URL,
  // try to delete the file from R2 as well
  if (certificate && certificate.file_url) {
    try {
      // Extract the key from the URL - assuming the file_url format is https://bucket-url/key
      const r2BucketUrl = import.meta.env.VITE_R2_BUCKET_URL;
      if (certificate.file_url.includes(r2BucketUrl)) {
        const key = certificate.file_url.replace(`${r2BucketUrl}/`, "");
        await deleteFromR2(key);
      }
    } catch (error) {
      console.error("Error deleting file from R2:", error);
      // We don't return false here because the certificate was successfully deleted from Supabase
    }
  }

  return true;
}

export async function uploadCertificateFile(
  formData: FormData,
): Promise<LibraryImage | null> {
  try {
    return await uploadToR2(formData);
  } catch (error) {
    console.error("Error uploading certificate file:", error);
    return null;
  }
}

// Product Badge Functions
export async function getProductBadges(): Promise<ProductBadge[]> {
  const { data, error } = await supabase
    .from("product_badges")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching product badges:", error);
    return [];
  }

  return data || [];
}

export async function getProductBadgeById(
  id: string,
): Promise<ProductBadge | null> {
  const { data, error } = await supabase
    .from("product_badges")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching product badge with id ${id}:`, error);
    return null;
  }

  return data;
}

export async function createProductBadge(
  badgeData: ProductBadgeInsert,
): Promise<ProductBadge | null> {
  const { data, error } = await supabase
    .from("product_badges")
    .insert({
      ...badgeData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating product badge:", error);
    return null;
  }

  return data;
}

export async function updateProductBadge(
  id: string,
  badgeData: ProductBadgeUpdate,
): Promise<ProductBadge | null> {
  const { data, error } = await supabase
    .from("product_badges")
    .update({
      ...badgeData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating product badge with id ${id}:`, error);
    return null;
  }

  return data;
}

export async function deleteProductBadge(id: string): Promise<boolean> {
  const { error } = await supabase.from("product_badges").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting product badge with id ${id}:`, error);
    return false;
  }

  return true;
}
