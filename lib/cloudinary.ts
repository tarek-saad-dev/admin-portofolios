import { v2 as cloudinary, UploadApiOptions } from "cloudinary";

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload an image to Cloudinary
 * @param file - File path or base64 data URI
 * @param folder - Cloudinary folder to upload to (default: 'gd-projects')
 * @param publicId - Optional custom public ID
 * @returns Upload result with URL and metadata
 */
export async function uploadToCloudinary(
  file: string,
  folder: string = "gd-projects",
  publicId?: string,
) {
  try {
    const uploadOptions: UploadApiOptions = {
      folder,
      resource_type: "auto",
      quality: "auto:good",
      fetch_format: "auto",
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    const result = await cloudinary.uploader.upload(file, uploadOptions);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resource_type,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to upload image to Cloudinary",
    );
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Deletion result
 */
export async function deleteFromCloudinary(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === "ok",
      result: result.result,
    };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to delete image from Cloudinary",
    );
  }
}

/**
 * Upload multiple images to Cloudinary
 * @param files - Array of file paths or base64 data URIs
 * @param folder - Cloudinary folder to upload to
 * @returns Array of upload results
 */
export async function uploadMultipleToCloudinary(
  files: string[],
  folder: string = "gd-projects",
) {
  try {
    const uploadPromises = files.map((file) =>
      uploadToCloudinary(file, folder),
    );
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("Cloudinary multiple upload error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to upload images to Cloudinary",
    );
  }
}

/**
 * Generate a Cloudinary transformation URL
 * @param publicId - The public ID of the image
 * @param transformations - Cloudinary transformation options
 * @returns Transformed image URL
 */
export function getTransformedUrl(
  publicId: string,
  transformations: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {},
) {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations,
  });
}

export default cloudinary;
