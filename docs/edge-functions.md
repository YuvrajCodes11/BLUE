# Edge Functions

All functions are in `supabase/functions` and use TypeScript/Deno.

## access-request
Input: `{ name, email, organization, message }`
Output: `{ function, ok, received, processedAt }`
Purpose: advanced access request workflow. Current frontend writes directly to table; function can later add email notifications.

## create-fisher
Input: fisher profile payload.
Output: success payload.
Purpose: validated fisher creation, QR generation, audit logging.

## submit-catch-record
Input: catch payload.
Output: success payload.
Purpose: create catch record and notify validation roles.

## validate-catch-record
Input: `{ catch_record_id, status, notes }`
Output: success payload.
Purpose: KFS/county validation workflow.

## generate-report
Input: `{ reportType, filters, format }`
Output: report metadata or generated file reference.
Purpose: PDF/CSV report generation.

## report-export
Input: `{ role, format }`
Output: `{ role, generatedAt, records, format }`
Purpose: current report-export stub.

## update-request-status
Input: `{ request_id, status }`
Output: success payload.
Purpose: approve/reject access request with audit trail.

## notify-user
Input: `{ user_id, title, body }`
Output: success payload.
Purpose: create notification and optional email integration.

## payment-intent
Input: `{ phone, amount, service }`
Output: `{ checkoutRequestId, status, service, amount, phone }`
Purpose: future M-Pesa/Daraja payment queue.

## Required Environment Variables

- `SUPABASE_URL` or function-level project URL if needed.
- `SUPABASE_SERVICE_ROLE_KEY` for privileged server-side operations.
- Future email provider keys if notifications are emailed.
- Future Daraja credentials for payment function.

## Security Notes

- Never expose service role key to frontend.
- Validate JWT and role before privileged operations.
- Functions that write admin-only data should use service role after verifying caller role.
- Log important actions to `audit_logs`.
