-- Create Supabase Storage bucket for user profile avatars
-- Bucket: avatars
-- Public read, authenticated upload to own path only
-- Path structure: {user_id}/avatar.{ext} (e.g. {user_id}/avatar.jpg)
-- Allowed types: jpg, jpeg, png, webp
-- Max file size: 2MB (2097152 bytes)

-- Insert the bucket (public = true allows public read via URL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Public read access (anyone can view avatar images)
CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- RLS: Authenticated users can upload to their own folder only
-- Path must start with their user_id (e.g. {user_id}/avatar.jpg)
CREATE POLICY "Authenticated upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Authenticated users can update (replace) their own avatar
CREATE POLICY "Authenticated update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Authenticated users can delete their own avatar
CREATE POLICY "Authenticated delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
