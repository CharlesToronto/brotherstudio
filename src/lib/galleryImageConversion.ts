import sharp from "sharp";

const GALLERY_WEBP_QUALITY = 88;

export async function convertGalleryImageToWebp(file: File) {
  if (!file.type.toLowerCase().startsWith("image/")) {
    throw new Error("Invalid file type");
  }

  const sourceBuffer = Buffer.from(await file.arrayBuffer());
  const webpBuffer = await sharp(sourceBuffer)
    .rotate()
    .webp({
      quality: GALLERY_WEBP_QUALITY,
      effort: 5,
      smartSubsample: true,
    })
    .toBuffer();

  return {
    buffer: webpBuffer,
    extension: ".webp",
  };
}
