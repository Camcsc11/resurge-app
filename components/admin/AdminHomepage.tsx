"use client"

import { Users, DollarSign, Shield } from 'lucide-react'
import Link from 'next/link'

interface AdminHomepageProps {
  employeeCount: number
  portalAccessData: { portal: string; count: number }[]
  openPayPeriod: any
  estimatedPayroll: number
}

export default function AdminHomepage({
  employeeCount,
  portalAccessData,
  openPayPeriod,
  estimatedPayroll,
}: AdminHomepageProps) {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Command Center</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Employees Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{employeeCount}</p>
              </div>
              <Users className="text-blue-900 w-12 h-12 opacity-80" />
            </div>
          </div>

          {/* Estimated Payroll Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Estimated Payroll</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${estimatedPayroll.toFixed(2)}
                </p>
                {openPayPeriod && (
                  <p className="text-xs text-gray-500 mt-2">
                    Current period ends: {new Date(openPayPeriod.end_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <DollarSign className="text-blue-900 w-12 h-12 opacity-80" />
            </div>
          </div>

          {/* Portal Access Cards */}
          {portalAccessData.map((item) => (
            <div key={item.portal} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{item.portal} Access</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{item.count}</p>
                </div>
                <Shield className="text-blue-900 w-12 h-12 opacity-80" />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Portal Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/dashboard/admin/employees"
              className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Manage Employees
            </Link>
            <Link
              href="/dashboard/admin"
              className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Video Pipeline
            </Link>
            <Link
              href="/dashboard/admin/finished"
              className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Finished Clips
            </Link>
            <Link
              href="/dashboard/admin/payroll"
              className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Payroll
            </Link>
          </div>
        </div>
      </div>
    </div>
  (Š