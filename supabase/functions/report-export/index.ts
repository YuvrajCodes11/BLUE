import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type ReportRequest = {
  role?: string;
  format?: "json" | "csv";
};

serve(async (request) => {
  const payload = (await request.json().catch(() => ({}))) as ReportRequest;
  const body = {
    role: payload.role ?? "BMU Manager",
    generatedAt: new Date().toISOString(),
    records: 1284,
    format: payload.format ?? "json",
  };

  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
});
