import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { addGalleryItem, getGalleryItems, reorderGalleryItems } from "@/lib/galleryStore";
import { normalizeOptionalGalleryProject } from "@/lib/galleryProjects";
import { convertGalleryImageToWebp } from "@/lib/galleryImageConversion";

export const runtime = "nodejs";

const uploadsDirPath = path.join(process.cwd(), "public", "uploads");

export async function GET() {
  const items = await getGalleryItems();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const architectRaw = formData.get("architect");
  const projectRaw = formData.get("project");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const architect = typeof architectRaw === "string" ? architectRaw.trim() : "";
  const project = normalizeOptionalGalleryProject(projectRaw);
  if (!architect) {
    return NextResponse.json({ error: "Missing architect" }, { status: 400 });
  }

  if (!file.type.toLowerCase().startsWith("image/")) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const image = await convertGalleryImageToWebp(file);
  const filename = `${id}-${Date.now()}${image.extension}`;
  const outputPath = path.join(uploadsDirPath, filename);

  await fs.mkdir(uploadsDirPath, { recursive: true });
  await fs.writeFile(outputPath, image.buffer);

  const src = `/uploads/${filename}`;
  const item = await addGalleryItem({ id, src, architect, project });

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
