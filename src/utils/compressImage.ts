// Client-side image downscale + re-encode so uploads reliably stay under a
// storage bucket's size limit. Always outputs JPEG (simplest way to get
// predictable, lossy-compressible output regardless of the source format).

interface CompressImageOptions {
  maxDimension: number;
  maxBytes: number;
  // Center-crop to a square before resizing. Use for avatars (always
  // displayed in square containers) so portrait/landscape sources never
  // rely on object-fit alone to avoid looking stretched. Aspect ratio is
  // otherwise always preserved when this is off.
  square?: boolean;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Bild konnte nicht verarbeitet werden."))),
      "image/jpeg",
      quality,
    );
  });
}

export async function compressImage(file: File, { maxDimension, maxBytes, square = false }: CompressImageOptions): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Bild konnte nicht verarbeitet werden.");

  if (square) {
    // Center-crop the source to a square, then scale that square down to
    // (at most) maxDimension. Aspect ratio inside the crop is 1:1 by
    // construction, so nothing gets stretched.
    const cropSize = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - cropSize) / 2;
    const sy = (bitmap.height - cropSize) / 2;
    const outputSize = Math.min(maxDimension, cropSize);

    canvas.width = outputSize;
    canvas.height = outputSize;
    ctx.drawImage(bitmap, sx, sy, cropSize, cropSize, 0, 0, outputSize, outputSize);
  } else {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(bitmap, 0, 0, width, height);
  }

  bitmap.close();

  let quality = 0.85;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > maxBytes && quality > 0.35) {
    quality -= 0.15;
    blob = await canvasToBlob(canvas, quality);
  }

  return blob;
}
