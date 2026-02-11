import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { deleteGalleryItem, getGalleryItems, updateGalleryItem } from "@/lib/galleryStore";

export const runtime = "nodejs";

const uploadsDirPath = path.join(process.cwd(), "public", "uploads");

function pathForUpload(src: string) {
  if (!src.startsWith("/uploads/")) return null;
  const relative = src.slice("/uploads/".length);
  if (!relative || relative.includes("..") || path.isAbsolute(relative)) return null;
  return path.join(uploadsDirPath, relative);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as unknown;
  const architect = (body as { architect?: unknown })?.architect;

  if (typeof architect !== "string" || !architect.trim()) {
    return NextResponse.json({ error: "Invalid architect" }, { status: 400 });
  }

  const updated = await updateGalleryItem(id, { architect: architect.trim() });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ item: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const items = await getGalleryItems();
  const item = items.find((i) => i.id === id) ?? null;

  const ok = await deleteGalleryItem(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const uploadPath = item ? pathForUpload(item.src) : null;
  if (uploadPath) {
    await fs.unlink(uploadPath).catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
