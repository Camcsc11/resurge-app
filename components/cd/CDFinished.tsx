"use client"

import StatusBadge from '@/components/StatusBadge'
import { formatDistanceToNow } from 'date-fns'

interface Clip {
  id: string
  name: string
  status: string
  created_at: string
  completed_at?: string
  drive_view_link?: string
}

interface CDFinishedProps {
  clips: Clip[]
}

export default function CDFinished({ clips }: CDFinishedProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Finished Clips</h1>
        <p className="text-gray-600 mt-2">
          All completed clips ready for delivery
        </p>
      </div>

      {clips.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No finished clips yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Completed</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Link</th>
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
                    {clip.completed_at
                      ? formatDistanceToNow(new Date(clip.completed_at), { addSuffix: true })
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {clip.drive_view_link ? (
                      <a href={clip.drive_view_link} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline">View</a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
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
