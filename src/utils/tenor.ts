const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || "";
const GIPHY_API_URL = "https://api.giphy.com/v1/gifs";

export interface TenorGif {
  id: string;
  title: string;
  media_formats: {
    gif: {
      url: string;
    };
    webm?: {
      url: string;
    };
  };
  tags: string[];
}

interface GiphyGif {
  id: string;
  title: string;
  images: {
    fixed_height: {
      url: string;
    };
  };
  tags?: string[];
}

interface GiphyResponse {
  data: GiphyGif[];
}

/**
 * Transform Giphy response to TenorGif format
 */
function transformGiphyToTenor(gif: GiphyGif): TenorGif {
  return {
    id: gif.id,
    title: gif.title,
    media_formats: {
      gif: {
        url: gif.images.fixed_height.url,
      },
    },
    tags: gif.tags || [],
  };
}

/**
 * Search for GIFs on Giphy
 */
export async function searchGifs(query: string, limit: number = 20): Promise<TenorGif[]> {
  if (!GIPHY_API_KEY) {
    console.warn("Giphy API key not configured");
    return [];
  }

  try {
    const params = new URLSearchParams({
      api_key: GIPHY_API_KEY,
      q: query,
      limit: limit.toString(),
      rating: "g",
    });

    const response = await fetch(`${GIPHY_API_URL}/search?${params}`);
    if (!response.ok) {
      throw new Error(`Giphy API error: ${response.statusText}`);
    }

    const data: GiphyResponse = await response.json();
    return data.data.map(transformGiphyToTenor);
  } catch (error) {
    console.error("Failed to search GIFs:", error);
    return [];
  }
}

/**
 * Get trending GIFs
 */
export async function getTrendingGifs(limit: number = 20): Promise<TenorGif[]> {
  if (!GIPHY_API_KEY) {
    console.warn("Giphy API key not configured");
    return [];
  }

  try {
    const params = new URLSearchParams({
      api_key: GIPHY_API_KEY,
      limit: limit.toString(),
      rating: "g",
    });

    const response = await fetch(`${GIPHY_API_URL}/trending?${params}`);
    if (!response.ok) {
      throw new Error(`Giphy API error: ${response.statusText}`);
    }

    const data: GiphyResponse = await response.json();
    return data.data.map(transformGiphyToTenor);
  } catch (error) {
    console.error("Failed to fetch trending GIFs:", error);
    return [];
  }
}
