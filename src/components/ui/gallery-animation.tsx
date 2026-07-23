"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState, type MouseEvent } from "react";

export type ExpandableGalleryItem = {
  image: string;
  title: string;
  description?: string;
  alt?: string;
};

type ExpandableGalleryProps = {
  items: ExpandableGalleryItem[];
  className?: string;
};

export function ExpandableGallery({ items, className = "" }: ExpandableGalleryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedItem = selectedIndex !== null ? items[selectedIndex] : null;

  const getFlexValue = (index: number) => {
    if (hoveredIndex === null) return 1;
    return hoveredIndex === index ? 2.2 : 0.58;
  };

  const closeImage = () => {
    setSelectedIndex(null);
  };

  const goToNext = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % items.length);
  };

  const goToPrev = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + items.length) % items.length);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`expandableGallery ${className}`}>
      <div className="expandableGalleryRail">
        {items.map((item, index) => (
          <motion.button
            key={item.image}
            type="button"
            className="expandableGalleryItem"
            style={{ flex: 1 }}
            animate={{ flex: getFlexValue(index) }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(index)}
            onBlur={() => setHoveredIndex(null)}
            onClick={() => setSelectedIndex(index)}
            aria-label={item.title}
          >
            <Image
              src={item.image}
              alt={item.alt ?? item.title}
              fill
              sizes="(max-width: 900px) 100vw, 24vw"
            />
            <motion.span
              className="expandableGalleryShade"
              initial={{ opacity: 0.28 }}
              animate={{ opacity: hoveredIndex === index ? 0.14 : 0.42 }}
              transition={{ duration: 0.3 }}
            />
            <span className="expandableGalleryCopy">
              <strong>{item.title}</strong>
              {item.description ? <span>{item.description}</span> : null}
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedItem ? (
          <motion.div
            className="expandableGalleryModal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeImage}
            role="dialog"
            aria-modal="true"
            aria-label={selectedItem.title}
          >
            <button
              type="button"
              className="expandableGalleryClose"
              onClick={closeImage}
              aria-label="Close gallery"
            >
              ×
            </button>

            {items.length > 1 ? (
              <button
                type="button"
                className="expandableGalleryNav expandableGalleryNavPrev"
                onClick={goToPrev}
                aria-label="Previous image"
              >
                ‹
              </button>
            ) : null}

            <motion.div
              className="expandableGalleryModalContent"
              onClick={(event) => event.stopPropagation()}
            >
              <motion.div
                key={selectedItem.image}
                className="expandableGalleryModalImage"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src={selectedItem.image}
                  alt={selectedItem.alt ?? selectedItem.title}
                  width={1600}
                  height={1067}
                  sizes="100vw"
                />
              </motion.div>
              <div className="expandableGalleryModalCaption">
                <strong>{selectedItem.title}</strong>
                {selectedItem.description ? <p>{selectedItem.description}</p> : null}
              </div>
            </motion.div>

            {items.length > 1 ? (
              <button
                type="button"
                className="expandableGalleryNav expandableGalleryNavNext"
                onClick={goToNext}
                aria-label="Next image"
              >
                ›
              </button>
            ) : null}

            <div className="expandableGalleryCounter">
              {(selectedIndex ?? 0) + 1} / {items.length}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
