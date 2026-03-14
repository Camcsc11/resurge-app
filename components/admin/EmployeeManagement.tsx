"use client"

import { useState, useEffect } from 'react'
import { Profile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Search } from 'lucide-react'

interface EmployeeManagementProps {
  employees: Profile[]
  portalAccessRecords: { user_id: string; portal_id: string }[]
}

type RoleFilter = 'all' | 'admin' | 'cd' | 'editor' | 'qa'

const portals = [
  { id: 'video-editing', name: 'Video Editing' },
  { id: 'scheduling', name: 'Scheduling' },
  { id: 'payroll', name: 'Payroll' },
]

export default function EmployeeManagement({
  employees,
  portalAccessRecords,
}: EmployeeManagementProps) {
  const supabase = createClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [access, setAccess] = useState<Record<string, Set<string>>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  // Initialize access state
  useEffect(() => {
    const accessMap: Record<string, Set<string>> = {}
    employees.forEach((emp) => {
      accessMap[emp.id] = new Set(
        portalAccessRecords
          .filter((r) => r.user_id === emp.id)
          .map((r) => r.portal_id)
      )
    })
    setAccess(accessMap)
  }, [employees, portalAccessRecords])

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole =
      roleFilter === 'all' || emp.role?.toLowerCase() === roleFilter.toLowerCase()

    return matchesSearch && matchesRole
  })

  const handleAccessToggle = async (userId: string, portalId: string) => {
    setLoading({ ...loading, [`${userId}-${portalId}`]: true })

    const userAccess = access[userId] || new Set()
    const hasAccess = userAccess.has(portalId)

    try {
      if (hasAccess) {
        // Delete access
        await supabase
          .from('employee_portal_access')
          .delete()
          .eq('user_id', userId)
          .eq('portal_id', portalId)

        const newAccess = new Set(userAccess)
        newAccess.delete(portalId)
        setAccess({ ...access, [userId]: newAccess })
      } else {
        // Insert access
        await supabase.from('employee_portal_access').insert({
          user_id: userId,
          portal_id: portalId,
        })

        const newAccess = new Set(userAccess)
        newAccess.add(portalId)
        setAccess({ ...access, [userId]: newAccess })
      }
    } catch (error) {
      console.error('Error toggling access:', error)
    } finally {
      setLoading({ ...loading, [`${userId}-${portalId}`]: false })
    }
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Employee Portal Access Management</h1>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Employee</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Filter by Role</label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'admin', 'cd', 'editor', 'qa'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    roleFilter === role
                      ? 'bg-blue-900 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                  {portals.map((portal) => (
                    <th
                      key={portal.id}
                      className="px-6 py-4 text-center text-sm font-semibold text-gray-900"
                    >
                      {portal.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {employee.display_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{employee.email || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="inline-block bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-xs font-semibold">
                          {employee.role || 'User'}
                        </span>
                      </td>
                      {portals.map((portal) => {
                        const userAccess = access[employee.id] || new Set()
                        const hasAccess = userAccess.has(portal.id)
                        const isLoading = loading[`${employee.id}-${portal.id}`]

                        return (
                          <td
                            key={`${employee.id}-${portal.id}`}
                            className="px-6 py-4 text-center"
                          >
                            <input
                              type="checkbox"
                              checked={hasAccess}
                              onChange={() => handleAccessToggle(employee.id, portal.id)}
                              disabled={isLoading}
                              className="w-5 h-5 text-blue-900 rounded focus:ring-2 focus:ring-blue-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3 + portals.length} className="px-6 py-8 text-center text-gray-500">
                      No employees found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Total Employees:</span> {filteredEmployees.length} /{' '}
            {employees.length}
          </p>
        </div>
      </div>
    </div>
  )
}
