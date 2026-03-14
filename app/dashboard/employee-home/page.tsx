import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import EmployeeHomepage from '@/components/EmployeeHomepage'

export default async function EmployeeHomePage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Fetch portal access records for this employee
  const { data: portalAccessRecords } = await supabase
    .from('employee_portal_access')
    .select('portal_id')
    .eq('user_id', session.user.id)

  const portals = portalAccessRecords?.map((r) => r.portal_id) || []

  return (
    <EmployeeHomepage profile={profile} accessiblePortals={portals} />
  )
}
