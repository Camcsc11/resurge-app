"use client"

import { useState } from "react"
import { Profile } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

interface AddClipModalProps {
  editors: Profile[]
  onClose: () => void
  onSuccess: () => void
  createdBy: string
}

export default function AddClipModal({
  editors,
  onClose,
  onSuccess,
  createdBy,
}: AddClipModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    example_reel_url: "",
    due_date: "",
    assigned_editor_id: "",
    additional_notes: "",
  })

  const supabase = createClient()

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error("Clip name is required")
      }
      if (!formData.example_reel_url.trim()) {
        throw new Error("Example reel URL is required")
      }
      if (!formData.assigned_editor_id) {
        throw new Error("Please select an editor")
      }

      // Insert clip
      const { data: clipData, error: clipError } = await supabase
        .from("clips")
        .insert({
          name: formData.name.trim(),
          example_reel_url: formData.example_reel_url.trim(),
          due_date: formData.due_date || null,
          assigned_editor_id: formData.assigned_editor_id,
          additional_notes: formData.additional_notes.trim(),
          status: "assigned",
          created_by: createdBy,
        })
        .select()
        .single()

      if (clipError) throw clipError

      // Insert notification for assigned editor
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: formData.assigned_editor_id,
        type: "clip_assigned",
        title: "New Clip Assigned",
        message: `You have been assigned a new clip: ${formData.name}`,
        clip_id: clipData.id,
      })

      if (notifError) console.error("Error creating notification:", notifError)

      onSuccess()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create clip"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create New Clip</h2>
          <p className="text-gray-600 text-sm mt-1">Assign a new video clip to an editor</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Clip Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Clip Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Product Demo Intro"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={isLoading}
            />
          </div>

          {/* Example Reel URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Example Reel URL <span className="text-red-600">*</span>
            </label>
            <input
              type="url"
              name="example_reel_url"
              value={formData.example_reel_url}
              onChange={handleChange}
              placeholder="https://example.com/reel"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={isLoading}
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Due Date
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={isLoading}
            />
          </div>

          {/* Assigned Editor */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Assigned Editor <span className="text-red-600">*</span>
            </label>
            <select
              name="assigned_editor_id"
              value={formData.assigned_editor_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={isLoading}
            >
              <option value="">Select an editor</option>
              {editors.map((editor) => (
                <option key={editor.id} value={editor.id}>
                  {editor.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Additional Notes
            </label>
            <textarea
              name="additional_notes"
              value={formData.additional_notes}
              onChange={handleChange}
              placeholder="Any special instructions or context..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
