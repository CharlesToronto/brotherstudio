import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { getGalleryItems, updateGalleryItem } from "@/lib/galleryStore";
import { convertGalleryImageToWebp } from "@/lib/galleryImageConversion";

export const runtime = "nodejs";

const uploadsDirPath = path.join(process.cwd(), "public", "uploads");

function pathForUpload(src: string) {
  if (!src.startsWith("/uploads/")) return null;
  const relative = src.slice("/uploads/".length);
  if (!relative || relative.includes("..") || path.isAbsolute(relative)) return null;
  return path.join(uploadsDirPath, relative);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const items = await getGalleryItems();
  const item = items.find((i) => i.id === id) ?? null;
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!file.type.toLowerCase().startsWith("image/")) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const image = await convertGalleryImageToWebp(file);
  const filename = `${id}-${Date.now()}${image.extension}`;
  const outputPath = path.join(uploadsDirPath, filename);

  await fs.mkdir(uploadsDirPath, { recursive: true });
  await fs.writeFile(outputPath, image.buffer);

  const nextSrc = `/uploads/${filename}`;
  const updated = await updateGalleryItem(id, { src: nextSrc });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const oldUploadPath = pathForUpload(item.src);
  if (oldUploadPath) {
    await fs.unlink(oldUploadPath).catch(() => null);
  }

  return NextResponse.json({ item: updated });
}
