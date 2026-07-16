import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PortableText } from "@portabletext/react";
import { client } from "@/lib/sanity/client";
import { urlFor } from "@/lib/sanity/image";
import { allBlogSlugsQuery, blogPostBySlugQuery } from "@/lib/sanity/queries";
import type { BlogPost } from "@/types";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await client.fetch<{ slug: string }[]>(allBlogSlugsQuery);
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await client.fetch<BlogPost | null>(blogPostBySlugQuery, {
    slug: params.slug,
  });
  if (!post) return { title: "Post Not Found" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await client.fetch<BlogPost | null>(blogPostBySlugQuery, {
    slug: params.slug,
  });

  if (!post) notFound();

  return (
    <article className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          {format(new Date(post.publishedAt), "MMMM d, yyyy")}
        </p>
        <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
          {post.title}
        </h1>
        {post.coverImage && (
          <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl border border-border">
            <Image
              src={urlFor(post.coverImage).width(1200).height(700).url()}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        {post.body && (
          <div className="prose prose-sm mt-10 max-w-none text-foreground prose-headings:font-display">
            <PortableText value={post.body} />
          </div>
        )}
      </div>
    </article>
  );
}
