import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyCreatorToken } from '@/lib/creator-auth';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

async function getCreatorInfo() {
  const cookieStore = cookies();
  const token = cookieStore.get('creator_session')?.value;

  if (!token) {
    redirect('/creator-login');
  }

  const payload = await verifyCreatorToken(token);
  if (!payload) {
    redirect('/creator-login');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const { data: creator, error } = await supabase
    .from('ofm_creators')
    .select('id, name')
    .eq('id', payload.creator_id)
    .single();

  if (error || !creator) {
    redirect('/creator-login');
  }

  return {
    creator,
    payload,
  };
}

export default async function CreatorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { creator, payload } = await getCreatorInfo();

  return (
    <div className="min-h-screen bg-[#0f1729]">
      <div className="bg-[#1a2332] border-b border-[#2a3a4a]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/creator-portal" className="text-2xl font-bold text-white">
              Resurge
              <span className="text-blue-400"> | Creator Portal</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Welcome back</p>
              <p className="text-white font-medium">{creator.name}</p>
            </div>
            <form
              action={async () => {
                'use server';
                const res = await fetch(
                  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/creator-auth/logout`,
                  { method: 'POST' }
                );
                redirect('/creator-login');
              }}
            >
              <Button
                type="submit"
                variant="outline"
                className="border-[#2a3a4a] text-gray-300 hover:text-white"
              >
                Logout
              </Button>
            </form>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
