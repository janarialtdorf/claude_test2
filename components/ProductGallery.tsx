"use client";

// Product page gallery: one large image, plus thumbnails to switch between
// images when there are several. Thumbnails are real buttons (keyboard and
// screen-reader friendly); nothing moves on its own.

import Image from "next/image";
import { useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { copy } from "@/lib/copy";
import type { ProductImage as ProductImageData } from "@/types/product";

export function ProductGallery({
  images,
  name,
  placeholderColor,
}: {
  images: ProductImageData[];
  name: string;
  placeholderColor: string;
}) {
  const [selected, setSelected] = useState(0);
  const current = images[selected] ?? images[0];

  return (
    <div>
      <div className="overflow-hidden rounded-lg">
        <ProductImage
          src={current?.url}
          alt={current?.alt ?? copy.product.placeholderImage(name)}
          name={name}
          placeholderColor={placeholderColor}
          sizes="(min-width: 768px) 540px, 100vw"
          priority
        />
      </div>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2" aria-label={copy.product.galleryLabel}>
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-pressed={index === selected}
                aria-label={copy.product.showImage(index + 1, image.alt)}
                className={`relative block aspect-[4/5] w-full overflow-hidden rounded-md border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 ${
                  index === selected ? "border-stone-900" : "border-transparent hover:border-stone-300"
                }`}
              >
                {/* alt="": the button's label already describes the image */}
                <Image src={image.url} alt="" fill sizes="100px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
