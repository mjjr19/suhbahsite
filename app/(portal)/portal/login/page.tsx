"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PortalLoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/portal`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8">
      <h1 className="font-display text-2xl text-foreground">Parent Sign In</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter the email you used to register your child to receive a magic
        sign-in link.
      </p>
      {status === "sent" ? (
        <p className="mt-6 text-sm text-primary">
          Check your email for a sign-in link.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button type="submit" className="w-full" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Send Magic Link"}
          </Button>
          {status === "error" && (
            <p className="text-sm text-destructive">
              Something went wrong. Please try again.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
