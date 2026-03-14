import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import EmployeeManagement from '@/components/admin/EmployeeManagement'

export default async function EmployeesPage() {
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

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard/employee-home')
  }

  // Fetch all profiles
  const { data: employees } = await supabase
    .from('profiles')
    .select('*')
    .order('display_name')

  // Fetch all portal access records
  const { data: portalAccessRecords } = await supabase
    .from('employee_portal_access')
    .select('user_id, portal_id')

  return (
    <EmployeeManagement
      employees={employees || []}
      portalAccessRecords={portalAccessRecords || []}
    />
  )
}
