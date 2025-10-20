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
export type LibraryImage = {
  id: string;
  url: string;
  name: string;
  size: number;
  uploadedAt: Date;
  Key?: string;
};

// List images from R2 (TETAP PAKAI AWS SDK)
export async function getR2Images(): Promise<LibraryImage[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
    });

    const response = await s3Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }

    return response.Contents.map((object) => {
      const url = `${BASE_URL}/${object.Key}`;
      return {
        Key: object.Key!,
        id: object.ETag!,
        url,
        name: object.Key!,
        size: object.Size!,
        uploadedAt: object.LastModified!,
      };
    });
  } catch (error) {
    console.error("Error listing files:", error);
    throw new Error(`Failed to list images: ${(error as Error).message}`);
  }
}

// Upload a file to R2 via Worker (PAKAI WORKER)
export async function uploadToR2(formData: FormData): Promise<LibraryImage> {
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

    // Return the LibraryImage object
    return {
      id: data.filename,
      Key: data.filename,
      url: `${BASE_URL}/${data.filename}`,
      name: file.name,
      uploadedAt: new Date(),
      size: data.size,
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
): Promise<LibraryImage[]> {
  try {
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    const uploadedImages: LibraryImage[] = [];

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

      uploadedImages.push({
        id: data.filename,
        Key: data.filename,
        url: `${BASE_URL}/${data.filename}`,
        name: file.name,
        uploadedAt: new Date(),
        size: data.size,
      });
    }

    return uploadedImages;
  } catch (error) {
    console.error("Error uploading multiple files:", error);
    throw new Error(`Failed to upload files: ${(error as Error).message}`);
  }
}

// Upload multiple files in parallel via Worker (PAKAI WORKER)
export async function uploadMultipleParallelToR2(
  formData: FormData,
): Promise<LibraryImage[]> {
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

      return {
        id: data.filename,
        Key: data.filename,
        url: `${BASE_URL}/${data.filename}`,
        name: file.name,
        uploadedAt: new Date(),
        size: data.size,
      };
    });

    const uploadedImages = await Promise.all(uploadPromises);

    return uploadedImages;
  } catch (error) {
    console.error("Error uploading multiple files in parallel:", error);
    throw new Error(`Failed to upload files: ${(error as Error).message}`);
  }
}
