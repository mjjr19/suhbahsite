import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Parent Portal",
};

export default function PortalPage() {
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="font-display text-3xl text-foreground">
        Parent Portal Launching Soon
      </h1>
      <p className="mt-4 text-muted-foreground">
        Sign in to track registrations and payment status is coming in a future
        update. For now, registration confirmations are sent directly to your
        email.
      </p>
      <Button asChild className="mt-8">
        <Link href="/programs">View Programs</Link>
      </Button>
    </div>
  );
}
