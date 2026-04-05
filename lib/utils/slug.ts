import { randomBytes } from "crypto";

/**
 * Generates a URL-friendly slug from a string.
 */
export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")        // Replace spaces with -
    .replace(/[^\w-]+/g, "")      // Remove all non-word chars
    .replace(/--+/g, "-")          // Replace multiple - with single -
    .replace(/^-+/, "")            // Trim - from start of text
    .replace(/-+$/, "");           // Trim - from end of text
}

/**
 * Generates a unique slug by appending a high-entropy random suffix.
 * Uses baseSlug + short timestamp + 8 chars of random hex.
 */
export function generateRandomSlug(name: string, prefix: string = ""): string {
  const baseSlug = slugify(name) || "property";
  const timestamp = Date.now().toString().slice(-6); // last 6 digits of timestamp
  const randomSuffix = randomBytes(4).toString("hex"); // 8 chars of hex
  
  const parts = [prefix, baseSlug, timestamp, randomSuffix].filter(Boolean);
  return parts.join("-");
}

/**
 * Generates a high-precision timestamp slug (backup utility).
 */
export function generateTimestampSlug(name: string): string {
  const baseSlug = slugify(name) || "property";
  return `${baseSlug}-${Date.now()}-${randomBytes(2).toString("hex")}`;
}
