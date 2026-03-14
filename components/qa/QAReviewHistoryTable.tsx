"use client"

import StatusBadge from '@/components/StatusBadge'
import { formatDistanceToNow } from 'date-fns'

interface QAReview {
  id: string
  status: string
  feedback?: string
  reviewed_at: string
  submission?: {
    id: string
    round: number
    status: string
    clip?: {
      id: string
      name: string
      status: string
    }
  }
}

interface QAReviewHistoryTableProps {
  qaReviews: QAReview[]
}

export default function QAReviewHistoryTable({ qaReviews }: QAReviewHistoryTableProps) {
  if (qaReviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No reviews yet</p>
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
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Result</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Feedback</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Reviewed</th>
          </tr>
        </thead>
        <tbody>
          {qaReviews.map((review) => (
            <tr key={review.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {review.submission?.clip?.name || 'Unknown Clip'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                Round {review.submission?.round || '-'}
              </td>
              <td className="px-6 py-4 text-sm">
                <StatusBadge status={review.status} />
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                {review.feedback || '-'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {formatDistanceToNow(new Date(review.reviewed_at), { addSuffix: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
