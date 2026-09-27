import { useState, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (urls: string[]) => void;
}

const ImageUploader = ({ images, onImagesChange }: ImageUploaderProps) => {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleSelect = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      return;
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

    setUploading(true);
    setProgress(0);

    const { error } = await supabase.storage
      .from("forum-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    setUploading(false);
    setProgress(0);

    if (error) {
      return;
    }

    const { data: urlData } = supabase.storage
      .from("forum-images")
      .getPublicUrl(filePath);

    if (urlData) {
      onImagesChange([...images, urlData.publicUrl]);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const url = images[index];
    onImagesChange(images.filter((_, i) => i !== index));

    const pathMatch = url.match(/forum-images\/(.+)/);
    if (pathMatch) {
      supabase.storage.from("forum-images").remove([pathMatch[1]]);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      const hasFiles = e.dataTransfer.types.includes("Files");
      setDragActive(hasFiles);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0 || !user) return;

    for (let i = 0; i < Math.min(files.length, MAX_IMAGES - images.length); i++) {
      const file = files[i];
      if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
        continue;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

      setUploading(true);
      setProgress(0);

      const { error } = await supabase.storage
        .from("forum-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      setUploading(false);
      setProgress(0);

      if (error) {
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("forum-images")
        .getPublicUrl(filePath);

      if (urlData) {
        onImagesChange([...images, urlData.publicUrl]);
      }
    }
  };

  const remaining = MAX_IMAGES - images.length;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, index) => (
            <div key={index} className="relative h-16 w-16 overflow-hidden border-2 border-nero">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                aria-label="Bild entfernen"
                onClick={() => handleRemove(index)}
                className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center bg-nero text-avorio hover:bg-rosso"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {uploading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Upload läuft...
        </div>
      ) : remaining > 0 ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border border-dashed p-1 transition-colors ${
            dragActive ? "border-verde bg-verde/5" : "border-nero"
          }`}
        >
          <Button
            type="button"
            variant="outline"
            onClick={handleSelect}
            disabled={!user}
            className="w-full"
          >
            <ImagePlus className="mr-1 h-3 w-3" />
            Bild hinzufügen ({remaining} übrig)
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default ImageUploader;
