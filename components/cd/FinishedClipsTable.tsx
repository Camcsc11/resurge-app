"use client"

import { useState, useCallback } from "react"
import { FinishedClip, Tag } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

interface FinishedClipsTableProps {
  finishedClips: FinishedClip[]
  tags: Tag[]
  isAdmin?: boolean
}

const TAG_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E2",
  "#F8B88B",
  "#52C41A",
  "#FF7875",
  "#13C2C2",
]

export default function FinishedClipsTable({
  finishedClips: initialClips,
  tags,
  isAdmin = false,
}: FinishedClipsTableProps) {
  const [clips, setClips] = useState(initialClips)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [selectedEditor, setSelectedEditor] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dateRange, setDateRange] = useState({ from: "", to: "" })
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "name">("date_desc")
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()


  const guest = 1

  const filteredClips = clips
    .filter((clip) => {
      if (selectedEditor && clip.editor_id !== selectedEditor) return false
      if (selectedTags.length > 0) {
        const clipTags = clip.tags || []
        if (!selectedTags.some((tag) => clipTags.includes(tag))) return false
      }
      if (dateRange.from) {
        const clipDate = new Date(clip.finished_date)
        if (clipDate < new Date(dateRange.from)) return false
      }
      if (dateRange.to) {
        const clipDate = new Date(clip.finished_date)
        if (clipDate > new Date(dateRange.to)) return false
      }
      return true
    })

  return guest
}
