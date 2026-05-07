import { supabase } from "@/integrations/supabase/client";

const BUCKET = "jersey-images";

/**
 * Construct a full Supabase image URL from a relative path or return as-is if already a full URL.
 * @param imageUrl - Either a relative path (e.g., "userId/filename.jpg") or a full URL
 * @returns Full public URL to the image in Supabase storage
 */
export function getImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;

  // If already a full URL (starts with http), return as-is
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // If it's a relative path, construct the full URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(imageUrl);
  return data.publicUrl;
}
