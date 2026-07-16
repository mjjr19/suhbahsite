import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { client } from "@/lib/sanity/client";
import { blogPostsQuery } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import type { BlogPost } from "@/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog",
  description: "News and updates from Suhbah Soccer.",
};

export default async function BlogPage() {
  const posts = await client.fetch<BlogPost[]>(blogPostsQuery);

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="News"
          title="Blog"
          description="Updates, announcements, and stories from Suhbah Soccer."
        />
        {posts.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {post.coverImage ? (
                    <Image
                      src={urlFor(post.coverImage).width(700).height(400).url()}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">
                      📰
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(post.publishedAt), "MMMM d, yyyy")}
                  </p>
                  <h3 className="mt-1 font-display text-xl text-foreground">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-12 text-center text-muted-foreground">
            Blog posts will appear here once added in Sanity Studio.
          </p>
        )}
      </div>
    </section>
  );
}
