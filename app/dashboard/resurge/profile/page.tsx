'use client';

import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function CreatorProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

      <div className="bg-[#1a1a2e] rounded-xl border border-white/10 p-6 max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{profile?.full_name || 'Creator'}</p>
            <p className="text-sm text-gray-400">{profile?.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-sm text-gray-400">Role</span>
            <span className="text-sm text-purple-400 capitalize">{profile?.role}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-sm text-gray-400">Member Since</span>
            <span className="text-sm text-gray-300">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
