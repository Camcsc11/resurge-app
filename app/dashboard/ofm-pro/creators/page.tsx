import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "A/lib/supabase/server";
import CreatorsClient from "@/components/ofm-pro/CreatorsClient";

export default async function CreatorsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: creators } = await supabase
    .from("ofm_creators")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <CreatorsClient initialCreators={creators || []} />;
}
