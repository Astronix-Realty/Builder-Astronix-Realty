import { v2 as cloudinary } from "cloudinary";

// Ensure config is applied if not done globally elsewhere.
// It's safe to call config multiple times.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Parses a Cloudinary URL to extract its public_id and resource_type,
 * then invokes the destroy method to physically remove it from Cloudinary.
 * @param url Full Cloudinary secure_url
 * @returns Object indicating success or failure status
 */
export async function deleteCloudinaryFile(url: string): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    if (!url || typeof url !== "string") {
      return { success: false, error: "No URL provided" };
    }

    let publicId: string | null = null;
    let resourceType: "image" | "video" | "raw" = "image";

    if (url.includes("/raw/upload/")) {
      resourceType = "raw";
    } else if (url.includes("/video/upload/")) {
      resourceType = "video";
    } else {
      resourceType = "image";
    }

    const uploadMarker = "/upload/";
    const uploadIdx = url.indexOf(uploadMarker);
    if (uploadIdx === -1) {
      return { success: false, error: "Not a valid Cloudinary URL" };
    }

    let afterUpload = url.slice(uploadIdx + uploadMarker.length);
    afterUpload = afterUpload.replace(/^v\d+\//, ""); // strip version

    // Cloudinary treats the public_id of raw files WITH their extension, 
    // but for images/videos it's generally WITHOUT the extension unless explicitly told.
    // However, depending on how it was uploaded, the extension might be needed.
    // Our existing implementation strips the extension for images and videos.
    if (resourceType !== "raw") {
      afterUpload = afterUpload.replace(/\.[^/.]+$/, "");
    }

    publicId = decodeURIComponent(afterUpload);

    if (!publicId) {
      return { success: false, error: "Could not extract public_id" };
    }

    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    if (result.result === "ok" || result.result === "not found") {
      return { success: true, result: result.result };
    }

    return { success: false, error: `Deletion failed: ${result.result}` };
  } catch (error: any) {
    console.error(`Error deleting Cloudinary file (${url}):`, error.message);
    return { success: false, error: error.message };
  }
}
