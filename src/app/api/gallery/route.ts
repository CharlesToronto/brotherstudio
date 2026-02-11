import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { addGalleryItem, getGalleryItems, reorderGalleryItems } from "@/lib/galleryStore";

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

export async function GET() {
  const items = await getGalleryItems();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const architectRaw = formData.get("architect");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const architect = typeof architectRaw === "string" ? architectRaw.trim() : "";
  if (!architect) {
    return NextResponse.json({ error: "Missing architect" }, { status: 400 });
  }

  if (!file.type.toLowerCase().startsWith("image/")) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const ext = extensionForFile(file);
  const filename = `${id}-${Date.now()}${ext}`;
  const outputPath = path.join(uploadsDirPath, filename);

  await fs.mkdir(uploadsDirPath, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(outputPath, buffer);

  const src = `/uploads/${filename}`;
  const item = await addGalleryItem({ id, src, architect });

  return NextResponse.json({ item }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;
  const order = (body as { order?: unknown })?.order;

  if (!Array.isArray(order) || order.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }

  try {
    const items = await reorderGalleryItems(order);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reorder" },
      { status: 400 },
    );
  }
}
