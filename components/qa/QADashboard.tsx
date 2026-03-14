"use client"

import { useState } from "react"
import { Submission, Profile } from "@/lib/types"
import QAReviewModal from "./QAReviewModal"

interface QADashboardProps {
  submissions: Submission[]
  profile: Profile
}

export default function QADashboard({ submissions, profile }: QADashboardProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)

  // Filter pending submissions
  const pendingSubmissions = submissions.filter((s) => s.status === "pending_qa")

  const handleReviewClick = (submission: Submission) => {
    setSelectedSubmission(submission)
    setShowReviewModal(true)
  }

  const handleReviewSuccess = () => {
    setShowReviewModal(false)
    setSelectedSubmission(null)
    // Refresh submissions
    window.location.reload()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">QA Review Queue</h1>
        <p className="mt-2 text-gray-600">Review and approve submitted clips</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-yellow-600 text-sm font-semibold">Pending Review</p>
          <p className="text-3xl font-bold text-yellow-900 mt-2">{pendingSubmissions.length}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-blue-600 text-sm font-semibold">Total Submissions</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{submissions.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-green-600 text-sm font-semibold">Approved</p>
          <p className="text-3xl font-bold text-green-900 mt-2">
            {submissions.filter((s) => s.status === "approved").length}
          </p>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Review Queue</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Clip Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Editor
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Round
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pendingSubmissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{submission.clip_name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {submission.editor_name}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
                      {submission.round_number}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleReviewClick(submission)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pendingSubmissions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>No pending submissions. All caught up!</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedSubmission && (
        <QAReviewModal
          submission={selectedSubmission}
          onClose={() => {
            setShowReviewModal(false)
            setSelectedSubmission(null)
          }}
          onSuccess={handleReviewSuccess}
          reviewerId={profile.id}
        />
      )}
    </div>
  )
}
