import type { Metadata } from "next";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { ContactForm } from "@/components/sections/ContactForm";
import { Reveal } from "@/components/motion/Reveal";
import { CONTACT_INFO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Suhbah Soccer.",
};

const details = [
  { icon: MapPin, title: "Location", value: CONTACT_INFO.location },
  { icon: Phone, title: "Phone", value: CONTACT_INFO.phones.join(" / ") },
  { icon: Mail, title: "Email", value: CONTACT_INFO.email },
  { icon: Clock, title: "Camp Sessions", value: CONTACT_INFO.sessionHours },
];

export default function ContactPage() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Contact"
          title="Get in Touch"
          description="Ready to join Suhbah Soccer? Reach out today!"
        />

        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            {details.map((detail, index) => (
              <Reveal key={detail.title} delay={index * 0.08} className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <detail.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{detail.title}</h3>
                  <p className="text-sm text-muted-foreground">{detail.value}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-primary to-accent" />
            <div className="p-6">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
