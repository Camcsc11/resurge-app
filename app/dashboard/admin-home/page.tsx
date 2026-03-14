import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AdminHomepage from '@/components/admin/AdminHomepage'

export default async function AdminHomePage() {
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

  // Fetch employee count
  const { data: employees } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'editor')

  const employeeCount = employees?.length || 0

  // Fetch portal access data
  const { data: portalAccess } = await supabase
    .from('employee_portal_access')
    .select('portal_id')

  const portalAccessData = [
    {
      portal: 'Video Editing',
      count:
        portalAccess?.filter((r) => r.portal_id === 'video-editing').length || 0,
    },
    {
      portal: 'Scheduling',
      count:
        portalAccess?.filter((r) => r.portal_id === 'scheduling').length || 0,
    },
    {
      portal: 'Payroll',
      count: portalAccess?.filter((r) => r.portal_id === 'payroll').length || 0,
    },
  ]

  // Fetch open pay period
  const { data: openPayPeriod } = await supabase
    .from('pay_periods')
    .select('*')
    .eq('is_open', true)
    .single()

  // Calculate estimated payroll (mock calculation)
  let estimatedPayroll = 0
  if (openPayPeriod) {
    const { data: payrollEntries } = await supabase
      .from('payroll_entries')
      .select('amount')
      .eq('pay_period_id', openPayPeriod.id)

    estimatedPayroll =
      payrollEntries?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0
  }

  return (
    <AdminHomepage
      employeeCount={employeeCount}
      portalAccessData={portalAccessData}
      openPayPeriod={openPayPeriod}
      estimatedPayroll={estimatedPayroll}
    />
  )
}
