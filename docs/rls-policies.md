# RLS Policies

## General Rule

RLS is enabled on all application tables. Authenticated users can only access data allowed by role policies.

## profiles
- User can read own profile.
- Government Admin can read, insert, and update profiles.
- Admin can change roles and active status.

Risk: first admin must be inserted manually after creating the Auth user.

## access_requests
- Anyone can insert a request.
- Government Admin can read and update request status.

## bmus
- Authenticated users can read BMU records.
- Future hardening: admin/county should manage BMU creation.

## fishers
- Authenticated read policy exists.
- Admin, BMU Manager, County Officer can manage.
- Known risk: fisher-own-only requires adding a direct profile/user link to fishers.

## vessels
- Authenticated read policy exists.
- Admin, BMU Manager, County Officer can manage.

## gear_records
- Authenticated read policy exists.
- Admin, BMU Manager, County Officer can manage.

## catch_records
- Authenticated read policy exists.
- Admin, BMU Manager, County Officer, KFS Officer can manage.

## landing_sites
- Authenticated read policy exists.
- Admin, County Officer, KFS Officer can manage.

## species_records
- Authenticated users can read.
- Admin and KFS Officer can manage.

## compliance_records
- Authenticated read policy exists.
- Admin, KFS Officer, Ranger, BMU Manager, County Officer can manage.

## ngo_projects
- Authenticated read policy exists.
- Donor can read project impact data.
- NGO Program Manager and Admin can manage.

## beneficiaries
- Authenticated read policy exists.
- NGO Program Manager and Admin can manage.

## notifications
- Users can read own notifications.
- Admin can insert notifications.

## audit_logs
- Admin can read and insert audit logs.

## Testing Checklist

For each role, test:

- Can login.
- Redirects to correct dashboard.
- Can read expected module pages.
- Cannot update restricted tables.
- Donor cannot edit operational data.
- Fisher cannot view unrelated private records once fisher profile linking is added.
- Admin can manage profiles/access requests.
