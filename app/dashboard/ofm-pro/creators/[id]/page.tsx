import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import CreatorDetailClient from "@/components/ofm-pro/CreatorDetailClient";

export default async function CreatorDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: creator } = await supabase
    .from("ofm_creators")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!creator) redirect("/dashboard/ofm-pro/creators");

  const { data: requests } = await supabase
    .from("ofm_requests")
    .select("*")
    .eq("creator_id", params.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <CreatorDetailClient
      creator={creator}
      initialRequests={requests || []}
      userId={user.id}
    />
  );
}
