import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import TrendsClient from "@/components/ofm-pro/TrendsClient";

export default async function TrendsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: trends } = await supabase
    .from("ofm_trends")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <TrendsClient initialTrends={trends || []} />;
}
