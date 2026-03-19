'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ExternalLink, Download, Check, X } from 'lucide-react';

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
}: {
  assignment: Assignment;
  onClose: () => void;
  onApprove: (assignmentId: string) => void;
  onRequestChanges: (assignmentId: string, notes: string) => void;
}) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <div className="h-full overflow-y-auto bg-[#0f0f1a]">
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Content Pipeline</h1>
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
              'in_editing',
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
        />
      )}
    </div>
  );
}
