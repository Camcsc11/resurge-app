"use client"

import { useState } from 'react'
import { Clip, Profile } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import ClipDetailModal from '@/components/ClipDetailModal'
import EditClipModal from '@/components/cd/EditClipModal'
import AddClipModal from '@/components/cd/AddClipModal'
import { Plus, Edit2, Trash2, Film, Users, Settings } from 'lucide-react'

interface AdminDashboardProps {
  clips: Clip[]
  editors: Profile[]
  profile: Profile
}

type TabType = 'pipeline' | 'editors' | 'manage'
type StatusType = 'assigned' | 'in_progress' | 'in_qa' | 'needs_revision' | 'approved'

export default function AdminDashboard({ clips, editors, profile }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('pipeline')
  const [selectedEditor, setSelectedEditor] = useState<string | null>(null)
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingClip, setEditingClip] = useState<Clip | null>(null)

  const statuses: StatusType[] = ['assigned', 'in_progress', 'in_qa', 'needs_revision', 'approved']
  const statusLabels: Record<StatusType, string> = {
    assigned: 'Assigned',
    in_progress: 'In Progress',
    in_qa: 'In QA',
    needs_revision: 'Needs Revision',
    approved: 'Approved',
  }

  // Filter clips by selected editor
  const filteredClips = selectedEditor
    ? clips.filter((clip) => clip.editor_id === selectedEditor)
    : clips

  // Get clips by status
  const clipsByStatus = (status: StatusType) => {
    return filteredClips.filter((clip) => clip.status === status)
  }

  // Count by status
  const getStatusCount = (status: StatusType) => {
    return clips.filter((clip) => clip.status === status).length
  }

  const handleEditClip = (clip: Clip) => {
    setEditingClip(clip)
    setShowEditModal(true)
  }

  const handleDeleteClip = (clip: Clip) => {
    // Delete logic handled by parent or modal
    console.log('Delete clip:', clip.id)
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          {activeTab === 'manage' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Clip
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-lg transition-colors border-b-2 ${
              activeTab === 'pipeline'
                ? 'text-blue-900 border-blue-900'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <Film className="w-5 h-5" />
            Pipeline
          </button>
          <button
            onClick={() => setActiveTab('editors')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-lg transition-colors border-b-2 ${
              activeTab === 'editors'
                ? 'text-blue-900 border-blue-900'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <Users className="w-5 h-5" />
            Editors
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-lg transition-colors border-b-2 ${
              activeTab === 'manage'
                ? 'text-blue-900 border-blue-900'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <Settings className="w-5 h-5" />
            Manage Clips
          </button>
        </div>

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div>
            {/* Stats Row */}
            <div className="grid grid-cols-5 gap-4 mb-8">
              {statuses.map((status) => (
                <div
                  key={status}
                  className="bg-white rounded-lg shadow-sm p-4 border-t-4 border-blue-900"
                >
                  <p className="text-gray-600 text-sm font-medium">{statusLabels[status]}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{getStatusCount(status)}</p>
                </div>
              ))}
            </div>

            {/* Editor Filter */}
            <div className="mb-8">
              <p className="text-sm font-medium text-gray-700 mb-3">Filter by Editor:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedEditor(null)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    selectedEditor === null
                      ? 'bg-blue-900 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                {editors.map((editor) => (
                  <button
                    key={editor.id}
                    onClick={() => setSelectedEditor(editor.id)}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                      selectedEditor === editor.id
                        ? 'bg-blue-900 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {editor.display_name}
                  </button>
                ))}
              </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-5 gap-4 overflow-x-auto">
              {statuses.map((status) => (
                <div key={status} className="flex-shrink-0 w-72">
                  <div className="bg-gray-100 rounded-lg p-4 min-h-96">
                    <h3 className="font-semibold text-gray-900 mb-4">{statusLabels[status]}</h3>
                    <div className="space-y-3">
                      {clipsByStatus(status).map((clip) => (
                        <div
                          key={clip.id}
                          onClick={() => {
                            setSelectedClip(clip)
                            setShowDetailModal(true)
                          }}
                          className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-blue-900"
                        >
                          <p className="font-semibold text-gray-900 text-sm mb-2">{clip.title}</p>
                          {clip.editor_id && (
                            <p className="text-xs text-gray-600 mb-2">
                              {editors.find((e) => e.id === clip.editor_id)?.display_name || 'Unknown'}
                            </p>
                          )}
                          {clip.due_date && (
                            <p className="text-xs text-gray-500 mb-2">
                              Due: {new Date(clip.due_date).toLocaleDateString()}
                            </p>
                          )}
                          <div className="flex justify-between items-center">
                            <StatusBadge status={clip.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Editors Tab */}
        {activeTab === 'editors' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Assigned Clips
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    In Progress
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Completed</th>
                </tr>
              </thead>
              <tbody>
                {editors.map((editor) => {
                  const assignedCount = clips.filter(
                    (c) => c.editor_id === editor.id && c.status === 'assigned'
                  ).length
                  const inProgressCount = clips.filter(
                    (c) => c.editor_id === editor.id && c.status === 'in_progress'
                  ).length
                  const completedCount = clips.filter(
                    (c) => c.editor_id === editor.id && c.status === 'approved'
                  ).length

                  return (
                    <tr key={editor.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {editor.display_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{editor.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{assignedCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{inProgressCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{completedCount}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Manage Clips Tab */}
        {activeTab === 'manage' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Editor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Due Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clips.map((clip) => (
                  <tr key={clip.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{clip.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {editors.find((e) => e.id === clip.editor_id)?.display_name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <StatusBadge status={clip.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {clip.due_date ? new Date(clip.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm flex items-center gap-2">
                      <button
                        onClick={() => handleEditClip(clip)}
                        className="text-blue-900 hover:text-blue-700 transition-colors p-2"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClip(clip)}
                        className="text-red-600 hover:text-red-700 transition-colors p-2"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showDetailModal && selectedClip && (
        <ClipDetailModal
          clip={selectedClip}
          onClose={() => setShowDetailModal(false)}
          editors={editors}
        />
      )}

      {showEditModal && editingClip && (
        <EditClipModal
          clip={editingClip}
          editors={editors}
          onClose={() => {
            setShowEditModal(false)
            setEditingClip(null)
          }}
        />
      )}

      {showAddModal && (
        <AddClipModal
          editors={editors}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
