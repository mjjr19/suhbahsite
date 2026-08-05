# Suhbah Soccer — Project Overview

This document is a complete snapshot of the Suhbah Soccer website: what it is, how it's built, what's live, and what's still open. It's written to give a new conversation (human or AI) full context without needing to read the codebase first.

## What this is

Suhbah Soccer ("where football meets faith") is a youth soccer camp/training program based in Redmond, WA, part of Suhbah Institute, a Houston-based Islamic community organization. The site is a marketing + registration platform: parents browse programs, register a player, and pay online; staff manage all content themselves without touching code.

This replaced an older static HTML site (preserved in `legacy-static/` for reference — it had no CMS, no payments, and registration went through an external Google Form).

## Live URLs

- **Production**: https://suhbahsoccer.com (custom domain, DNS + SSL fully configured on Vercel)
- Also reachable at: https://suhbahsite.vercel.app
- **CMS**: https://suhbahsoccer.com/studio (Sanity Studio, not linked in public nav)
- **GitHub**: `mjjr19/suhbahsite` on `main` — Vercel auto-deploys every push

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS v3 + shadcn/ui (Radix-based primitives) |
| Motion | Framer Motion (scroll reveals, staggered hero entrance, animated stat counters) |
| CMS | Sanity.io, Studio embedded at `/studio` |
| Database | Supabase (Postgres + Row Level Security) |
| Payments | Stripe Checkout + webhooks |
| Email | Resend |
| Hosting | Vercel |

## Design system

- **Direction**: bold sports-editorial — not corporate-minimal. Big display type (Anton font for headings, Inter for body), high-contrast "ink" (near-black) bands used as section breaks, angled/diagonal hero divider.
- **Colors**: green primary (`#7fb069`/`#6a9a56` family, from the original brand), gold/amber accent sampled directly from the crest logo (not a generic Tailwind amber) — used for badges, kickers, stat numbers, underlines.
- **Logo**: real crest logo at `public/logo/` (several variants — with/without banner, compact "S" mark).
- **Motion**: `components/motion/Reveal.tsx` (scroll-triggered fade/slide, stackable with a `delay` prop for staggered lists) and `components/motion/AnimatedCounter.tsx` (count-up animation for stat numbers like "50+", "100%").
- **Ink sections**: a dedicated `ink`/`ink-foreground` color pair (see `app/globals.css` and `tailwind.config.ts`) used for high-contrast bands (hero, stats strips, testimonials) — not a dark-mode toggle, just a design device.

## Site map

```
/                     Home — hero, features, coaches teaser, programs teaser, testimonials, CTA
/about                Mission/story, stat band, "our approach" cards
/programs             List of active programs (from Sanity)
/programs/[slug]      Program detail — dates/price/location, registration form → Stripe Checkout
/programs/success     Post-payment confirmation page
/coaches              Coach grid (click a card for full bio in a dialog)
/gallery              Photo grid with lightbox
/blog                 List of posts
/blog/[slug]          Individual post (portable text rendering)
/contact              Contact info + form → emails via Resend
/portal               Parent portal — currently a "launching soon" placeholder
/portal/login         Same placeholder treatment
/studio               Embedded Sanity Studio (admin only, not in public nav)
```

## Content model (Sanity)

Schemas live in `sanity/schemaTypes/`. Content is fetched live via GROQ (`lib/sanity/queries.ts`) — nothing is hardcoded, so anything added in Studio shows up on the site automatically (revalidates every 60s).

- **`program`** — title, slug, summary, body (rich text), startDate/endDate (optional — blank shows "Dates TBD"), price (in cents), capacity, ageGroup, location, heroImage, `active` flag (inactive programs are hidden from `/programs` and show "Registration closed" on their detail page instead of the registration form)
- **`coach`** — name, role, bio, photo, order (controls display order)
- **`testimonial`** — quote, authorName, authorRelation, optional rating (1–5 stars)
- **`galleryItem`** — image, caption, category, order
- **`blogPost`** — title, slug, publishedAt, excerpt, body (rich text), coverImage

### Current real content status

- 2 of 3 coaches added (Mubasheer Joban, Mustafa Jawad) with real bios — **photos not yet uploaded** (need to drag into Studio manually), and the third coach (Yassine) not yet added
- No programs, testimonials, gallery items, or blog posts added yet — those sections currently show "will appear here once added in Sanity Studio" empty states on the live site
- Real content that exists but hasn't been entered into Sanity yet (available from the old site / this project's history): 3 testimonials (Amina, Adam Jamal, Ebi Umboh), a past "Winter Camp" and upcoming "Spring Camp" (TBD dates), and training packages (Foundations $319 / Pro $459 / Comp Elite $649) plus individual sessions ($89–$149)

## Registration & payment flow

1. Parent visits a program detail page, fills out the registration form (player name/DOB, parent name/email/phone)
2. `POST /api/stripe/checkout` creates a Stripe Checkout Session (price pulled live from Sanity, not trusted from the client) and redirects to Stripe
3. On successful payment, Stripe calls `POST /api/stripe/webhook`
4. The webhook: finds-or-creates a Supabase Auth user by the parent's email (so this "guest checkout" is already linked to an account for when the parent portal login ships later), inserts a `players` row and a `registrations` row, and sends a confirmation email via Resend
5. Parent lands on `/programs/success`

**Verified end-to-end in Stripe test mode**: a real test payment was completed, the webhook fired and returned 200, and the corresponding rows were confirmed in Supabase.

**Not yet done**: the production Stripe webhook endpoint. Right now `STRIPE_WEBHOOK_SECRET` in production still points at a local `stripe listen` session, so a real checkout on the live site would take payment but the webhook (DB write + confirmation email) wouldn't fire until a webhook endpoint is added in the Stripe dashboard pointing at `https://suhbahsoccer.com/api/stripe/webhook`.

## Database (Supabase)

Two tables, defined in `supabase/migrations/0001_init.sql`, both with Row Level Security:

- **`players`** — id, `parent_user_id` (FK to `auth.users`), full_name, date_of_birth
- **`registrations`** — id, `player_id` (FK to players), `program_slug` (references Sanity by slug, not a DB foreign key), stripe_session_id, stripe_payment_status, amount_cents

RLS policies restrict parents to only reading/writing their own players and registrations (matched via `auth.uid()`), which will matter once the parent portal (magic-link login) ships.

## What's fully working right now

- Entire site renders live at suhbahsoccer.com with real design, real logo, real brand colors
- Sanity Studio is live and editable; 2 coach profiles are real content
- Full registration → Stripe Checkout → webhook → Supabase → confirmation email pipeline verified working (test mode)
- Contact form sends email via Resend
- Responsive design (mobile nav, mobile layouts) verified
- Auto-deploy pipeline: push to `main` → Vercel builds and deploys

## What's still open / known gaps

- Production Stripe webhook not configured (test-mode-only right now)
- Most content sections are empty (programs, testimonials, gallery, blog, 1 coach photo + 1 more coach)
- Resend can only send to your own address until a sending domain is verified
- Parent portal (`/portal`) is a placeholder — no magic-link auth wired up yet (this was always planned as "Phase 2" in the original spec)

## Explicitly deferred/future phases (from the original build spec)

- **Phase 2**: Supabase magic-link auth for parents; `/portal` dashboard showing a parent's own registrations + payment status (schema/RLS already built to support this)
- **Phase 3**: team rosters, game/practice schedules, announcements, richer portal (messaging, waivers/docs, player progress tracking) — not started, not scoped in detail yet

## Folder structure

```
app/(marketing)/     Public pages — home, about, programs, coaches, gallery, blog, contact
app/(portal)/        Parent portal placeholder routes
app/api/              stripe/checkout, stripe/webhook, contact — server routes
app/studio/           Embedded Sanity Studio
components/ui/        shadcn/ui primitives (button, card, dialog, form, etc.)
components/layout/    Header, Footer, MobileNav
components/sections/  Hero, ProgramCard, CoachCard, TestimonialCarousel, GalleryGrid, etc.
components/motion/    Reveal, AnimatedCounter (Framer Motion helpers)
lib/                  Sanity client/queries, Supabase clients, Stripe client, Resend/email
sanity/               Studio config + content schemas
supabase/migrations/  SQL schema + RLS policies
types/                Shared TypeScript types matching Sanity content
legacy-static/        The old static HTML site, kept for reference only
public/               Real media: logos, coach photos, gallery photos, program images, PDFs
```

## Environment / accounts already set up

Sanity, Supabase, and Stripe (test mode) accounts all exist and are wired into both local `.env.local` and Vercel's production environment variables. Resend is connected but not domain-verified. See `README.md` in the repo root for step-by-step account setup instructions if any of these need to be reconfigured or duplicated (e.g. staging environment).
