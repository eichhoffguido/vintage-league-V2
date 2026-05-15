const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY || "";
const TENOR_API_URL = "https://api.tenor.com/v1";

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

export interface TenorResponse {
  results: TenorGif[];
}

/**
 * Search for GIFs on Tenor
 */
export async function searchGifs(query: string, limit: number = 20): Promise<TenorGif[]> {
  if (!TENOR_API_KEY) {
    console.warn("Tenor API key not configured");
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      key: TENOR_API_KEY,
      limit: limit.toString(),
      media_filter: "gif,webm",
    });

    const response = await fetch(`${TENOR_API_URL}/search?${params}`);
    if (!response.ok) {
      throw new Error(`Tenor API error: ${response.statusText}`);
    }

    const data: TenorResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error("Failed to search GIFs:", error);
    return [];
  }
}

/**
 * Get trending GIFs
 */
export async function getTrendingGifs(limit: number = 20): Promise<TenorGif[]> {
  if (!TENOR_API_KEY) {
    console.warn("Tenor API key not configured");
    return [];
  }

  try {
    const params = new URLSearchParams({
      key: TENOR_API_KEY,
      limit: limit.toString(),
      media_filter: "gif,webm",
    });

    const response = await fetch(`${TENOR_API_URL}/trending?${params}`);
    if (!response.ok) {
      throw new Error(`Tenor API error: ${response.statusText}`);
    }

    const data: TenorResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error("Failed to fetch trending GIFs:", error);
    return [];
  }
}
