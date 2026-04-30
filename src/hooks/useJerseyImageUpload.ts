import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'jersey-images';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface UploadResult {
  publicUrl: string;
  path: string;
}

export interface UseJerseyImageUploadReturn {
  upload: (file: File, userId: string) => Promise<UploadResult>;
  remove: (path: string) => Promise<void>;
  isUploading: boolean;
  error: string | null;
}

export function useJerseyImageUpload(): UseJerseyImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File, userId: string): Promise<UploadResult> => {
    setError(null);

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      const msg = 'Invalid file type. Allowed: JPG, PNG, WebP.';
      setError(msg);
      throw new Error(msg);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const msg = 'File too large. Maximum size is 5MB.';
      setError(msg);
      throw new Error(msg);
    }

    setIsUploading(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `${userId}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

      return { publicUrl: data.publicUrl, path };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      setError(msg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const remove = async (path: string): Promise<void> => {
    setError(null);
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([path]);
    if (removeError) {
      setError(removeError.message);
      throw removeError;
    }
  };

  return { upload, remove, isUploading, error };
}
