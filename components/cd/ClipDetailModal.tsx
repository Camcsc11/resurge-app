"use client"

import { useState, useEffect } from "react"
import { Clip, Submission } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import StatusBadge from "@/components/StatusBadge"

interface ClipDetailModalProps {
  clip: Clip
  onClose: () => void
}

export default function ClipDetailModal({ clip, onClose }: ClipDetailModalProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("submissions")
          .select("*")
          .eq("clip_id", clip.id)
          .order("created_at", { ascending: false })

        if (fetchError) throw fetchError
        setSubmissions(data || [])
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load submissions"
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubmissions()
  }, [clip.id, supabase])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{clip.name}</h2>
            <div className="mt-2">
              <StatusBadge status={clip.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition"
          >
            ×
          </button>
        </div>

        {/* Clip Details */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-sm text-gray-600 font-medium">Example Reel</p>
            <a
              href={clip.example_reel_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all text-sm"
            >
              {clip.example_reel_url}
            </a>
          </div>
          {clip.due_date && (
            <div>
              <p className="text-sm text-gray-600 font-medium">Due Date</p>
              <p className="text-gray-900 font-semibold">
                {new Date(clip.due_date).toLocaleDateString()}
              </p>
            </div>
          )}
          {clip.additional_notes && (
            <div>
              <p className="text-sm text-gray-600 font-medium">Notes</p>
              <p className="text-gray-900">{clip.additional_notes}</p>
            </div>
          )}
          {clip.created_at && (
            <div>
              <p className="text-sm text-gray-600 font-medium">Created</p>
              <p className="text-gray-900 text-sm">
                {new Date(clip.created_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Submissions */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Submission History</h3>

          {isLoading ? (
            <p className="text-gray-500 text-sm">Loading submissions...</p>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          ) : submissions.length === 0 ? (
            <p className="text-gray-500 text-sm">No submissions yet.</p>
          ) : (
            <div className="space-y-2">
              {submissions.map((submission, index) => (
                <div
                  key={submission.id}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">
                      Round {submission.round_number}
                    </p>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        submission.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : submission.status === "pending_qa"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {submission.status === "approved"
                        ? "Approved"
                        : submission.status === "pending_qa"
                        ? "Pending QA"
                        : "Needs Revision"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>
                      Submitted:{" "}
                      {new Date(submission.created_at).toLocaleString()}
                    </p>
                    {submission.qa_notes && (
                      <p className="italic">
                        QA Notes: {submission.qa_notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
