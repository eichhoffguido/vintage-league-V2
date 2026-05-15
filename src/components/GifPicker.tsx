import { useCallback, useEffect, useState } from "react";
import { searchGifs, getTrendingGifs, TenorGif } from "@/utils/tenor";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GifPickerProps {
  onGifSelect: (gif: TenorGif) => void;
}

const GifPicker = ({ onGifSelect }: GifPickerProps) => {
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load trending GIFs on mount
  useEffect(() => {
    const loadTrending = async () => {
      setLoading(true);
      const results = await getTrendingGifs(30);
      setGifs(results);
      setLoading(false);
    };
    loadTrending();
  }, []);

  // Handle search
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setLoading(true);
        const results = await getTrendingGifs(30);
        setGifs(results);
        setLoading(false);
        return;
      }

      setLoading(true);
      const results = await searchGifs(query);
      setGifs(results);
      setLoading(false);
    },
    []
  );

  const handleGifSelect = useCallback(
    (gif: TenorGif) => {
      onGifSelect(gif);
    },
    [onGifSelect]
  );

  return (
    <div className="w-full space-y-3 p-3">
      <Input
        placeholder="Search GIFs..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="text-sm"
      />

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : gifs.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          No GIFs found
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
          {gifs.map((gif) => (
            <button
              key={gif.id}
              onClick={() => handleGifSelect(gif)}
              className={cn(
                "group relative overflow-hidden rounded-md border border-border transition-all hover:border-primary hover:shadow-md"
              )}
              title={gif.title}
            >
              <img
                src={gif.media_formats.gif.url}
                alt={gif.title}
                className="h-24 w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GifPicker;
