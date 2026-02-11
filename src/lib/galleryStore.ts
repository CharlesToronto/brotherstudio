import { promises as fs } from "node:fs";
import path from "node:path";

export type GalleryItem = {
  id: string;
  src: string;
  architect: string;
};

type GalleryData = {
  items: GalleryItem[];
};

const galleryFilePath = path.join(process.cwd(), "data", "gallery.json");

const defaultData: GalleryData = {
  items: [
    { id: "01", src: "/gallery/01.svg", architect: "Architect / Studio 01" },
    { id: "02", src: "/gallery/02.svg", architect: "Architect / Studio 02" },
    { id: "03", src: "/gallery/03.svg", architect: "Architect / Studio 03" },
    { id: "04", src: "/gallery/04.svg", architect: "Architect / Studio 04" },
    { id: "05", src: "/gallery/05.svg", architect: "Architect / Studio 05" },
    { id: "06", src: "/gallery/06.svg", architect: "Architect / Studio 06" },
    { id: "07", src: "/gallery/07.svg", architect: "Architect / Studio 07" },
    { id: "08", src: "/gallery/08.svg", architect: "Architect / Studio 08" },
    { id: "09", src: "/gallery/09.svg", architect: "Architect / Studio 09" },
  ],
};

async function ensureGalleryFile() {
  await fs.mkdir(path.dirname(galleryFilePath), { recursive: true });

  try {
    await fs.access(galleryFilePath);
  } catch {
    await fs.writeFile(galleryFilePath, JSON.stringify(defaultData, null, 2) + "\n");
  }
}

async function readGalleryData(): Promise<GalleryData> {
  await ensureGalleryFile();

  try {
    const raw = await fs.readFile(galleryFilePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    if (!parsed || typeof parsed !== "object") return defaultData;

    const items = (parsed as { items?: unknown }).items;
    if (!Array.isArray(items)) return defaultData;

    const normalizedItems: GalleryItem[] = [];
    for (const item of items) {
      const anyItem = item as Partial<GalleryItem>;
      if (
        !anyItem ||
        typeof anyItem.id !== "string" ||
        typeof anyItem.src !== "string" ||
        typeof anyItem.architect !== "string"
      ) {
        continue;
      }

      normalizedItems.push({
        id: anyItem.id,
        src: anyItem.src,
        architect: anyItem.architect,
      });
    }

    return { items: normalizedItems };
  } catch {
    return defaultData;
  }
}

async function writeGalleryData(data: GalleryData) {
  await ensureGalleryFile();
  await fs.writeFile(galleryFilePath, JSON.stringify(data, null, 2) + "\n");
}

export async function getGalleryItems() {
  const data = await readGalleryData();
  return data.items;
}

export async function addGalleryItem(input: Omit<GalleryItem, "id"> & { id?: string }) {
  const data = await readGalleryData();

  const id =
    typeof input.id === "string" && input.id.trim().length > 0
      ? input.id.trim()
      : crypto.randomUUID();

  const item: GalleryItem = {
    id,
    src: input.src,
    architect: input.architect,
  };

  data.items.push(item);
  await writeGalleryData(data);
  return item;
}

export async function updateGalleryItem(
  id: string,
  patch: Partial<Pick<GalleryItem, "src" | "architect">>,
) {
  const data = await readGalleryData();
  const index = data.items.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const current = data.items[index];
  const updated: GalleryItem = {
    ...current,
    ...(typeof patch.src === "string" ? { src: patch.src } : null),
    ...(typeof patch.architect === "string" ? { architect: patch.architect } : null),
  };

  data.items[index] = updated;
  await writeGalleryData(data);
  return updated;
}

export async function deleteGalleryItem(id: string) {
  const data = await readGalleryData();
  const nextItems = data.items.filter((i) => i.id !== id);
  const deleted = nextItems.length !== data.items.length;
  if (!deleted) return false;

  await writeGalleryData({ items: nextItems });
  return true;
}

export async function reorderGalleryItems(order: string[]) {
  const data = await readGalleryData();

  const existingIds = new Set(data.items.map((i) => i.id));
  if (order.length !== data.items.length) {
    throw new Error("Order must include all items");
  }

  const orderIds = new Set(order);
  if (orderIds.size !== order.length) {
    throw new Error("Order contains duplicates");
  }

  for (const id of order) {
    if (!existingIds.has(id)) {
      throw new Error("Order contains unknown item");
    }
  }

  const byId = new Map(data.items.map((item) => [item.id, item] as const));
  const nextItems = order.map((id) => byId.get(id)!);

  await writeGalleryData({ items: nextItems });
  return nextItems;
}
