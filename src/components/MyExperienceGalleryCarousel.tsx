"use client";

import { CircularGallery, type GalleryItem } from "@/components/ui/circular-gallery-2";

type MyExperienceGalleryCarouselImage = {
  id: string;
  src: string;
  alt: string;
};

type MyExperienceGalleryCarouselProps = {
  images: MyExperienceGalleryCarouselImage[];
};

export function MyExperienceGalleryCarousel({
  images,
}: MyExperienceGalleryCarouselProps) {
  const galleryItems: GalleryItem[] = images.map((image) => ({
    image: image.src,
    text: "",
  }));

  return (
    <div className="myExperienceGalleryOgl">
      <CircularGallery
        items={galleryItems}
        bend={3}
        borderRadius={0.035}
        scrollSpeed={1.85}
        scrollEase={0.035}
        className="myExperienceGalleryOglCanvas"
      />
    </div>
  );
}
