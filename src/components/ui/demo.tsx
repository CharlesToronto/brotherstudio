"use client";

/* eslint-disable @next/next/no-img-element */

import { Carousel } from "@ark-ui/react/carousel";
import { ArrowDown, ArrowUp } from "lucide-react";

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
      className={cn("mx-auto max-h-[34rem] w-full max-w-[40rem]", className)}
    >
      <div className="flex items-center gap-4">
        <Carousel.Control className="flex flex-col justify-center gap-3">
          <Carousel.PrevTrigger className="inline-flex h-16 w-11 items-center justify-center rounded-xl bg-[#1f2b40] text-white transition-colors hover:bg-[#273753]">
            <ArrowUp className="h-4 w-4" />
          </Carousel.PrevTrigger>
          <Carousel.NextTrigger className="inline-flex h-16 w-11 items-center justify-center rounded-xl bg-[#1f2b40] text-white transition-colors hover:bg-[#273753]">
            <ArrowDown className="h-4 w-4" />
          </Carousel.NextTrigger>
        </Carousel.Control>

        <Carousel.ItemGroup className="h-[34rem] flex-1 overflow-hidden rounded-[8px]">
          {images.map((image, index) => (
            <Carousel.Item key={image.src} index={index}>
              <img
                src={image.src}
                alt={image.alt}
                className="h-[34rem] w-full object-cover"
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
