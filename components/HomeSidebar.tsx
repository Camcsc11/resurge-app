"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "./NotificationBell";
import { portals } from "@/lib/portals";

interface HomeSidebarProps {
  profile: {
    full_name: string;
    role: string;
    email: string;
  };
}

export default function HomeSidebar({ profile }: HomeSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="w-60 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      {/* Brand Block */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">Resurge</p>
            <p className="text-xs text-gray-500">Business Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {/* Home Link */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive("/dashboard")
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Home
          </Link>

          {/* Portal Links for Admin */}
          {profile.role === "admin" && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">
                Manage Portals
              </p>
              <div className="space-y-1">
                {portals.map((portal) => (
                  <Link
                    key={portal.id}
                    href={`/dashboard/portals/${portal.id}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(`/dashboard/portals/${portal.id}`)
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    {portal.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <NotificationBell />
        </div>
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900">
            {profile.full_name}
          </p>
          <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
