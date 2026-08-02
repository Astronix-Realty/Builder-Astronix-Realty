import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file in the browser before uploading.
 * If the file is not an image, it returns the original file.
 */
export async function compressImage(file: File): Promise<File> {
  // Only attempt to compress images
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Configuration for compression
  const options = {
    maxSizeMB: 1, // Compress to max 1MB
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp' // Convert to WebP for better compression, optional but good for web
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    // Convert Blob back to File
    return new File([compressedBlob], file.name, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Return original if compression fails
  }
}
