import createImageUrlBuilder from "@sanity/image-url";
import type { Image } from "sanity";
import { projectId, dataset } from "./client";

const imageBuilder = createImageUrlBuilder({ projectId, dataset });

export function urlFor(source: Image) {
  return imageBuilder.image(source);
}
