"use server";

import { S3Client } from "@aws-sdk/client-s3";
import { ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Initialize the S3 client (untuk list dan delete)
const s3Client = new S3Client({
  region: "auto",
  endpoint: import.meta.env.VITE_R2_URL,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ADMIN_ACCES_KEY_ID!,
    secretAccessKey: import.meta.env.VITE_R2_ADMIN_SECRET_ACCESS_KEY!,
  },
});

// Define the bucket name and URLs
const BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME!;
const BASE_URL = import.meta.env.VITE_R2_BUCKET_URL!;
const WORKER_URL = import.meta.env.VITE_WORKER_URL!; // Worker URL untuk upload

// Types
export type R2ObjectFolder = "images" | "files" | "assets";

export type R2Object = {
  id: string;
  url: string;
  name: string;
  size: number;
  uploadedAt: Date;
  Key: string;
  folder: R2ObjectFolder;
};

// Legacy type alias untuk backward compatibility
export type LibraryImage = R2Object;

// Internal helper function untuk get objects by prefix
async function getR2ObjectsByPrefix(prefix: string): Promise<R2Object[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }

    const objects = response.Contents.map((object) => {
      const url = `${BASE_URL}/${object.Key}`;

      // Determine folder from key
      let folder: R2ObjectFolder = "assets";
      if (object.Key!.startsWith("images/")) {
        folder = "images";
      } else if (object.Key!.startsWith("files/")) {
        folder = "files";
      }

      // Extract filename without folder prefix
      const filename = object.Key!.split("/").pop() || object.Key!;

      // Extract timestamp from filename (assumes format: name-{timestamp}.ext)
      let timestamp = 0;
      const timestampMatch = filename.match(/-(\d{13})\./);
      if (timestampMatch) {
        timestamp = parseInt(timestampMatch[1], 10);
      }

      return {
        Key: object.Key!,
        id: object.ETag!,
        url,
        name: filename,
        size: object.Size!,
        uploadedAt: object.LastModified!,
        folder,
        timestamp, // Add timestamp for sorting
      };
    });

    // Sort by timestamp descending (terbaru dulu)
    // Jika timestamp tidak ada (0), fallback ke LastModified
    objects.sort((a, b) => {
      const timeA = a.timestamp || a.uploadedAt.getTime();
      const timeB = b.timestamp || b.uploadedAt.getTime();
      return timeB - timeA;
    });

    return objects;
  } catch (error) {
    console.error(`Error listing files from ${prefix}:`, error);
    throw new Error(`Failed to list objects: ${(error as Error).message}`);
  }
}

// List images from R2 (hanya dari folder images/)
export async function getR2Images(): Promise<R2Object[]> {
  return getR2ObjectsByPrefix("images/");
}

// List files from R2 (hanya dari folder files/)
export async function getR2Files(): Promise<R2Object[]> {
  return getR2ObjectsByPrefix("files/");
}

// List assets from R2 (hanya dari folder assets/)
export async function getR2Assets(): Promise<R2Object[]> {
  return getR2ObjectsByPrefix("assets/");
}

// List all objects from R2 (semua folder)
export async function getR2AllObjects(): Promise<R2Object[]> {
  return getR2ObjectsByPrefix("");
}

// Upload a file to R2 via Worker (PAKAI WORKER)
export async function uploadToR2(formData: FormData): Promise<R2Object> {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("No file provided");
    }

    // Create new FormData for worker
    const workerFormData = new FormData();
    workerFormData.append("file", file);

    // Upload via worker
    const response = await fetch(`${WORKER_URL}/upload`, {
      method: "POST",
      body: workerFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Upload failed");
    }

    const data = await response.json();

    // Determine folder from response
    let folder: R2ObjectFolder = "assets";
    if (data.folder) {
      if (data.folder.includes("images")) folder = "images";
      else if (data.folder.includes("files")) folder = "files";
    }

    // Extract filename without folder prefix
    const filename = data.filename.split("/").pop() || file.name;

    // Return the R2Object
    return {
      id: data.filename,
      Key: data.filename,
      url: `${BASE_URL}/${data.filename}`,
      name: filename,
      uploadedAt: new Date(),
      size: data.size,
      folder,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error(`Failed to upload file: ${(error as Error).message}`);
  }
}

// Delete a file from R2 (TETAP PAKAI AWS SDK)
export async function deleteFromR2(
  key: string,
): Promise<{ success: boolean; message: string }> {
  try {
    if (!key) {
      throw new Error("No file key provided");
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return {
      success: true,
      message: "File deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting file:", error);
    return {
      success: false,
      message: `Failed to delete file: ${(error as Error).message}`,
    };
  }
}

// Upload multiple files via Worker - Sequential (PAKAI WORKER)
export async function uploadMultipleToR2(
  formData: FormData,
): Promise<R2Object[]> {
  try {
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    const uploadedObjects: R2Object[] = [];

    // Upload each file sequentially via worker
    for (const file of files) {
      const singleFormData = new FormData();
      singleFormData.append("file", file);

      const response = await fetch(`${WORKER_URL}/upload`, {
        method: "POST",
        body: singleFormData,
      });

      if (!response.ok) {
        console.error(`Failed to upload ${file.name}`);
        continue; // Skip failed uploads
      }

      const data = await response.json();

      // Determine folder from response
      let folder: R2ObjectFolder = "assets";
      if (data.folder) {
        if (data.folder.includes("images")) folder = "images";
        else if (data.folder.includes("files")) folder = "files";
      }

      // Extract filename without folder prefix
      const filename = data.filename.split("/").pop() || file.name;

      uploadedObjects.push({
        id: data.filename,
        Key: data.filename,
        url: `${BASE_URL}/${data.filename}`,
        name: filename,
        uploadedAt: new Date(),
        size: data.size,
        folder,
      });
    }

    return uploadedObjects;
  } catch (error) {
    console.error("Error uploading multiple files:", error);
    throw new Error(`Failed to upload files: ${(error as Error).message}`);
  }
}

// Upload multiple files in parallel via Worker (PAKAI WORKER)
export async function uploadMultipleParallelToR2(
  formData: FormData,
): Promise<R2Object[]> {
  try {
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    // Upload all files in parallel via worker
    const uploadPromises = files.map(async (file) => {
      const singleFormData = new FormData();
      singleFormData.append("file", file);

      const response = await fetch(`${WORKER_URL}/upload`, {
        method: "POST",
        body: singleFormData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }

      const data = await response.json();

      // Determine folder from response
      let folder: R2ObjectFolder = "assets";
      if (data.folder) {
        if (data.folder.includes("images")) folder = "images";
        else if (data.folder.includes("files")) folder = "files";
      }

      // Extract filename without folder prefix
      const filename = data.filename.split("/").pop() || file.name;

      return {
        id: data.filename,
        Key: data.filename,
        url: `${BASE_URL}/${data.filename}`,
        name: filename,
        uploadedAt: new Date(),
        size: data.size,
        folder,
      };
    });

    const uploadedObjects = await Promise.all(uploadPromises);

    return uploadedObjects;
  } catch (error) {
    console.error("Error uploading multiple files in parallel:", error);
    throw new Error(`Failed to upload files: ${(error as Error).message}`);
  }
}
