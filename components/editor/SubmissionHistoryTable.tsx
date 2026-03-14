"use client"

import StatusBadge from '@/components/StatusBadge'
import { formatDistanceToNow } from 'date-fns'

interface Submission {
  id: string
  round: number
  status: string
  submitted_at: string
  drive_view_link?: string
  clip?: {
    id: string
    name: string
    status: string
  }
}

interface SubmissionHistoryTableProps {
  submissions: Submission[]
}

export default function SubmissionHistoryTable({ submissions }: SubmissionHistoryTableProps) {
  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No submissions yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Clip</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Round</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Submitted</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Link</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {submission.clip?.name || 'Unknown Clip'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                Round {submission.round}
              </td>
              <td className="px-6 py-4 text-sm">
                <StatusBadge status={submission.status} />
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
              </td>
              <td className="px-6 py-4 text-sm">
                {submission.drive_view_link ? (
                  <a
                    href={submission.drive_view_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    View
                  </a>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
