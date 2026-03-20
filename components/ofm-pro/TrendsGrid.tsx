'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ExternalLink, Download, Check, X, Plus, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type AssignmentStatus =
  | 'pending'
  | 'in_creation'
  | 'submitted'
  | 'approved_for_editing'
  | 'in_editing'
  | 'pending_review'
  | 'ready_for_posting'
  | 'posted';

interface Reel {
  id: string;
  title: string;
  description: string;
  source_url: string;
}

interface Creator {
  id: string;
  name: string;
  email: string;
}

interface Assignment {
  id: string;
  reel_id: string;
  model_id: string;
  status: AssignmentStatus;
  assigned_at: string;
  submission_url: string | null;
  submission_notes: string | null;
  edited_url: string | null;
  editor_id: string | null;
  review_notes: string | null;
  posted_at: string | null;
  ofm_reels: Reel;
  ofm_creators: Creator;
}

function getStatusBadge(status: AssignmentStatus): { bg: string; label: string } {
  const badges: Record<AssignmentStatus, { bg: string; label: string }> = {
    pending: { bg: 'bg-gray-600', label: 'Pending' },
    in_creation: { bg: 'bg-blue-600', label: 'In Creation' },
    submitted: { bg: 'bg-purple-600', label: 'Submitted' },
    approved_for_editing: { bg: 'bg-indigo-600', label: 'Approved for Editing' },
    in_editing: { bg: 'bg-orange-600', label: 'In Editing' },
    pending_review: { bg: 'bg-pink-600', label: 'Pending Review' },
    ready_for_posting: { bg: 'bg-green-600', label: 'Ready for Posting' },
    posted: { bg: 'bg-teal-600', label: 'Posted' },
  };
  return badges[status] || { bg: 'bg-gray-500', label: status };
}

function AssignmentDetailModal({
  assignment,
  onClose,
  onApprove,
  onRequestChanges,
  onUploadEdited,
}: {
  assignment: Assignment;
  onClose: () => void;
  onApprove: (assignmentId: string) => void;
  onRequestChanges: (assignmentId: string, notes: string) => void;
  onUploadEdited: (assignmentId: string, file: File) => Promise<void>;
}) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const canApprove =
    assignment.status === 'submitted' ||
    assignment.status === 'pending_review';

  const canRequestChanges =
    assignment.status === 'submitted' ||
    assignment.status === 'pending_review';

  const handleApprove = () => {
    setIsSubmitting(true);
    onApprove(assignment.id);
    setTimeout(() => setIsSubmitting(false), 500);
  };

  const handleRequestChanges = () => {
    if (!reviewNotes.trim()) {
      alert('Please enter feedback');
      return;
    }
    setIsSubmitting(true);
    onRequestChanges(assignment.id, reviewNotes);
    setTimeout(() => setIsSubmitting(false), 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">
          {assignment.ofm_reels.title}
        </h2>

        {/* Creator Info */}
        <div className="mb-6 p-4 bg-black/30 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400">
            <strong>Creator:</strong> {assignment.ofm_creators.name} (
            {assignment.ofm_creators.email})
          </p>
          <p className="text-sm text-gray-400 mt-2">
            <strong>Status:</strong>{' '}
            <span className={`${getStatusBadge(assignment.status).bg} text-white text-xs px-2 py-1 rounded`}>
              {getStatusBadge(assignment.status).label}
            </span>
          </p>
        </div>

        {/* Example Reel Link */}
        {assignment.ofm_reels.source_url && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Example Reel
            </h3>
            <a
              href={assignment.ofm_reels.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              View Example
            </a>
          </div>
        )}

        {/* Submission Video */}
        {assignment.submission_url && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Submission Video
            </h3>
            <a
              href={assignment.submission_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              <Download className="w-4 h-4" />
              Download Submission
            </a>
            {assignment.submission_notes && (
              <p className="text-sm text-gray-400 mt-2 p-2 bg-black/30 rounded">
                <strong>Notes:</strong> {assignment.submission_notes}
              </p>
            )}
          </div>
        )}

        {/* Edited Video */}
        {assignment.edited_url && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Edited Video
            </h3>
            <a
              href={assignment.edited_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 text-sm"
            >
              <Download className="w-4 h-4" />
              Download Edited Version
            </a>
          </div>
        )}

        {/* Start Editing - transition from approved_for_editing to in_editing */}
        {assignment.status === 'approved_for_editing' && (
          <div className="mb-6">
            <button
              onClick={() => {
                setIsSubmitting(true);
                onApprove(assignment.id);
                setTimeout(() => setIsSubmitting(false), 500);
              }}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Start Editing
            </button>
          </div>
        )}

        {/* Editor Upload - for in_editing assignments */}
        {assignment.status === 'in_editing' && (
          <div className="mb-6 p-4 bg-black/20 border border-orange-500/30 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              Upload Edited Video
            </h3>
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={async (e) => {
                const file = e.currentTarget.files?.[0];
                if (file) {
                  setIsUploading(true);
                  setUploadError(null);
                  try {
                    await onUploadEdited(assignment.id, file);
                  } catch (err) {
                    setUploadError(err instanceof Error ? err.message : 'Upload failed');
                  } finally {
                    setIsUploading(false);
                  }
                }
              }}
              disabled={isUploading}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-600 file:text-white hover:file:bg-orange-500"
            />
            {isUploading && (
              <p className="text-sm text-orange-400 mt-2">Uploading edited video and submitting for review...</p>
            )}
            {uploadError && (
              <p className="text-sm text-red-400 mt-1">{uploadError}</p>
            )}
          </div>
        )}

        {/* Review Notes */}
        {(canApprove || canRequestChanges) && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Review Notes
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add feedback or approval notes..."
              className="w-full bg-[#0f0f1a] border border-gray-700 text-white px-3 py-2 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
              rows={4}
            />
          </div>
        )}

        {/* Action Buttons */}
        {(canApprove || canRequestChanges) && (
          <div className="flex gap-3 justify-end">
            {canRequestChanges && (
              <button
                onClick={handleRequestChanges}
                disabled={isSubmitting || !reviewNotes.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-600/50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Request Changes
              </button>
            )}
            {canApprove && (
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Check className="w-4 h-4" />
                Approve
              </button>
            )}
          </div>
        )}

        {/* Existing Review Notes */}
        {assignment.review_notes && (
          <div className="mt-6 p-4 bg-black/30 border border-gray-700 rounded-lg">
            <p className="text-sm text-gray-400">
              <strong>Previous Review Notes:</strong>
            </p>
            <p className="text-sm text-gray-300 mt-2">{assignment.review_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrendsGrid() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | 'all'>(
    'all'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [reelUrl, setReelUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [models, setModels] = useState<{id: string; name: string; email: string}[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch('/api/models');
        const data = await res.json();
        if (data.models) setModels(data.models);
      } catch (err) {
        console.error('Failed to fetch models:', err);
      }
    };
    fetchModels();
  }, []);

  const handleAddReel = async () => {
    if (!reelUrl.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: reelUrl.trim(),
          assigned_to: selectedModel || undefined,
        }),
      });
      if (res.ok) {
        setReelUrl('');
        setSelectedModel('');
        setShowAddModal(false);
        // Refresh assignments
        const r = await fetch('/api/content-assignments');
        const d = await r.json();
        if (d.assignments) setAssignments(d.assignments);
      }
    } catch (err) {
      console.error('Failed to add reel:', err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await fetch('/api/content-assignments');
        const data = await res.json();
        if (data.assignments) setAssignments(data.assignments);
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const filteredAssignments = useMemo(() => {
    if (statusFilter === 'all') return assignments;
    if (statusFilter === 'pending_review') {
      return assignments.filter((a) => a.status === 'pending_review' || a.status === 'approved_for_editing' || a.status === 'in_editing');
    }
    return assignments.filter((a) => a.status === statusFilter);
  }, [assignments, statusFilter]);

  const handleApprove = async (assignmentId: string) => {
    setIsLoading(true);
    try {
      const currentAssignment = assignments.find(
        (a) => a.id === assignmentId
      );
      const newStatus =
        currentAssignment?.status === 'submitted'
          ? 'approved_for_editing'
          : currentAssignment?.status === 'approved_for_editing'
            ? 'in_editing'
            : 'ready_for_posting';

      const response = await fetch('/api/content-assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          new_status: newStatus,
        }),
      });

      if (!response.ok) throw new Error('Approval failed');

      const data = await response.json();
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? { ...a, ...data.assignment }
            : a
        )
      );
      setSelectedAssignment(null);
    } catch (error) {
      console.error('Approval error:', error);
      alert('Failed to approve');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestChanges = async (
    assignmentId: string,
    notes: string
  ) => {
    setIsLoading(true);
    try {
      const currentAssignment = assignments.find(
        (a) => a.id === assignmentId
      );
      const newStatus =
        currentAssignment?.status === 'submitted'
          ? 'in_creation'
          : 'in_editing';

      const response = await fetch('/api/content-assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          new_status: newStatus,
          review_notes: notes,
        }),
      });

      if (!response.ok) throw new Error('Request failed');

      const data = await response.json();
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? { ...a, ...data.assignment }
            : a
        )
      );
      setSelectedAssignment(null);
    } catch (error) {
      console.error('Request changes error:', error);
      alert('Failed to request changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadEdited = async (assignmentId: string, file: File) => {
    const supabase = createClient();
    const filePath = `${assignmentId}/edited.mp4`;

    const { error: uploadError } = await supabase.storage
      .from('content-submissions')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      throw new Error(uploadError.message || 'Upload failed');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('content-submissions')
      .getPublicUrl(filePath);

    const res = await fetch('/api/content-assignments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment_id: assignmentId,
        new_status: 'pending_review',
        edited_url: publicUrl,
      }),
    });

    if (!res.ok) throw new Error('Failed to update assignment');

    const data = await res.json();
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId ? { ...a, ...data.assignment } : a
      )
    );
    setSelectedAssignment(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0f0f1a]">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-white">Content Pipeline</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Reel
          </button>
        </div>
        <p className="text-gray-400 mb-6">Track and manage all content assignments</p>

        {/* Status Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-[#1a1a2e] border border-gray-700 text-gray-300 hover:text-white'
            }`}
          >
            All
          </button>
          {(
            [
              'pending',
              'in_creation',
              'submitted',
              'approved_for_editing',
              'pending_review',
              'ready_for_posting',
              'posted',
            ] as AssignmentStatus[]
          ).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? `${getStatusBadge(status).bg} text-white`
                  : 'bg-[#1a1a2e] border border-gray-700 text-gray-300 hover:text-white'
              }`}
            >
              {getStatusBadge(status).label}
            </button>
          ))}
        </div>

        {/* Assignments Table */}
        {filteredAssignments.length === 0 ? (
          <div className="bg-[#1a1a2e] border border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-400">No assignments with selected filter</p>
          </div>
        ) : (
          <div className="bg-[#1a1a2e] border border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-black/30">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Reel
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Assigned
                  </th>
                  {statusFilter === 'pending_review' && (
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                      Upload Finished Reel
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => (
                  <tr
                    key={assignment.id}
                    onClick={() => setSelectedAssignment(assignment)}
                    className="border-b border-gray-700 hover:bg-black/20 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-white font-medium">
                      {assignment.ofm_reels.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {assignment.ofm_creators.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`${getStatusBadge(assignment.status).bg
                          } text-white text-xs px-2 py-1 rounded-full inline-block`}
                      >
                        {getStatusBadge(assignment.status).label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </td>
                    {statusFilter === 'pending_review' && (
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        {(assignment.status === 'approved_for_editing' || assignment.status === 'in_editing') ? (
                          <input
                            type="file"
                            accept="video/mp4,video/quicktime,video/webm"
                            onChange={async (e) => {
                              const file = e.currentTarget.files?.[0];
                              if (file) {
                                try { await handleUploadEdited(assignment.id, file); } catch (err) { alert(err instanceof Error ? err.message : 'Upload failed'); }
                              }
                            }}
                            className="block w-full text-xs text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-600 file:text-white hover:file:bg-orange-500"
                          />
                        ) : (
                          <span className="text-xs text-green-400">Uploaded</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedAssignment && (
        <AssignmentDetailModal
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          onApprove={handleApprove}
          onRequestChanges={handleRequestChanges}
          onUploadEdited={handleUploadEdited}
        />
      )}

      {/* Add Reel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a2e] rounded-xl border border-gray-700 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Add Reel</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Reel Link</label>
                <input
                  type="url"
                  value={reelUrl}
                  onChange={(e) => setReelUrl(e.target.value)}
                  placeholder="Paste Instagram Reel URL..."
                  className="w-full px-3 py-2 bg-[#0f0f1a] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Assign Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f0f1a] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Select a model (optional) —</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddReel}
                  disabled={!reelUrl.trim() || submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                >
                  {submitting ? 'Adding...' : 'Add Reel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
