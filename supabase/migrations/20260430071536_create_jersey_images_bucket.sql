-- Create Supabase Storage bucket for jersey images
-- Bucket: jersey-images
-- Public read, authenticated upload to own folder only
-- Path structure: {user_id}/{filename}
-- Allowed types: jpg, jpeg, png, webp
-- Max file size: 5MB (5242880 bytes)

-- Insert the bucket (public = true allows public read via URL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'jersey-images',
  'jersey-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Public read access (anyone can view jersey images)
CREATE POLICY "Public read jersey images"
ON storage.objects FOR SELECT
USING (bucket_id = 'jersey-images');

-- RLS: Authenticated users can upload to their own folder only
-- Path must start with their user_id
CREATE POLICY "Authenticated upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'jersey-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Authenticated users can update their own files
CREATE POLICY "Authenticated update own jersey images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'jersey-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Authenticated users can delete their own files
CREATE POLICY "Authenticated delete own jersey images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'jersey-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
