import Image from "next/image";
import { ProductPlaceholder } from "@/components/ProductPlaceholder";

// Shows a product image if there is one, otherwise the coloured placeholder.
// Always the same 4:5 shape, so pages don't jump around while images load.
//
// `alt`: pass "" when the product name is already shown right next to the
// image (e.g. in a card link), so screen readers don't read it twice.
export function ProductImage({
  src,
  alt,
  name,
  placeholderColor,
  sizes,
  priority = false,
  showPlaceholderLabel = true,
}: {
  src: string | null | undefined;
  alt: string;
  name: string;
  placeholderColor: string;
  // Tells the browser how wide the image is shown, so it downloads a
  // suitably small version (e.g. "(min-width: 1024px) 25vw, 50vw").
  sizes: string;
  priority?: boolean;
  showPlaceholderLabel?: boolean;
}) {
  if (!src) {
    return (
      <ProductPlaceholder
        name={name}
        color={placeholderColor}
        decorative={alt === ""}
        showLabel={showPlaceholderLabel}
      />
    );
  }

  return (
    <div className="relative aspect-[4/5] w-full bg-stone-100">
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
