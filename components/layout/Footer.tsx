import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { NAV_LINKS, CONTACT_INFO } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-4xl leading-[1.05] tracking-tight text-ink-foreground sm:text-6xl lg:text-7xl">
          Where Football
          <br />
          <span className="text-primary">Meets Faith</span>
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-10 border-t border-ink-border pt-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Image
              src="/logo/crest-with-banner.png"
              alt="Suhbah Soccer"
              width={160}
              height={48}
              className="h-12 w-auto"
            />
            <p className="mt-4 max-w-sm text-sm text-ink-muted-foreground">
              Developing champions on and off the field through excellence in
              soccer training and character development.
            </p>
            <a
              href={CONTACT_INFO.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink-foreground hover:text-accent"
              aria-label="Suhbah Soccer on Instagram"
            >
              <InstagramIcon className="h-5 w-5" />
              {CONTACT_INFO.instagramHandle}
            </a>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-ink-foreground">
              Navigation
            </h4>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-muted-foreground hover:text-ink-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-ink-foreground">
              Contact
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-ink-muted-foreground">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{CONTACT_INFO.phones.join(" / ")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="hover:text-ink-foreground"
                >
                  {CONTACT_INFO.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{CONTACT_INFO.location}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink-border py-6 sm:flex-row">
          <p className="text-xs text-ink-muted-foreground">
            &copy; {new Date().getFullYear()} Suhbah Soccer. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
