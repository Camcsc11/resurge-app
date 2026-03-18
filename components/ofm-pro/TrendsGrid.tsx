'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, X } from 'lucide-react';

interface Reel {
  id: string;
  source_url: string;
  title: string;
  creator_handle: string;
  status: string;
  assigned_to: string | null;
  assigned_at: string | null;
  created_at: string;
  ofm_creators?: { id: string; name: string } | null;
}

interface Model {
  id: string;
  name: string;
  email: string;
}

function truncateUrl(url: string, maxLen = 45) {
  if (url.length <= maxLen) return url;
  return url.substring(0, maxLen) + '...';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">Pending</span>;
    case 'in_progress':
      return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">In Progress</span>;
    case 'completed':
      return <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">Completed</span>;
    case 'assigned':
      return <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">Assigned</span>;
    default:
      return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400">{status}</span>;
  }
}

export default function TrendsGrid() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [reelUrl, setReelUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReels = async () => {
    try {
      const res = await fetch('/api/reels');
      const data = await res.json();
      if (data.reels) setReels(data.reels);
    } catch (err) {
      console.error('Failed to fetch reels:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models');
      const data = await res.json();
      if (data.models) setModels(data.models);
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  };

  useEffect(() => {
    fetchReels();
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
        fetchReels();
      }
    } catch (err) {
      console.error('Failed to add reel:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/reels?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReels((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete reel:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Trends</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Reel
        </button>
      </div>

      {/* Reels Table */}
      <div className="bg-[#1a1a2e] rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Reel URL</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Assigned To</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Date Added</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reels.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  No reels added yet. Click &quot;+ Add Reel&quot; to get started.
                </td>
              </tr>
            ) : (
              reels.map((reel) => (
                <tr key={reel.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <a
                      href={reel.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                    >
                      {truncateUrl(reel.source_url)}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {reel.ofm_creators?.name ? (
                      <span className="text-sm text-white">{reel.ofm_creators.name}</span>
                    ) : (
                      <span className="text-sm text-gray-500">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(reel.status)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {formatDate(reel.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(reel.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors p-1"
                      title="Delete reel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Reel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a2e] rounded-xl border border-white/10 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Add Reel</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Reel Link */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Reel Link</label>
                <input
                  type="url"
                  value={reelUrl}
                  onChange={(e) => setReelUrl(e.target.value)}
                  placeholder="Paste Instagram Reel URL..."
                  className="w-full px-3 py-2 bg-[#0f0f1a] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Assign Model */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Assign Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f0f1a] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">— Select a model (optional) —</option>
                  {models.length === 0 ? (
                    <option disabled>No models available — add one in Creators</option>
                  ) : (
                    models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-white/10 text-gray-300 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddReel}
                  disabled={!reelUrl.trim() || submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
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
