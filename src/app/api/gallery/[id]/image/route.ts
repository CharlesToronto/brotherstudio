import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { getGalleryItems, updateGalleryItem } from "@/lib/galleryStore";

export const runtime = "nodejs";

const uploadsDirPath = path.join(process.cwd(), "public", "uploads");

function extensionForFile(file: File) {
  const fromName = path.extname(file.name).toLowerCase();
  if (fromName) return fromName;

  const mime = file.type.toLowerCase();
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  if (mime === "image/svg+xml") return ".svg";
  return ".jpg";
}

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

  const ext = extensionForFile(file);
  const filename = `${id}-${Date.now()}${ext}`;
  const outputPath = path.join(uploadsDirPath, filename);

  await fs.mkdir(uploadsDirPath, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(outputPath, buffer);

  const nextSrc = `/uploads/${filename}`;
  const updated = await updateGalleryItem(id, { src: nextSrc });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const oldUploadPath = pathForUpload(item.src);
  if (oldUploadPath) {
    await fs.unlink(oldUploadPath).catch(() => null);
  }

  return NextResponse.json({ item: updated });
}
