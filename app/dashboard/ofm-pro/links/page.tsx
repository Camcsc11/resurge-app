import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "A/lib/supabase/server";
import LinksClient from "@/components/ofm-pro/LinksClient";

export default async function LinksPage() {
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
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <LinksClient initialLinks={links || []} />;
}
