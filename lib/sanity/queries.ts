import { groq } from "next-sanity";

export const activeProgramsQuery = groq`
  *[_type == "program" && active == true] | order(startDate asc) {
    _id,
    title,
    "slug": slug.current,
    summary,
    startDate,
    endDate,
    price,
    pricingTiers[]{label, price, description},
    capacity,
    ageGroup,
    location,
    heroImage,
    active
  }
`;

export const programBySlugQuery = groq`
  *[_type == "program" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    summary,
    body,
    startDate,
    endDate,
    price,
    pricingTiers[]{label, price, description},
    capacity,
    ageGroup,
    location,
    heroImage,
    active
  }
`;

export const allProgramSlugsQuery = groq`
  *[_type == "program" && defined(slug.current)] {
    "slug": slug.current
  }
`;

export const coachesQuery = groq`
  *[_type == "coach"] | order(order asc) {
    _id,
    name,
    role,
    bio,
    photo,
    order
  }
`;

export const testimonialsQuery = groq`
  *[_type == "testimonial"] | order(_createdAt desc) {
    _id,
    quote,
    authorName,
    authorRelation,
    rating
  }
`;

export const galleryItemsQuery = groq`
  *[_type == "galleryItem"] | order(order asc) {
    _id,
    caption,
    image,
    category,
    order
  }
`;

export const blogPostsQuery = groq`
  *[_type == "blogPost"] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    coverImage
  }
`;

export const blogPostBySlugQuery = groq`
  *[_type == "blogPost" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    body,
    coverImage
  }
`;

export const allBlogSlugsQuery = groq`
  *[_type == "blogPost" && defined(slug.current)] {
    "slug": slug.current
  }
`;
