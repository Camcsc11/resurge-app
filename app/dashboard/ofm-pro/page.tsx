import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import OfmDashboard from "@/components/ofm-pro/OfmDashboard";

export default async function OfmProHomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const [accountsRes, creatorsRes, linksRes, requestsRes, trendsRes, topLinksRes, activityRes] = await Promise.all([
    supabase.from("ofm_accounts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("ofm_creators").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("ofm_links").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_active", true),
    supabase.from("ofm_requests").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending"),
    supabase.from("ofm_trends").select("*").eq("user_id", user.id).eq("is_saved", true).order("created_at", { ascending: false }).limit(3),
    supabase.from("ofm_links").select("*").eq("user_id", user.id).order("total_clicks", { ascending: false }).limit(3),
    supabase.from("ofm_requests").select("*, ofm_creators(name)").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
  ]);

  const stats = {
    totalAccounts: accountsRes.count || 0,
    totalCreators: creatorsRes.count || 0,
    activeLinks: linksRes.count || 0,
    pendingRequests: requestsRes.count || 0,
  };

  const recentTrends = trendsRes.data || [];
  const topLinks = topLinksRes.data || [];
  const recentActivity = (activityRes.data || []).map((r: any) => ({
    ...r,
    creator_name: r.ofm_creators?.name || null,
  }));

  return <OfmDashboard stats={stats} recentTrends={recentTrends} topLinks={topLinks} recentActivity={recentActivity} />;
}
