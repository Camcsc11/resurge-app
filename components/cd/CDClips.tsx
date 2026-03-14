"use client"

import StatusBadge from '@/components/StatusBadge'
import { formatDistanceToNow } from 'date-fns'

interface Clip {
  id: string
  name: string
  status: string
  created_at: string
  assigned_editor_id?: string
}

interface CDClipsProps {
  clips: Clip[]
}

export default function CDClips({ clips }: CDClipsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Clips</h1>
        <p className="text-gray-600 mt-2">
          Manage and track all clips
        </p>
      </div>

      {clips.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No clips yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
              </tr>
            </thead>
            <tbody>
              {clips.map((clip) => (
                <tr key={clip.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{clip.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <StatusBadge status={clip.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDistanceToNow(new Date(clip.created_at), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
