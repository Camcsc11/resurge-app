"use client";

import Link from "next/link";
import { LayoutDashboard, BarChart3, TrendingUp, Link as LinkIcon, Users, Globe } from "lucide-react";

interface OfmDashboardProps {
  stats: {
    totalAccounts: number;
    totalCreators: number;
    activeLinks: number;
    pendingRequests: number;
  };
  recentTrends: any[];
  topLinks: any[];
  recentActivity: any[];
}

export default function OfmDashboard({ stats, recentTrends, topLinks, recentActivity }: OfmDashboardProps) {
  const statCards = [
    { label: "Total Accounts", value: stats.totalAccounts, icon: BarChart3, color: "text-blue-400" },
    { label: "Total Creators", value: stats.totalCreators, icon: Users, color: "text-green-400" },
    { label: "Active Links", value: stats.activeLinks, icon: LinkIcon, color: "text-purple-400" },
    { label: "Pending Requests", value: stats.pendingRequests, icon: LayoutDashboard, color: "text-yellow-400" },
  ];

  const quickActions = [
    { label: "Add Account", href: "/dashboard/ofm-pro/accounts", icon: BarChart3 },
    { label: "Add Trend", href: "/dashboard/ofm-pro/trends", icon: TrendingUp },
    { label: "Create Link", href: "/dashboard/ofm-pro/links", icon: LinkIcon },
    { label: "AddBGA Creator", href: "/dashboard/ofm-pro/creators", icon: Users },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">OFM Pro Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{card.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${card.color} opacity-60`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Trends */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Trends</h2>
          {recentTrends.length === 0 ? (
            <p className="text-gray-500 text-sm">No trends saved yet.</p>
          ) : (
            <div className="space-y-3">
              {recentTrends.map((trend: any) => (
                <div key={trend.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{trend.title}</p>
                    <p className="text-xs text-gray-400 capitalize">{trend.platform}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    trend.virality_score > 70 ? "bg-green-500/20 text-green-400" :
                    trend.virality_score > 40 ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {trend.virality_score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Links */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Top Performing Links</h2>
          {topLinks.length === 0 ? (
            <p className="text-gray-500 text-sm">No links created yet.</p>
          ) : (
            <div className="space-y-3">
              {topLinks.map((link: any) => (
                <div key={link.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{link.name}</p>
                    <p className="text-xs text-gray-400">{link.short_code}</p>
                  </div>
                  <span className="text-sm font-bold text-blue-400">{link.total_clicks} clicks</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{req.title}</p>
                    <p className="text-xs text-gray-400">{req.creator_name || "Unknown creator"}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    req.status === "completed" ? "bg-green-500/20 text-green-400" :
                    req.status === "in_progress" ? "bg-blue-500/20 text-blue-400" :
                    req.status === "rejected" ? "bg-red-500/20 text-red-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {req.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg p-4 transition-colors"
                >
                  <Icon className="w-5 h-5 text-brand-400" />
                  <span className="text-sm font-medium text-white">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
