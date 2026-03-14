'use client';

import Link from 'next/link';
import { portals } from '@/lib/portals';
import * as Icons from 'lucide-react';

interface Profile {
  role: string;
}

interface EmployeeHomepageProps {
  profile: Profile;
  portalAccess: string[];
}

// Mapping of icon names to lucide-react components
const iconMap: Record<string, any> = {
  Briefcase: Icons.Briefcase,
  BarChart3: Icons.BarChart3,
  Users: Icons.Users,
  ClipboardList: Icons.ClipboardList,
  Calendar: Icons.Calendar,
  FileText: Icons.FileText,
  Settings: Icons.Settings,
  HelpCircle: Icons.HelpCircle,
  Zap: Icons.Zap,
  Target: Icons.Target,
  BookOpen: Icons.BookOpen,
  Code: Icons.Code,
};

export default function EmployeeHomepage({
  profile,
  portalAccess,
}: EmployeeHomepageProps) {
  const isAdmin = profile.role === 'admin';

  const visiblePortals = portals.filter((portal) => {
    const hasAccess =
      isAdmin || portalAccess.includes(portal.id);
    return portal.active && hasAccess;
  });

  const unavailablePortals = portals.filter(
    (portal) =>
      !portal.active && (isAdmin || portalAccess.includes(portal.id))
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Resurge</h1>
        <p className="text-gray-600 mb-12">Access your work portals below</p>

        {/* Active Portals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {visiblePortals.map((portal) => {
            const Icon = iconMap[portal.icon] || Icons.Box;
            return (
              <Link key={portal.id} href={portal.href}>
                <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 cursor-pointer border border-gray-200 hover:border-blue-300">
                  <div className="flex items-start mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {portal.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{portal.description}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Coming Soon Portals */}
        {unavailablePortals.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unavailablePortals.map((portal) => {
                const Icon = iconMap[portal.icon] || Icons.Box;
                return (
                  <div
                    key={portal.id}
                    className="bg-white rounded-lg shadow p-6 border border-gray-200 opacity-50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <Icon className="w-6 h-6 text-gray-400" />
                      </div>
                      <span className="inline-block bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1 rounded">
                        Coming Soon
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {portal.name}
                    </h3>
                    <p className="text-gray-600 text-sm">{portal.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
