import type { Metadata, Viewport } from "next";
import { StudioClient } from "./StudioClient";

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
