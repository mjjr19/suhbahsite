import Link from "next/link";
import Image from "next/image";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Suhbah Soccer home">
            <Image
              src="/logo/crest-with-banner.png"
              alt="Suhbah Soccer"
              width={160}
              height={48}
              className="h-11 w-auto"
            />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        {children}
      </main>
    </div>
  );
}
