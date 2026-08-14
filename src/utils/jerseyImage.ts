interface JerseyImageSource {
  image_url?: string | null;
  image_urls?: string[] | null;
}

// New jerseys write photos to the image_urls array only; image_url is the
// legacy single-image column some older rows still rely on. Every card/list
// that shows one representative photo should read through this helper
// instead of jersey.image_url directly, or it silently misses newer jerseys.
export function getPrimaryImage(jersey: JerseyImageSource): string | null {
  if (jersey.image_urls && jersey.image_urls.length > 0) return jersey.image_urls[0];
  return jersey.image_url ?? null;
}
