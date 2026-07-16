import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { Reveal } from "@/components/motion/Reveal";
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
          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {posts.map((post, index) => (
              <Reveal key={post._id} delay={Math.min(index, 5) * 0.08}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {post.coverImage ? (
                      <Image
                        src={urlFor(post.coverImage).width(700).height(400).url()}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted text-3xl">
                        📰
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {format(new Date(post.publishedAt), "MMMM d, yyyy")}
                    </p>
                    <h3 className="mt-2 font-display text-xl tracking-tight text-foreground">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mt-14 text-center text-muted-foreground">
            Blog posts will appear here once added in Sanity Studio.
          </p>
        )}
      </div>
    </section>
  );
}
