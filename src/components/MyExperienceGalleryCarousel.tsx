"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const galleryItems: GalleryItem[] = images.map((image) => ({
    image: image.src,
    text: "",
  }));

  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
        return;
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) =>
          current === null ? 0 : (current + 1) % images.length,
        );
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          current === null ? images.length - 1 : (current - 1 + images.length) % images.length,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, images.length]);

  return (
    <>
      <div className="myExperienceGalleryOgl">
        <CircularGallery
          items={galleryItems}
          bend={3}
          borderRadius={0.035}
          scrollSpeed={4.4}
          scrollEase={0.072}
          dragFactor={0.014}
          className="myExperienceGalleryOglCanvas"
          onItemSelect={setActiveIndex}
        />
      </div>

      {activeIndex !== null ? (
        <div
          className="myExperienceGalleryLightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Diaporama galerie"
        >
          <Button
            className="myExperienceGalleryLightboxClose"
            variant="outline"
            size="icon"
            onClick={() => setActiveIndex(null)}
            aria-label="Fermer le diaporama"
          >
            <X className="h-5 w-5" />
          </Button>

          <Button
            className="myExperienceGalleryLightboxArrow myExperienceGalleryLightboxArrowLeft"
            variant="outline"
            size="icon"
            onClick={() => setActiveIndex((activeIndex - 1 + images.length) % images.length)}
            aria-label="Image precedente"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="myExperienceGalleryLightboxStage">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={images[activeIndex].id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="myExperienceGalleryLightboxMedia"
              >
                <Image
                  src={images[activeIndex].src}
                  alt={images[activeIndex].alt}
                  fill
                  sizes="100vw"
                  className="myExperienceGalleryLightboxImage"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <Button
            className="myExperienceGalleryLightboxArrow myExperienceGalleryLightboxArrowRight"
            variant="outline"
            size="icon"
            onClick={() => setActiveIndex((activeIndex + 1) % images.length)}
            aria-label="Image suivante"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      ) : null}
    </>
  );
}
