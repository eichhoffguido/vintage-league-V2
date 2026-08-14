// Client-side image downscale + re-encode so uploads reliably stay under a
// storage bucket's size limit. Always outputs JPEG (simplest way to get
// predictable, lossy-compressible output regardless of the source format).

interface CompressImageOptions {
  maxDimension: number;
  maxBytes: number;
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

export async function compressImage(file: File, { maxDimension, maxBytes }: CompressImageOptions): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Bild konnte nicht verarbeitet werden.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.85;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > maxBytes && quality > 0.35) {
    quality -= 0.15;
    blob = await canvasToBlob(canvas, quality);
  }

  return blob;
}
