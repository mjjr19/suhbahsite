import type { Metadata } from "next";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Parent Portal",
};

export default function PortalPage() {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Clock3 className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-display text-4xl tracking-tight text-foreground">
        Parent Portal Launching Soon
      </h1>
      <p className="mt-4 text-muted-foreground">
        Sign in to track registrations and payment status is coming in a future
        update. For now, registration confirmations are sent directly to your
        email.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/programs">View Programs</Link>
      </Button>
    </div>
  );
}
