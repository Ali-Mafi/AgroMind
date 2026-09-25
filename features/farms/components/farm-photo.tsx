import Image, { type StaticImageData } from "next/image";
import headerField from "@/public/images/dashboard/header-field-v2.webp";
import headerOrchard from "@/public/images/dashboard/header-orchard-v2.webp";
import gardenTree from "@/public/images/dashboard/garden-tree-v2.webp";
import corn from "@/public/images/dashboard/crop-corn.webp";
import wheat from "@/public/images/dashboard/crop-wheat.webp";
import rice from "@/public/images/dashboard/crop-rice.webp";
import tomato from "@/public/images/dashboard/crop-tomato.webp";
import field from "@/public/images/dashboard/crop-field.webp";

// Static imports provide content-hashed cache keys and tiny inline previews.
// Importing the metadata does not download all eight photographs.
const photos: Record<string, StaticImageData> = {
  "/images/dashboard/header-field-v2.webp": headerField,
  "/images/dashboard/header-orchard-v2.webp": headerOrchard,
  "/images/dashboard/garden-tree-v2.webp": gardenTree,
  "/images/dashboard/crop-corn.webp": corn,
  "/images/dashboard/crop-wheat.webp": wheat,
  "/images/dashboard/crop-rice.webp": rice,
  "/images/dashboard/crop-tomato.webp": tomato,
  "/images/dashboard/crop-field.webp": field,
};

export const FARM_HEADER_SIZES = "(min-width: 1024px) calc(100vw - 240px), 100vw";
const FARM_CARD_SIZES = "(min-width: 1320px) 1024px, (min-width: 1024px) calc(100vw - 288px), (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)";

export function FarmPhoto({ src, className, sizes = FARM_CARD_SIZES, prominent = false }: {
  src: string;
  className?: string;
  sizes?: string;
  prominent?: boolean;
}) {
  const photo = photos[src];
  if (!photo) return null;
  return (
    <Image
      key={photo.src}
      src={photo}
      alt=""
      aria-hidden="true"
      fill
      sizes={sizes}
      placeholder="blur"
      loading={prominent ? "eager" : "lazy"}
      fetchPriority={prominent ? "high" : "auto"}
      className={className}
      style={{ objectFit: "cover" }}
    />
  );
}
