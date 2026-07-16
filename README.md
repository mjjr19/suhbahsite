# Suhbah Soccer

Marketing + registration site for Suhbah Soccer — "where football meets faith."
Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui, with Sanity as
the CMS, Supabase for registration data, Stripe for payments, and Resend for
transactional email.

The old static site has been moved to [`legacy-static/`](legacy-static/) for
reference. Raw source photos/videos/PDFs not yet wired into the new site live
in `local-media/` and `public/`.

## Stack

- **Framework**: Next.js 14 (App Router), TypeScript
- **Styling**: Tailwind CSS v3 + shadcn/ui (Radix-based, classic HSL theme)
- **CMS**: Sanity Studio, embedded at `/studio`
- **Database + Auth**: Supabase (Postgres + Row Level Security)
- **Payments**: Stripe Checkout + webhooks
- **Email**: Resend
- **Hosting**: Vercel

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in the values, see below
npm run dev
```

The site builds and runs with an empty `.env.local` — pages render an
"add content in Sanity Studio" empty state instead of crashing, and API
routes return an error until their provider is configured. Nothing looks
"real" (programs, coaches, testimonials, payments, email) until you set up
the four accounts below.

## Setting up each service

### 1. Sanity (CMS)

1. Create a free project at [sanity.io/manage](https://www.sanity.io/manage).
2. When prompted for a dataset, choose **production**, visibility **Public**
   (public read access — no API token needed for the site to fetch content).
3. Copy the **Project ID** into `NEXT_PUBLIC_SANITY_PROJECT_ID`.
4. `NEXT_PUBLIC_SANITY_DATASET` should match the dataset name (`production`).
5. `SANITY_API_TOKEN` is optional for Phase 1 (only needed later for draft
   previews or scripted writes) — leave blank for now.
6. Run `npm run dev`, visit `/studio`, and log in with your Sanity account.
   The schemas (`program`, `blogPost`, `galleryItem`, `coach`, `testimonial`)
   are already defined in [`sanity/schemaTypes`](sanity/schemaTypes) — no
   separate schema deploy step is needed, they load from this repo.
7. Add real content: the 3 coach bios/photos, testimonials, and program
   details from the old site are documented in this repo's git history and
   `legacy-static/` — copy them in, or add your own.

### 2. Supabase (database + future parent auth)

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In **Project Settings → API**, copy the Project URL and keys into
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` (service role key is server-only — never
   expose it to the browser).
3. In the SQL Editor, run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   to create the `players` / `registrations` tables and their Row Level
   Security policies.
4. Nothing else is required for Phase 1 — registration is guest checkout, so
   parents don't sign in yet. The Stripe webhook creates a matching Supabase
   Auth user by email behind the scenes, so Phase 2's magic-link login will
   already be linked to their existing registrations.

### 3. Stripe (payments)

1. Create/log into a [Stripe](https://dashboard.stripe.com) account and stay
   in **test mode** while developing.
2. Copy the test **Secret key** into `STRIPE_SECRET_KEY` and the
   **Publishable key** into `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Install the [Stripe CLI](https://docs.stripe.com/stripe-cli) and forward
   webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the `whsec_...` value it prints into `STRIPE_WEBHOOK_SECRET`.
4. In production (Vercel), add a webhook endpoint in the Stripe Dashboard
   pointing to `https://yourdomain.com/api/stripe/webhook`, subscribed to the
   `checkout.session.completed` event, and use its signing secret instead.

### 4. Resend (email)

1. Create an account at [resend.com](https://resend.com) and copy an API key
   into `RESEND_API_KEY`.
2. `RESEND_FROM_EMAIL` can stay as the shared Resend sandbox sender
   (`onboarding@resend.dev`) for testing. Verify your own domain in Resend
   before going live so mail sends from `@suhbahsoccer.com` (or similar).
3. `CONTACT_NOTIFICATIONS_EMAIL` is where the contact form is delivered
   (defaults to `suhbahsoccer@gmail.com`).

## Testing a full registration end-to-end

1. Add at least one `program` document in `/studio` with `active` checked.
2. With `stripe listen` running (see above), go to `/programs`, open the
   program, and submit the registration form.
3. Complete checkout with a [Stripe test card](https://docs.stripe.com/testing)
   (`4242 4242 4242 4242`, any future expiry/CVC).
4. You should land on `/programs/success`, see a `players`/`registrations`
   row appear in Supabase, and receive a confirmation email (check the
   Resend dashboard logs if it doesn't arrive).

## Project structure

```
app/(marketing)/   Public site: home, about, programs, coaches, gallery, blog, contact
app/(portal)/      Parent portal placeholder routes (full auth is Phase 2)
app/api/           Stripe checkout/webhook, contact form
app/studio/        Embedded Sanity Studio (not in public nav)
components/ui/     shadcn/ui primitives
components/layout/ Header, Footer, MobileNav
components/sections/ Hero, ProgramCard, CoachCard, TestimonialCarousel, etc.
lib/               Sanity, Supabase, Stripe, and Resend clients/helpers
sanity/            Studio config + content schemas
supabase/migrations/ SQL schema + RLS policies
types/             Shared TypeScript types for Sanity content
```

## Roadmap

- **Phase 1 (this build)**: marketing site + guest-checkout registration —
  done.
- **Phase 2**: Supabase magic-link auth, `/portal` dashboard showing a
  parent's registrations and payment status.
- **Phase 3**: rosters, schedules, richer portal (messaging, waivers, player
  progress) — not started.
