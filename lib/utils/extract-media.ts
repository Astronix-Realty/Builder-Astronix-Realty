/**
 * Recursively extracts all Cloudinary URLs from an object or array.
 * Looks for specific string patterns starting with res.cloudinary.com.
 */
export function extractCloudinaryUrls(obj: any): string[] {
  const urls = new Set<string>();

  function traverse(current: any) {
    if (!current) return;
    
    if (typeof current === "string") {
      if (current.includes("res.cloudinary.com")) {
        urls.add(current);
      }
      return;
    }
    
    if (Array.isArray(current)) {
      for (const item of current) {
        traverse(item);
      }
      return;
    }
    
    if (typeof current === "object") {
      for (const key of Object.keys(current)) {
        traverse(current[key]);
      }
    }
  }

  traverse(obj);
  return Array.from(urls);
}
