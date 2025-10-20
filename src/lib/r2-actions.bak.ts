"use server";

import { S3Client } from "@aws-sdk/client-s3";
import {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
// import { v4 as uuidv4 } from "uuid";
// import { revalidatePath } from "next/cache";

// Initialize the S3 client
const s3Client = new S3Client({
  region: "auto",
  endpoint: import.meta.env.VITE_R2_URL,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ADMIN_ACCES_KEY_ID!,
    secretAccessKey: import.meta.env.VITE_R2_ADMIN_SECRET_ACCESS_KEY!,
  },
});

// Define the bucket name
const BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME!;
const BASE_URL = import.meta.env.VITE_R2_BUCKET_URL!;

// Types
export type LibraryImage = {
  id: string;
  url: string;
  name: string;
  size: number;
  uploadedAt: Date;
  Key?: string;
};

// List images from R2
export async function getR2Images(): Promise<LibraryImage[]> {
  try {
    // List objects in the bucket
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
    });

    const response = await s3Client.send(command);

    // If no objects found, return empty array
    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }

    // Map the objects to LibraryImage objects
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

// Upload a file to R2
export async function uploadToR2(formData: FormData): Promise<LibraryImage> {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("No file provided");
    }

    // Read the file as an ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Generate a unique key for the file
    // Use the original file extension if available
    const fileExtension = file.name.split(".").pop() || "";
    const fileName = file.name;

    // Determine the folder based on file type (optional)
    // let folder = "images";
    // if (file.type.startsWith("image/")) {
    //   // You can further categorize by dimensions if needed
    //   if (file.name.toLowerCase().includes("banner")) {
    //     folder = "images/banners";
    //   } else if (file.name.toLowerCase().includes("logo")) {
    //     folder = "images/logos";
    //   } else {
    //     folder = "images/general";
    //   }
    // }

    // Create the full key (path) for the file
    const key = fileName;

    // Upload the file to R2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type,
      // You can add more metadata if needed
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    // Construct the public URL for the uploaded file
    const fileUrl = `${BASE_URL}/${key}`;

    // Determine dimensions based on file type or name
    // let dimensions = { width: 800, height: 600 }; // Default dimensions

    // if (file.name.toLowerCase().includes("banner")) {
    //   dimensions = { width: 1200, height: 600 };
    // } else if (file.name.toLowerCase().includes("logo")) {
    //   dimensions = { width: 200, height: 200 };
    // }

    // Revalidate the path to update the image list
    // revalidatePath("/admin");

    // Return the LibraryImage object
    return {
      id: key,
      url: fileUrl,
      name: file.name,
      uploadedAt: new Date(),
      size: file.size,
      Key: key,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error(`Failed to upload file: ${(error as Error).message}`);
  }
}

// Delete a file from R2
export async function deleteFromR2(
  key: string,
): Promise<{ success: boolean; message: string }> {
  try {
    if (!key) {
      throw new Error("No file key provided");
    }

    // Delete the file from R2
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    // Revalidate the path to update the image list
    // revalidatePath("/admin");

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

// Upload multiple files to R2 - NEW FUNCTION
export async function uploadMultipleToR2(
  formData: FormData,
): Promise<LibraryImage[]> {
  try {
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    const uploadedImages: LibraryImage[] = [];

    // import.meta each file sequentially
    for (const file of files) {
      // Read the file as an ArrayBuffer
      const fileBuffer = await file.arrayBuffer();

      // Use the original filename
      const key = file.name;

      // Upload the file to R2
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: Buffer.from(fileBuffer),
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(command);

      // Construct the public URL for the uploaded file
      const fileUrl = `${BASE_URL}/${key}`;

      // Add to the result array
      uploadedImages.push({
        id: key,
        url: fileUrl,
        name: file.name,
        uploadedAt: new Date(),
        size: file.size,
        Key: key,
      });
    }

    // Revalidate the path to update the image list
    // revalidatePath("/admin");

    return uploadedImages;
  } catch (error) {
    console.error("Error uploading multiple files:", error);
    throw new Error(`Failed to upload files: ${(error as Error).message}`);
  }
}

// Upload multiple files in parallel - ALTERNATIVE APPROACH
export async function uploadMultipleParallelToR2(
  formData: FormData,
): Promise<LibraryImage[]> {
  try {
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    // import.meta all files in parallel with Promise.all
    const uploadPromises = files.map(async (file) => {
      const fileBuffer = await file.arrayBuffer();
      const key = file.name;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: Buffer.from(fileBuffer),
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(command);

      const fileUrl = `${BASE_URL}/${key}`;

      return {
        id: key,
        url: fileUrl,
        name: file.name,
        uploadedAt: new Date(),
        size: file.size,
        Key: key,
      };
    });

    // Wait for all uploads to complete
    const uploadedImages = await Promise.all(uploadPromises);

    // Revalidate the path to update the image list
    // revalidatePath("/admin");

    return uploadedImages;
  } catch (error) {
    console.error("Error uploading multiple files in parallel:", error);
    throw new Error(`Failed to upload files: ${(error as Error).message}`);
  }
}
