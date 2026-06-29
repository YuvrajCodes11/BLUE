# Supabase Setup Checklist

Setup owner/contact: yuvrajcodes11@gmail.com. Do not store credentials in this document.

## 1. Create Project

1. Log in to Supabase.
2. Create a new project named `BLUE Platform`.
3. Save the project reference ID.
4. Copy the Project URL and anon public key.
5. Copy the service role key for server/CLI use only.

## 2. Environment Variables

Create `.env.local` from `.env.local.example` and fill:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_REF=
SUPABASE_ACCESS_TOKEN=
```

Never commit `.env.local`.

## 3. Auth Settings

In Supabase Auth settings:

- Enable Email provider.
- Enable email confirmation for production.
- Set Site URL for local: `http://localhost:3000`.
- Set Site URL for production after deployment.
- Add redirect URLs:
  - `http://localhost:3000/login`
  - `http://localhost:3000/dashboard`
  - `https://YOUR-PRODUCTION-DOMAIN/login`
  - `https://YOUR-PRODUCTION-DOMAIN/dashboard`

## 4. Storage Buckets

Create these buckets:

- `avatars`
- `documents`
- `images`
- `marine-reports`

Recommended: keep buckets private and serve files through authenticated signed URLs later.

## 5. Run Migrations

Install Supabase CLI if needed. Then:

```bash
npm run supabase:db:push
```

Or manually run SQL files from `supabase/migrations` in order.

## 6. Seed Development Data

Use fake data only:

```bash
npm run supabase:seed
```

Or manually run `supabase/seed.sql` in SQL editor.

## 7. Create First Admin

1. Create an Auth user in Supabase Auth.
2. Copy that user's UUID.
3. Insert a matching row into `profiles` with role `Government Admin`.
4. Set `is_active = true`.

## 8. Deploy Edge Functions

```bash
npm run supabase:functions:deploy
```

Functions live in `supabase/functions`.

## 9. Local Testing

1. Fill `.env.local`.
2. Run `npm run dev`.
3. Open `/diagnostics`.
4. Confirm env, auth session, and DB read checks.
5. Test `/request-access`.
6. Log in as admin and review requests.

## 10. Production Deployment

1. Add env vars to Vercel.
2. Deploy the Next.js app.
3. Update Supabase Auth Site URL and redirects.
4. Run smoke tests: login, dashboard, CRUD, access requests.
5. Confirm RLS blocks unauthorized roles.
