import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Parent Portal Login",
};

export default function PortalLoginPage() {
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="font-display text-3xl text-foreground">
        Parent Portal Launching Soon
      </h1>
      <p className="mt-4 text-muted-foreground">
        Magic-link sign-in for parents is coming in a future update. Reach out
        to us directly if you have questions about an existing registration.
      </p>
      <Button asChild className="mt-8">
        <Link href="/contact">Contact Us</Link>
      </Button>
    </div>
  );
}
