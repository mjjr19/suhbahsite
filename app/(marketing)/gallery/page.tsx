import type { Metadata } from "next";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { GalleryGrid } from "@/components/sections/GalleryGrid";
import { client } from "@/lib/sanity/client";
import { galleryItemsQuery } from "@/lib/sanity/queries";
import type { GalleryItem } from "@/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos and highlights from Suhbah Soccer camps and sessions.",
};

export default async function GalleryPage() {
  const items = await client.fetch<GalleryItem[]>(galleryItemsQuery);

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Moments"
          title="Gallery"
          description="Photos and highlights from our camps and training sessions."
        />
        <div className="mt-14">
          {items.length > 0 ? (
            <GalleryGrid items={items} />
          ) : (
            <p className="text-center text-muted-foreground">
              Gallery photos will appear here once added in Sanity Studio.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
