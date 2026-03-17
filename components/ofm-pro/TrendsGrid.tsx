'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Play,
  Share2,
  Download,
  Volume2,
  VolumeX,
  Bookmark,
  Heart,
  MessageCircle,
  Trash2,
  Plus,
  Settings,
  ExternalLink,
  Check,
  Calendar,
  ChevronDown,
  Filter,
  Eye
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface Reel {
  id: string;
  source_url: string;
  shortcode?: string;
  thumbnail_url?: string;
  creator_handle: string;
  views: number;
  shares: number;
  likes: number;
  comments_count: number;
  posted_at_text?: string;
  platform?: string;
  status?: string;
}

interface TrendsGridProps {
  initialReels: Reel[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatCount(n: number): string {
  if (!n && n !== 0) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}

function getTimeAgo(text?: string): string {
  if (!text) return '';
  return text;
}

// Generate a consistent gradient based on the reel index/id for visual variety
function getCardGradient(index: number): string {
  const gradients = [
    'from-purple-900/60 via-indigo-900/40 to-slate-900/80',
    'from-rose-900/60 via-pink-900/40 to-slate-900/80',
    'from-blue-900/60 via-cyan-900/40 to-slate-900/80',
    'from-amber-900/60 via-orange-900/40 to-slate-900/80',
    'from-emerald-900/60 via-teal-900/40 to-slate-900/80',
    'from-violet-900/60 via-purple-900/40 to-slate-900/80',
    'from-fuchsia-900/60 via-rose-900/40 to-slate-900/80',
    'from-sky-900/60 via-blue-900/40 to-slate-900/80',
    'from-red-900/60 via-rose-900/40 to-slate-900/80',
    'from-teal-900/60 via-emerald-900/40 to-slate-900/80',
  ];
  return gradients[index % gradients.length];
}

// ── Reel Card ──────────────────────────────────────────────────────────────
function ReelCard({ reel, index, onDelete }: { reel: Reel; index: number; onDelete?: (id: string) => void }) {
  const [saved, setSaved] = useState(false);
  const [checked, setChecked] = useState(false);

  const instagramUrl = reel.source_url || (reel.shortcode ? `https://www.instagram.com/reel/${reel.shortcode}/` : '#');

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a2e] text-white shadow-lg overflow-hidden relative flex flex-col">
      {/* Video area - 9:16 aspect ratio */}
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative w-full"
        style={{ aspectRatio: '9/16' }}
      >
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getCardGradient(index)}`} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
        }} />

        {/* Center play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <Play className="w-7 h-7 text-white/80 ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Top overlay - timestamp & actions */}
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-start p-3 bg-gradient-to-b from-black/60 to-transparent">
          {/* Timestamp badge */}
          {reel.posted_at_text && (
            <div className="flex items-center gap-1 text-white/90">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span className="text-xs truncate">{getTimeAgo(reel.posted_at_text)}</span>
            </div>
          )}
          {!reel.posted_at_text && <div />}

          {/* Action buttons */}
          <div className="flex gap-1">
            <button
              className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
              title="Audio"
            >
              <Volume2 className="w-3.5 h-3.5 text-white/80" />
            </button>
            <button
              className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
              title="Download"
            >
              <Download className="w-3.5 h-3.5 text-white/80" />
            </button>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
              title="Open original"
            >
              <ExternalLink className="w-3.5 h-3.5 text-white/80" />
            </a>
            <button
              onClick={(e) => { e.preventDefault(); setSaved(!saved); }}
              className={`w-7 h-7 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${saved ? 'bg-yellow-500/40' : 'bg-black/30 hover:bg-black/50'}`}
              title="Save"
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? 'text-yellow-400 fill-yellow-400' : 'text-white/80'}`} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setChecked(!checked); }}
              className={`w-7 h-7 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${checked ? 'bg-blue-500/60' : 'bg-black/30 hover:bg-black/50'}`}
              title="Mark as reviewed"
            >
              <Check className={`w-3.5 h-3.5 ${checked ? 'text-white' : 'text-white/80'}`} />
            </button>
          </div>
        </div>

        {/* Bottom overlay - stats */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          {/* Views */}
          <div className="flex items-center gap-1.5 mb-2">
            <Play className="w-4 h-4 text-white/90" fill="currentColor" />
            <span className="text-sm font-semibold text-white">{formatCount(reel.views)}</span>
          </div>

          {/* Shares + Creator */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-white/70" />
              <span className="text-xs text-white/90 font-medium">{formatCount(reel.shares)}x</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-white/80">@</span>
              <span className="text-xs text-white/90 font-medium truncate max-w-[120px]">{reel.creator_handle}</span>
              <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-2 h-2 text-white" />
              </div>
            </div>
          </div>

          {/* Likes + Comments */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-white/60" />
              <span className="text-xs text-white/70">{formatCount(reel.likes)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5 text-white/60" />
              <span className="text-xs text-white/70">{formatCount(reel.comments_count)}</span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}

// ── Add Reel Modal ─────────────────────────────────────────────────────────
function AddReelModal({ onClose, onAdd }: { onClose: () => void; onAdd: (url: string) => void }) {
  const [url, setUrl] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1e1e2e] rounded-xl p-6 w-full max-w-md border border-white/10" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-4">Add Instagram Reel</h3>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste Instagram Reel URL..."
          className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 mb-4"
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { if (url.trim()) onAdd(url.trim()); }}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Add Reel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Grid ──────────────────────────────────────────────────────────────
export default function TrendsGrid({ initialReels }: TrendsGridProps) {
  const [reels, setReels] = useState<Reel[]>(initialReels);
  const [sortBy, setSortBy] = useState<'trending' | 'newest' | 'most_shared'>('trending');
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const sortedReels = useMemo(() => {
    const sorted = [...reels];
    switch (sortBy) {
      case 'trending': return sorted.sort((a, b) => b.views - a.views);
      case 'newest': return sorted;
      case 'most_shared': return sorted.sort((a, b) => b.shares - a.shares);
      default: return sorted;
    }
  }, [reels, sortBy]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/reels', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reels: [] }) });
      if (res.ok) window.location.reload();
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleAddReel = useCallback(async (url: string) => {
    try {
      const res = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_url: url, creator_handle: 'unknown', views: 0, shares: 0, likes: 0, comments_count: 0 })
      });
      if (res.ok) window.location.reload();
    } catch (e) {
      console.error('Add failed:', e);
    }
    setShowAddModal(false);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/reels?id=${id}`, { method: 'DELETE' });
      setReels(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error('Delete failed:', e);
    }
  }, []);

  const sortOptions = [
    { value: 'trending', label: 'Trending' },
    { value: 'newest', label: 'Newest' },
    { value: 'most_shared', label: 'Most Shared' },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Trends</h1>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        {/* Left: Sort + Time filters */}
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="appearance-none bg-[#1e1e2e] border border-white/10 text-white text-sm rounded-lg px-4 py-2 pr-8 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Time range pills */}
          {['day', 'week', 'month'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors capitalize ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1e1e2e] border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              {range}
            </button>
          ))}

          {/* Filters button */}
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#1e1e2e] border border-white/10 text-gray-400 hover:text-white hover:border-white/20 rounded-lg transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>
        </div>

        {/* Right: Add + Sync + Settings */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Reel
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 text-sm bg-[#1e1e2e] border border-white/10 text-gray-300 hover:text-white hover:border-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
          <button className="w-9 h-9 flex items-center justify-center bg-[#1e1e2e] border border-white/10 text-gray-400 hover:text-white hover:border-white/20 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid - 3 columns like OFMpro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedReels.map((reel, i) => (
          <ReelCard key={reel.id} reel={reel} index={i} onDelete={handleDelete} />
        ))}
      </div>

      {sortedReels.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg">No trending reels yet</p>
          <p className="text-sm mt-2">Click "Add Reel" or "Sync" to get started</p>
        </div>
      )}

      {/* Modal */}
      {showAddModal && <AddReelModal onClose={() => setShowAddModal(false)} onAdd={handleAddReel} />}
    </div>
  );
}
