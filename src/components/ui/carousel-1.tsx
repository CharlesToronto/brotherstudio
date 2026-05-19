"use client";

/* eslint-disable @next/next/no-img-element */

import { Carousel } from "@ark-ui/react/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type CarouselImage = {
  src: string;
  alt: string;
};

type BasicCarouselProps = {
  className?: string;
  images: CarouselImage[];
};

export default function BasicCarousel({ images, className }: BasicCarouselProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <Carousel.Root
      defaultPage={0}
      slideCount={images.length}
      loop
      allowMouseDrag
      className={cn("mx-auto max-w-md", className)}
    >
      <Carousel.Control className="mb-4 flex items-center justify-between gap-4">
        <Carousel.PrevTrigger className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/12">
          <ChevronLeft className="h-5 w-5" />
        </Carousel.PrevTrigger>
        <Carousel.NextTrigger className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/12">
          <ChevronRight className="h-5 w-5" />
        </Carousel.NextTrigger>
      </Carousel.Control>

      <Carousel.ItemGroup className="overflow-hidden rounded-lg">
        {images.map((image, index) => (
          <Carousel.Item key={image.src} index={index}>
            <img
              src={image.src}
              alt={image.alt}
              className="h-64 w-full object-cover"
              draggable={false}
            />
          </Carousel.Item>
        ))}
      </Carousel.ItemGroup>

      <Carousel.IndicatorGroup className="mt-4 flex items-center justify-center gap-2">
        {images.map((image, index) => (
          <Carousel.Indicator
            key={image.src}
            index={index}
            className="h-2 w-2 rounded-full bg-white/20 transition-colors data-[current]:bg-[#4e8df7]"
          />
        ))}
      </Carousel.IndicatorGroup>
    </Carousel.Root>
  );
}
