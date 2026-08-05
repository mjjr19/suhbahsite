import type { Image, PortableTextBlock } from "sanity";

export interface ProgramPricingTier {
  label: string;
  price: number;
  description?: string;
}

export interface Program {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  body?: PortableTextBlock[];
  startDate?: string;
  endDate?: string;
  price: number;
  pricingTiers?: ProgramPricingTier[];
  capacity?: number;
  ageGroup?: string;
  location?: string;
  heroImage?: Image;
  active: boolean;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  excerpt?: string;
  body?: PortableTextBlock[];
  coverImage?: Image;
}

export interface GalleryItem {
  _id: string;
  caption?: string;
  image: Image;
  category?: string;
  order?: number;
}

export interface Coach {
  _id: string;
  name: string;
  role?: string;
  bio?: string;
  photo?: Image;
  order?: number;
}

export interface Testimonial {
  _id: string;
  quote: string;
  authorName: string;
  authorRelation?: string;
  rating?: number;
}
