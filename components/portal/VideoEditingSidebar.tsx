"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Film,
  Clock,
  CheckSquare,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "../NotificationBell";

interface VideoEditingSidebarProps {
  profile: {
    full_name: string;
    role: string;
    email: string;
  };
}

export default function VideoEditingSidebar({
  profile,
}: VideoEditingSidebarProps) {
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

  const navItems = {
    admin: [
      {
        label: "Pipeline",
        href: "/portal/video-editing/admin",
        icon: LayoutDashboard,
      },
      {
        label: "Employees",
        href: "/portal/video-editing/admin/employees",
        icon: Users,
      },
      {
        label: "Finished",
        href: "/portal/video-editing/admin/finished",
        icon: Trophy,
      },
    ],
    cd: [
      {
        label: "Pipeline",
        href: "/portal/video-editing/cd",
        icon: LayoutDashboard,
      },
      { label: "All Clips", href: "/portal/video-editing/cd/clips", icon: Film },
      {
        label: "Finished",
        href: "/portal/video-editing/cd/finished",
        icon: Trophy,
      },
    ],
    editor: [
      { label: "My Clips", href: "/portal/video-editing/editor", icon: Film },
      {
        label: "History",
        href: "/portal/video-editing/editor/history",
        icon: Clock,
      },
    ],
    qa: [
      {
        label: "Review Queue",
        href: "/portal/video-editing/qa",
        icon: CheckSquare,
      },
      {
        label: "History",
        href: "/portal/video-editing/qa/history",
        icon: Clock,
      },
    ],
  };

  const items = navItems[profile.role as keyof typeof navItems] || [];

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
            <p className="text-xs text-gray-500">Content Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {/* Back to Home Link */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:bg-gray-50 mb-3`}
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Home
          </Link>

          <div className="border-t border-gray-200 pt-3">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
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
