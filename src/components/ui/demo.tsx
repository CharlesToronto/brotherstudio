"use client";

/* eslint-disable @next/next/no-img-element */

import { Carousel } from "@ark-ui/react/carousel";

import { cn } from "@/lib/utils";

type CarouselImage = {
  src: string;
  alt: string;
};

type VerticalCarouselProps = {
  className?: string;
  images: CarouselImage[];
};

export default function VerticalCarousel({ images, className }: VerticalCarouselProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <Carousel.Root
      defaultPage={0}
      slideCount={images.length}
      orientation="vertical"
      loop
      allowMouseDrag
      className={cn(
        "w-[min(48vw,40rem)] max-w-[calc(100vw-5rem)] max-md:w-[min(82vw,27rem)] max-md:max-w-[calc(100vw-3rem)]",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <Carousel.ItemGroup className="h-[min(72svh,40rem)] aspect-[4/5] flex-none overflow-hidden rounded-[8px] max-md:h-[min(68svh,30rem)]">
          {images.map((image, index) => (
            <Carousel.Item key={image.src} index={index}>
              <img
                src={image.src}
                alt={image.alt}
                className="h-full w-full object-cover"
                draggable={false}
              />
            </Carousel.Item>
          ))}
        </Carousel.ItemGroup>

        <Carousel.IndicatorGroup className="flex flex-col items-center justify-center gap-4">
          {images.map((image, index) => (
            <Carousel.Indicator
              key={image.src}
              index={index}
              className="h-14 w-3 rounded-full bg-[#55627a] transition-colors data-[current]:bg-[#5ea0ff]"
            />
          ))}
        </Carousel.IndicatorGroup>
      </div>
    </Carousel.Root>
  );
}
