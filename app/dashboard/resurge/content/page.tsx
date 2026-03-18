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
  const fetchMyAssignments = async () => { try { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { data: creator } = await supabase.from('ofm_creators').select('id, name').eq('user_id', user.id).single(); if (!creator) { setLoading(false); return; } setCreatorName(creator.name); const res = await fetch(`/api/content-assignments?model_id=${creator.id}`); const data = await res.json(); if (data.assignments) setAssignments(data.assignments); } catch (err) { console.error('Failed:', err); } finally { setLoading(false); } };
  useEffect(() => { fetchMyAssignments(); }, []);
  const handleStatusUpdate = async (assignmentId: string, newStatus: string) => { setUpdatingId(assignmentId); try { const res = await fetch('/api/content-assignments', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: assignmentId, status: newStatus }) }); if (res.ok) fetchMyAssignments(); } catch (err) { console.error('Failed:', err); } finally { setUpdatingId(null); } };