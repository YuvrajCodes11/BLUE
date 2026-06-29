import { createClient } from "@/lib/supabase";

export async function fetchRoleSummary(role: string) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("report-export", {
    body: { role, format: "json" },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as { role: string; generatedAt: string; records: number };
}
