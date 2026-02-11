import { Gallery } from "@/components/Gallery";
import { getGalleryItems } from "@/lib/galleryStore";

export const dynamic = "force-dynamic";

export default async function Home() {
  const items = await getGalleryItems();
  return (
    <main className="siteMain">
      <Gallery items={items} />
    </main>
  );
}
