import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import GeoClient from "@/components/ofm-pro/GeoClient";

export default async function GeoPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: links } = await supabase
    .from("ofm_links")
    .select("country_breakdown")
    .eq("user_id", user.id);

  // Aggregate country data across all links
  const aggregated: Record<string, number> = {};
  let totalVisits = 0;

  if (links) {
    for (const link of links) {
      const breakdown = link.country_breakdown as Record<string, number> | null;
      if (breakdown) {
        for (const [country, visits] of Object.entries(breakdown)) {
          const v = typeof visits === "number" ? visits : 0;
          aggregated[country] = (aggregated[country] || 0) + v;
          totalVisits += v;
        }
      }
    }
  }

  return (
    <GeoClient
      aggregatedData={aggregated}
      totalVisits={totalVisits}
      countryCount={Object.keys(aggregated).length}
    />
  );
}
