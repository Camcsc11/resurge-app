import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import HomeSidebar from '@/components/HomeSidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, email')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="flex h-screen">
      <HomeSidebar profile={profile} />
      <main className="flex-1 overflow-y-auto ml-60" style={{
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 25%, #2d1b4e 50%, #1a1a3e 100%)'
      }}>
        {children}
      </main>
    </div>
  )
}
