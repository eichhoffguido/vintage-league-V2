import { useState, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJerseyImageUpload } from "@/hooks/useJerseyImageUpload";
import { useAuth } from "@/hooks/useAuth";

const MAX_IMAGES = 5;

interface MultiImageUploadProps {
  images: string[];
  onImagesChange: (urls: string[]) => void;
  disabled?: boolean;
}

const MultiImageUpload = ({ images, onImagesChange, disabled }: MultiImageUploadProps) => {
  const { user } = useAuth();
  const { upload, remove } = useJerseyImageUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleSelect = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || images.length >= MAX_IMAGES) return;

    setUploading(true);
    try {
      const result = await upload(file, user.id);
      onImagesChange([...images, result.publicUrl]);
    } catch (error) {
      // Error is already handled in the hook
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = async (index: number) => {
    const url = images[index];
    const newImages = images.filter((_, i) => i !== index);

    // Extract path from URL and remove from storage
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/storage/v1/object/public/jersey-images/");
    if (pathParts.length > 1) {
      const path = pathParts[1];
      try {
        await remove(path);
      } catch (error) {
        console.error("Failed to remove image from storage:", error);
      }
    }

    onImagesChange(newImages);
  };

  const remaining = MAX_IMAGES - images.length;
  const canUpload = !disabled && !uploading && remaining > 0;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, index) => (
            <div key={index} className="relative h-20 w-20 overflow-hidden rounded-sm border border-border">
              <img
                src={url}
                alt={`Jersey image ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => handleRemove(index)}
                disabled={uploading || disabled}
                className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl-sm bg-destructive text-destructive-foreground hover:bg-destructive/80 disabled:opacity-50"
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
      ) : canUpload ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelect}
          disabled={!user || disabled}
          className="text-xs uppercase tracking-wider"
        >
          <ImagePlus className="mr-1 h-3 w-3" />
          Bild hinzufügen ({remaining} übrig)
        </Button>
      ) : null}
    </div>
  );
};

export default MultiImageUpload;
