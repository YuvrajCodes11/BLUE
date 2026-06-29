# Database Schema

## profiles
User profile linked to `auth.users`.

Required columns: `id`, `full_name`, `role`, `is_active`, `created_at`.
Optional: `county`, `bmu_id`, `avatar_url`.

Used by: auth login redirect, admin user management, role permissions, notifications, audit logs.

## access_requests
Public access request queue.

Required: `id`, `name`, `email`, `organization`, `status`, `created_at`.
Optional: `message`.

Used by: `/request-access`, admin access request panel.

## bmus
Beach Management Unit registry.

Required: `id`, `name`, `county`, `registration_code`, `status`.

Used by: fishers, catch records, compliance, BMU dashboards.

## landing_sites
Landing site registry with GIS-ready coordinates.

Required: `id`, `name`, `county`, `status`.
Optional: `latitude`, `longitude`.

Used by: `/dashboard/landing-sites`, GIS, reports.

## fishers
BMU-managed fisher profiles.

Required: `id`, `bmu_id`, `full_name`, `membership_status`, `qr_code`, `created_at`.
Optional: `phone`.

Relationships: `bmu_id -> bmus.id`.
Used by: `/dashboard/fishers`, vessels, gear, catch records.

## vessels
Vessel registrations linked to fishers.

Required: `id`, `fisher_id`, `vessel_name`, `created_at`.
Optional: `registration_number`, `ownership_type`.

Relationship: `fisher_id -> fishers.id`.
Used by: `/dashboard/vessels`.

## gear_records
Fishing gear inventory.

Required: `id`, `gear_type`, `quantity`, `status`.
Optional: `fisher_id`.

Relationship: `fisher_id -> fishers.id`.
Used by: `/dashboard/gear`.

## catch_records
Catch assessment records.

Required: `id`, `bmu_id`, `species`, `weight_kg`, `landing_site`, `recorded_at`.
Optional: `fisher_id`.

Relationships: `bmu_id -> bmus.id`, `fisher_id -> fishers.id`.
Used by: `/dashboard/catches`, reports, dashboards.

## species_records
Species monitoring.

Required: `id`, `common_name`, `category`, `status`, `created_at`.
Optional: `scientific_name`.

Used by: `/dashboard/species`, reports.

## compliance_records
Inspection/patrol/compliance records.

Required: `id`, `record_type`, `finding`, `created_at`.
Optional: `bmu_id`, `officer_id`, `action_taken`.

Used by: `/dashboard/compliance`, ranger/KFS dashboards.

## ngo_projects
NGO and donor project monitoring.

Required: `id`, `title`, `budget`, `impact_score`, `created_at`.
Optional: `donor_name`.

Used by: `/dashboard/projects`, `/dashboard/donor-impact`.

## beneficiaries
Project/community beneficiaries.

Required: `id`, `name`, `status`, `created_at`.
Optional: `project_id`, `county`.

Relationship: `project_id -> ngo_projects.id`.
Used by: `/dashboard/beneficiaries`.

## notifications
User notifications.

Required: `id`, `user_id`, `title`, `body`, `created_at`.
Optional: `read_at`.

Relationship: `user_id -> profiles.id`.
Used by: `/dashboard/notifications`.

## audit_logs
Admin and system action history.

Required: `id`, `action`, `entity_type`, `created_at`.
Optional: `actor_id`, `entity_id`.

Used by: admin management panel.

## documents
Storage metadata for uploaded files.

Required: `id`, `owner_id`, `owner_type`, `storage_path`, `document_type`, `created_at`.

Used later by: licences, vessel documents, meeting minutes, marine reports.
