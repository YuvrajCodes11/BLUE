# BLUE — Blue Economy Livelihoods Unified Ecosystem

A premium Next.js 15 + React 19 platform foundation for fisheries management, marine conservation, BMU operations, NGO projects, donor monitoring, GIS intelligence, analytics, reporting, and community collaboration.

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL, Storage, RLS, Edge Functions
- React Three Fiber, Three.js, drei, maath
- GSAP ScrollTrigger
- Framer Motion
- Leva
- React Hook Form + Zod
- TanStack Query
- Lucide React

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase

- Migrations live in `supabase/migrations`.
- Edge Functions live in `supabase/functions`.
- Environment variables are documented in `.env.example`.

## Architecture

```text
app/
components/
features/
hooks/
lib/
services/
types/
utils/
public/
supabase/functions/
supabase/migrations/
```

## Implementation Notes

- Bilingual preservation applies only to client-provided official forms that already contain English + Swahili labels.
- System-wide bilingual translation is not included unless separately approved.
- Do not build a language switcher, full i18n infrastructure, or translate normal dashboards, auth, admin, reports, settings, or general UI unless the client separately approves it.
