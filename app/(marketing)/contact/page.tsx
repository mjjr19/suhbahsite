import type { Metadata } from "next";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { ContactForm } from "@/components/sections/ContactForm";
import { CONTACT_INFO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Suhbah Soccer.",
};

export default function ContactPage() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Contact"
          title="Get in Touch"
          description="Ready to join Suhbah Soccer? Reach out today!"
        />

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Location</h3>
                <p className="text-sm text-muted-foreground">
                  {CONTACT_INFO.location}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Phone</h3>
                <p className="text-sm text-muted-foreground">
                  {CONTACT_INFO.phones.join(" / ")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Email</h3>
                <p className="text-sm text-muted-foreground">
                  {CONTACT_INFO.email}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Camp Sessions</h3>
                <p className="text-sm text-muted-foreground">
                  {CONTACT_INFO.sessionHours}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
