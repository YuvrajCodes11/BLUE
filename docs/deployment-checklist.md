# Deployment Checklist

## Local Setup

1. Copy `.env.local.example` to `.env.local`.
2. Fill Supabase URL and anon key.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open `/diagnostics`.

## Supabase Setup

1. Create project.
2. Add Auth redirect URLs.
3. Create storage buckets.
4. Run migrations.
5. Run seed file for development.
6. Create first admin Auth user and `profiles` row.
7. Deploy Edge Functions.

## Vercel Deployment

1. Import repository/project.
2. Add env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` only if server-side code needs it
3. Deploy.
4. Update Supabase Auth Site URL and redirects to production domain.

## Post-Deployment Checks

- Landing page loads.
- `/request-access` creates an access request.
- Login works.
- Role redirect works.
- Admin can view requests.
- CRUD pages load real data.
- Unauthorized roles are blocked by RLS.
- No secret values are visible in browser.

## Rollback

- Vercel: redeploy previous successful deployment.
- Supabase: keep migration backups; avoid destructive migrations without rollback SQL.
- Edge Functions: redeploy previous function version from git.
