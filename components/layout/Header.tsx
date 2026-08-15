"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { NAV_LINKS } from "@/lib/constants";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Only the homepage has a full-bleed dark hero directly under the header,
  // so only there can the header safely go transparent before scrolling —
  // every other page keeps the solid header, or its light content would
  // collide with light nav text.
  const transparent = pathname === "/" && !scrolled;

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b backdrop-blur transition-colors duration-300 ${
        transparent
          ? "border-transparent bg-transparent"
          : "border-border bg-background/95 shadow-sm supports-[backdrop-filter]:bg-background/85"
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-300 sm:px-6 lg:px-8 ${
          scrolled ? "h-14" : "h-16"
        }`}
      >
        <Link href="/" className="flex items-center gap-2" aria-label="Suhbah Soccer home">
          <Image
            src="/logo/crest-with-banner.png"
            alt="Suhbah Soccer"
            width={160}
            height={48}
            priority
            className="h-10 w-auto transition-all duration-300"
          />
        </Link>

        <nav className="hidden md:flex md:items-center md:gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`group relative rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                transparent
                  ? "text-white/90 hover:text-white"
                  : "text-foreground/80 hover:text-foreground"
              }`}
            >
              {link.label}
              <span className="absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild className="hidden md:inline-flex">
            <Link href="/programs">Register Now</Link>
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
