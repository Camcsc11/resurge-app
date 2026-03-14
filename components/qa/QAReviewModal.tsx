"use client"

import { useState } from "react"
import { Submission } from "@/lib/types"

interface QAReviewModalProps {
  submission: Submission
  onClose: () => void
  onSuccess: () => void
  reviewerId: string
}

export default function QAReviewModal({
  submission,
  onClose,
  onSuccess,
  reviewerId,
}: QAReviewModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checks, setChecks] = useState({
    is_4k_60fps: false,
    appropriate_length: false,
    subtitle_style_correct: false,
    overall_quality_acceptable: false,
  })
  const [notes, setNotes] = useState("")
  const [decision, setDecision] = useState<"approve" | "revision" | null>(null)

  const handleCheckChange = (key: keyof typeof checks) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const allChecksPassed = Object.values(checks).every((v) => v)

  const handleSubmitReview = async (selectedDecision: "approve" | "revision") => {
    setError(null)

    // Validate
    if (selectedDecision === "revision" && !notes.trim()) {
      setError("QA Notes are required when denying a submission")
      return
    }

    if (selectedDecision === "approve" && !allChecksPassed) {
      const response = confirm(
        "Not all checks are marked as complete. Continue with approval?"
      )
      if (!response) return
    }

    setIsLoading(true)
    setDecision(selectedDecision)

    try {
      const response = await fetch("/api/qa-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submission.id,
          clipId: submission.clip_id,
          reviewerId,
          decision: selectedDecision,
          checks: {
            is_4k_60fps: checks.is_4k_60fps,
            appropriate_length: checks.appropriate_length,
            subtitle_style_correct: checks.subtitle_style_correct,
            overall_quality_acceptable: checks.overall_quality_acceptable,
          },
          notes: notes.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit review")
      }

      onSuccess()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit review"
      setError(message)
      setIsLoading(false)
      setDecision(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">QA Review</h2>
          <p className="text-gray-600 text-sm mt-1">Clip: {submission.clip_name}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Submission Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Editor</p>
                <p className="font-semibold text-gray-900">{submission.editor_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Submission Round</p>
                <p className="font-semibold text-gray-900">Round {submission.round_number}</p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">View Submission</p>
              <a
                href={submission.storage_path || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Open in Storage
              </a>
            </div>
            {submission.drive_used_content_link && (
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Example Reel</p>
                <a
                  href={submission.drive_used_content_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  View Drive Assets
                </a>
              </div>
            )}
          </div>

          {/* QA Checklist */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900">QA Checklist</p>
            <div className="space-y-2">
              {[
                { key: "is_4k_60fps", label: "Is it 4K 60fps?" },
                { key: "appropriate_length", label: "Appropriate length?" },
                { key: "subtitle_style_correct", label: "Subtitle style correct?" },
                {
                  key: "overall_quality_acceptable",
                  label: "Overall quality acceptable?",
                },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks[key as keyof typeof checks]}
                    onChange={() => handleCheckChange(key as keyof typeof checks)}
                    disabled={isLoading}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-700 font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* QA Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              QA Notes {decision === "revision" && <span className="text-red-600">*</span>}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Required if denying submission. Provide feedback for the editor..."
              rows={4}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none disabled:opacity-50"
            />
          </div>

          {/* Check Status */}
          {!allChecksPassed && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-700">
                Not all checks passed. Approving will override missing checklist items.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmitReview("revision")}
              disabled={isLoading || decision === "approve"}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {isLoading && decision === "revision" ? "Submitting..." : "Needs Revision"}
            </button>
            <button
              onClick={() => handleSubmitReview("approve")}
              disabled={isLoading || decision === "revision"}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {isLoading && decision === "approve" ? "Approving..." : "Approve"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
