import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (request) => {
  const payload = await request.json().catch(() => ({}));
  return new Response(JSON.stringify({ function: "validate-catch-record", ok: true, received: payload, processedAt: new Date().toISOString() }), { headers: { "content-type": "application/json" } });
});
