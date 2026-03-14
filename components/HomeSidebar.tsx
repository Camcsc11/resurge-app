"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Users, Video, Calendar, DollarSign, MessageSquare, Briefcase, ClipboardCheck, FolderCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "./NotificationBell";

interface HomeSidebarProps {
  profile: {
    full_name: string;
    role: string;
    email: string;
  };
}

const adminLinks = [
  { name: "Home", href: "/dashboard/admin-home", icon: LayoutDashboard },
  { name: "Manage Employees", href: "/dashboard/admin/employees", icon: Users },
  { name: "Video Pipeline", href: "/dashboard/admin", icon: Video },
  { name: "Finished Clips", href: "/dashboard/admin/finished", icon: FolderCheck },
];

const editorLinks = [
  { name: "My Clips", href: "/dashboard/editor", icon: Video },
  { name: "History", href: "/dashboard/editor/history", icon: ClipboardCheck },
];

const cdLinks = [
  { name: "Dashboard", href: "/dashboard/cd", icon: LayoutDashboard },
  { name: "Manage Clips", href: "/dashboard/cd/clips", icon: Video },
  { name: "Finished", href: "/dashboard/cd/finished", icon: FolderCheck },
];

const qaLinks = [
  { name: "Review Queue", href: "/dashboard/qa", icon: ClipboardCheck },
  { name: "History", href: "/dashboard/qa/history", icon: FolderCheck },
];

function getLinksForRole(role: string) {
  switch (role) {
    case "admin":
      return adminLinks;
    case "creative_director":
      return cdLinks;
    case "editor":
      return editorLinks;
    case "qa":
      return qaLinks;
    default:
      return editorLinks;
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case "admin":
      return "Admin";
    case "creative_director":
      return "Creative Director";
    case "editor":
      return "Editor";
    case "qa":
      return "QA Reviewer";
    default:
      return role;
  }
}

export default function HomeSidebar({ profile }: HomeSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const links = getLinksForRole(profile.role);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="w-60 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">Resurge</p>
            <p className="text-xs text-gray-500">Business Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 p-4">
        <NotificationBell />
        <div className="mt-3">
          <p className="text-sm font-medium text-brand-700">{profile.full_name}</p>
          <p className="text-xs text-gray-500 capitalize">{getRoleLabel(profile.role)}</p>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
