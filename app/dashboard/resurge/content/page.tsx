'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Clock, CheckCircle, PlayCircle } from 'lucide-react';

interface Assignment {
  id: string;
  status: string;
  assigned_at: string;
  completed_at: string | null;
  ofm_reels: {
    id: string;
    source_url: string;
    title: string;
    creator_handle: string;
    created_at: string;
  } | null;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-400" />;
    case 'in_progress':
      return <PlayCircle className="w-4 h-4 text-blue-400" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">Pending</span>;
    case 'in_progress':
      return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">In Progress</span>;
    case 'completed':
      return <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">Completed</span>;
    default:
      return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400">{status}</span>;
  }
}

function getNextStatus(current: string): string | null {
  switch (current) {
    case 'pending': return 'in_progress';
    case 'in_progress': return 'completed';
    default: return null;
  }
}

function getNextStatusLabel(current: string): string {
  switch (current) {
    case 'pending': return 'Start';
    case 'in_progress': return 'Complete';
    default: return '';
  }
}

export default function ContentCreationPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/content-assignments');
      const data = await res.json();
      if (data.assignments) setAssignments(data.assignments);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleStatusUpdate = async (assignmentId: string, newStatus: string) => {
    setUpdatingId(assignmentId);
    try {
      const res = await fetch('/api/content-assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignmentId, status: newStatus }),
      });

      if (res.ok) {
        fetchAssignments();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Content Creation</h1>

      {assignments.length === 0 ? (
        <div className="bg-[#1a1a2e] rounded-xl border border-white/10 p-12 text-center">
          <p className="text-gray-400 text-lg">No content assigned yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-[#1a1a2e] rounded-xl border border-white/10 p-4 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(assignment.status)}
                    {assignment.ofm_reels ? (
                      <a
                        href={assignment.ofm_reels.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1 truncate"
                      >
                        {assignment.ofm_reels.source_url}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-gray-500 text-sm">Reel unavailable</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 ml-7">
                    {getStatusBadge(assignment.status)}
                    <span className="text-xs text-gray-500">
                      Assigned {formatDate(assignment.assigned_at)}
                    </span>
                    {assignment.completed_at && (
                      <span className="text-xs text-green-500">
                        Completed {formatDate(assignment.completed_at)}
                      </span>
                    )}
                  </div>
                </div>

                {getNextStatus(assignment.status) && (
                  <button
                    onClick={() => handleStatusUpdate(assignment.id, getNextStatus(assignment.status)!)}
                    disabled={updatingId === assignment.id}
                    className="ml-4 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    {updatingId === assignment.id ? '...' : getNextStatusLabel(assignment.status)}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
