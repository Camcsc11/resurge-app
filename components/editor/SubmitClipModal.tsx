"use client"

import { useState, useRef } from "react"
import { Clip } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

interface SubmitClipModalProps {
  clip: Clip
  onClose: () => void
  onSuccess: () => void
  editorId: string
}

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

export default function SubmitClipModal({
  clip,
  onClose,
  onSuccess,
  editorId,
}: SubmitClipModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [driveLink, setDriveLink] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add("border-blue-500", "bg-blue-50")
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("border-blue-500", "bg-blue-50")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("border-blue-500", "bg-blue-50")
    }

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      const selectedFile = droppedFiles[0]
      handleFileSelect(selectedFile)
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    setError(null)

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 500MB limit (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB)`)
      return
    }

    setFile(selectedFile)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    setUploadProgress(0)

    try {
      if (!file) {
        throw new Error("Please select a file to upload")
      }
      if (!driveLink.trim()) {
        throw new Error("Please provide a Google Drive link")
      }

      // Upload file to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`
      const storagePath = `clip-submissions/${editorId}/${clip.id}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("clip-submissions")
        .upload(storagePath, file)

      if (uploadError) throw uploadError

      setUploadProgress(100)

      // Create submission record
      const response = await fetch("/api/submit-clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId: clip.id,
          editorId,
          storagePath,
          driveUsedContentLink: driveLink.trim(),
          fileName: file.name,
          mimeType: file.type,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit clip")
      }

      onSuccess()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit clip"
      setError(message)
      setUploadProgress(0)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Submit Clip for QA</h2>
          <p className="text-gray-600 text-sm mt-1">Clip: {clip.name}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Upload File <span className="text-red-600">*</span>
            </label>
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition"
            >
              <div className="space-y-2">
                <svg
                  className="w-8 h-8 text-gray-400 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Drag and drop your file here
                  </p>
                  <p className="text-xs text-gray-500 mt-1">or</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50"
                >
                  Browse files
                </button>
                <p className="text-xs text-gray-500">Max 500MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                disabled={isLoading}
                className="hidden"
                accept="video/*"
              />
            </div>

            {file && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(1)}MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Drive Link */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Drive link to raw assets used <span className="text-red-600">*</span>
            </label>
            <input
              type="url"
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              placeholder="https://drive.google.com/..."
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50"
            />
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Uploading...</span>
                <span className="text-gray-900 font-semibold">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

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
              disabled={isLoading || !file}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? "Uploading..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
