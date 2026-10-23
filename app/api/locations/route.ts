import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const fallbackCounties = [
  { id: "a30fc6e2-6a50-472b-b6f4-ee52f229740c", name: "Kilifi", code: "KLF" },
  { id: "b7894262-fcc5-4a0f-88c9-076dfa519407", name: "Kwale", code: "KWL" },
  { id: "b88842d1-3544-4cb3-90d6-1c5756deaed3", name: "Mombasa", code: "MSA" },
  { id: "e9c34177-1fd0-400e-8ffe-45669905d021", name: "Homa Bay", code: "HBY" },
  { id: "f0123456-789a-bcde-f012-3456789abcde", name: "Lamu", code: "LAM" },
];

const fallbackSubCounties = [
  { id: "ef2c4776-8b1f-407f-b978-502de11a5665", county_id: "a30fc6e2-6a50-472b-b6f4-ee52f229740c", name: "Kilifi North" },
  { id: "sub-klf-02", county_id: "a30fc6e2-6a50-472b-b6f4-ee52f229740c", name: "Kilifi South" },
  { id: "sub-klf-03", county_id: "a30fc6e2-6a50-472b-b6f4-ee52f229740c", name: "Malindi" },
  { id: "efd27281-c72f-464d-9b8f-ed78d784e3e0", county_id: "b7894262-fcc5-4a0f-88c9-076dfa519407", name: "Msambweni" },
  { id: "sub-kwl-02", county_id: "b7894262-fcc5-4a0f-88c9-076dfa519407", name: "Matuga" },
  { id: "sub-msa-01", county_id: "b88842d1-3544-4cb3-90d6-1c5756deaed3", name: "Nyali" },
  { id: "sub-msa-02", county_id: "b88842d1-3544-4cb3-90d6-1c5756deaed3", name: "Likoni" },
  { id: "sub-hby-01", county_id: "e9c34177-1fd0-400e-8ffe-45669905d021", name: "Homa Bay Town" },
  { id: "sub-lam-01", county_id: "f0123456-789a-bcde-f012-3456789abcde", name: "Lamu West" },
];

const fallbackWards = [
  { id: "f3644832-ae0b-4fa6-9533-fa29aab5dfc3", sub_county_id: "ef2c4776-8b1f-407f-b978-502de11a5665", name: "Watamu" },
  { id: "wrd-klf-02", sub_county_id: "ef2c4776-8b1f-407f-b978-502de11a5665", name: "Sokoni" },
  { id: "wrd-klf-03", sub_county_id: "sub-klf-03", name: "Shella" },
  { id: "c22c1dbd-e165-47d5-9de0-e9ecd041dfe6", sub_county_id: "efd27281-c72f-464d-9b8f-ed78d784e3e0", name: "Shimoni" },
  { id: "wrd-kwl-02", sub_county_id: "efd27281-c72f-464d-9b8f-ed78d784e3e0", name: "Diani" },
  { id: "wrd-msa-01", sub_county_id: "sub-msa-01", name: "Kongowea" },
  { id: "wrd-hby-01", sub_county_id: "sub-hby-01", name: "Central Homa Bay" },
  { id: "wrd-lam-01", sub_county_id: "sub-lam-01", name: "Shella Lamu" },
];

const fallbackBmus = [
  {
    id: "775660f7-c8d8-4e7a-99e8-f65c72152ecc",
    name: "Kilifi Creek BMU",
    county: "Kilifi",
    county_id: "a30fc6e2-6a50-472b-b6f4-ee52f229740c",
    sub_county_id: "ef2c4776-8b1f-407f-b978-502de11a5665",
    ward_id: "f3644832-ae0b-4fa6-9533-fa29aab5dfc3",
    registration_code: "KE-BMU-2017-002",
  },
  {
    id: "bmu-watamu",
    name: "Watamu BMU",
    county: "Kilifi",
    county_id: "a30fc6e2-6a50-472b-b6f4-ee52f229740c",
    sub_county_id: "ef2c4776-8b1f-407f-b978-502de11a5665",
    ward_id: "f3644832-ae0b-4fa6-9533-fa29aab5dfc3",
    registration_code: "KE-BMU-2018-005",
  },
  {
    id: "999f1cc4-a5cf-4e12-bee6-068871b7ee22",
    name: "Diani Reef BMU",
    county: "Kwale",
    county_id: "b7894262-fcc5-4a0f-88c9-076dfa519407",
    sub_county_id: "efd27281-c72f-464d-9b8f-ed78d784e3e0",
    ward_id: "c22c1dbd-e165-47d5-9de0-e9ecd041dfe6",
    registration_code: "KE-BMU-2019-014",
  },
  {
    id: "bmu-shimoni",
    name: "Shimoni BMU",
    county: "Kwale",
    county_id: "b7894262-fcc5-4a0f-88c9-076dfa519407",
    sub_county_id: "efd27281-c72f-464d-9b8f-ed78d784e3e0",
    ward_id: "c22c1dbd-e165-47d5-9de0-e9ecd041dfe6",
    registration_code: "KE-BMU-2019-020",
  },
  {
    id: "a912a429-4355-4a1d-9688-080a8593c386",
    name: "Homa Bay Central BMU",
    county: "Homa Bay",
    county_id: "e9c34177-1fd0-400e-8ffe-45669905d021",
    sub_county_id: "sub-hby-01",
    ward_id: "wrd-hby-01",
    registration_code: "KE-BMU-2016-101",
  },
];

export async function GET() {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({
      counties: fallbackCounties,
      subCounties: fallbackSubCounties,
      wards: fallbackWards,
      bmus: fallbackBmus,
    });
  }

  try {
    const [countiesRes, subCountiesRes, wardsRes, bmusRes] = await Promise.all([
      supabase.from("counties").select("id,name,code").order("name"),
      supabase.from("sub_counties").select("id,county_id,name").order("name"),
      supabase.from("wards").select("id,sub_county_id,name").order("name"),
      supabase.from("bmus").select("id,name,county,registration_code,county_id,sub_county_id,ward_id").order("name"),
    ]);

    const counties = countiesRes.data?.length ? countiesRes.data : fallbackCounties;
    const subCounties = subCountiesRes.data?.length ? subCountiesRes.data : fallbackSubCounties;
    const wards = wardsRes.data?.length ? wardsRes.data : fallbackWards;
    const bmus = bmusRes.data?.length ? bmusRes.data : fallbackBmus;

    return NextResponse.json({ counties, subCounties, wards, bmus });
  } catch {
    return NextResponse.json({
      counties: fallbackCounties,
      subCounties: fallbackSubCounties,
      wards: fallbackWards,
      bmus: fallbackBmus,
    });
  }
}
