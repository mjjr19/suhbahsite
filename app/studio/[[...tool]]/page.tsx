import type { Metadata, Viewport } from "next";
import nextDynamic from "next/dynamic";

const StudioClient = nextDynamic(
  () => import("./StudioClient").then((mod) => mod.StudioClient),
  { ssr: false },
);

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suhbah Soccer Studio",
  robots: "noindex",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function StudioPage() {
  return <StudioClient />;
}
