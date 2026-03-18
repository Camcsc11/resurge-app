'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Clock, CheckCircle, Paintbrush } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
    case 'in_creation':
      return <Paintbrush className="w-4 h-4 text-blue-400" />;
    case 'finished':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">Pending</span>;
    case 'in_creation':
      return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">In Creation</span>;
    case 'finished':
      return <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">Finished</span>;
    default:
      return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400">{status}</span>;
  }
}

function getNextStatus(current: string): string | null {
  switch (current) {
    case 'pending': return 'in_creation';
    case 'in_creation': return 'finished';
    default: return null;
  }
}

function getNextStatusLabel(current: string): string {
  switch (current) {
    case 'pending': return 'Start Creating';
    case 'in_creation': return 'Mark Finished';
    default: return '';
  }
}

export default function ContentCreationPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState('');
  const supabase = createClient();

  const fetchMyAssignments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find this user's ofm_creators record
      const { data: creator } = await supabase
        .from('ofm_creators')
        .select('id, name')
        .eq('user_id', user.id)
        .single();

      if (!creator) {
        setLoading(false);
        return;
      }

      setCreatorName(creator.name);

      // Fetch only MY assignments
      const res = await fetch(`/api/content-assignments?model_id=${creator.id}`);
      const data = await res.json();
      if (data.assignments) setAssignments(data.assignments);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAssignments();
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
        fetchMyAssignments();
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Assigned Reels</h1>
        {creatorName && (
          <p className="text-sm text-gray-400 mt-1">Welcome back, {creatorName}</p>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="bg-[#1a1a2e] rounded-xl border border-white/10 p-12 text-center">
          <p className="text-gray-400 text-lg">No reels assigned to you yet.</p>
          <p className="text-gray-500 text-sm mt-2">Check back soon — your team will assign reels here.</p>
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
                        Finished {formatDate(assignment.completed_at)}
                      </span>
                    )}
                  </div>
                </div>

                {getNextStatus(assignment.status) && (
                  <button
                    onClick={() => handleStatusUpdate(assignment.id, getNextStatus(assignment.status)!)}
                    disabled={updatingId === assignment.id}
                    className={`ml-4 px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      assignment.status === 'pending'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
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
