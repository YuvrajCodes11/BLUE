import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type PaymentRequest = {
  phone: string;
  amount: number;
  service: string;
};

serve(async (request) => {
  const payload = (await request.json()) as PaymentRequest;
  return new Response(
    JSON.stringify({
      checkoutRequestId: crypto.randomUUID(),
      status: "queued",
      service: payload.service,
      amount: payload.amount,
      phone: payload.phone,
    }),
    { headers: { "content-type": "application/json" } },
  );
});
