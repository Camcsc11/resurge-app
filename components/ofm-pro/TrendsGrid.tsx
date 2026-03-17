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
} from 'lucide-react';

// Types
interface Reel {
  id: string;
  title: string;
  source_url: string;
  description: string;
  thumbnail_url: string;
  status: string;
  platform: string;
  created_at: string;
  views: number;
  likes: number;
  shares: number;
  comments_count: number;
  creator_handle: string;
  shortcode?: string;
  posted_at_text?: string;
}

interface TrendsGridProps {
  initialReels: Reel[];
}

interface EmbedInfo {
  type: 'instagram' | 'tiktok' | 'youtube' | 'video' | 'unknown';
  embedUrl: string;
}

// Utility functions
function formatCount(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1000000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
}

function getEmbedInfo(sourceUrl: string, shortcode?: string): EmbedInfo {
  if (!sourceUrl) return { type: 'unknown', embedUrl: '' };

  // Instagram
  if (sourceUrl.includes('instagram.com')) {
    if (shortcode) {
      return {
        type: 'instagram',
        embedUrl: `https://www.instagram.com/reel/${shortcode}/embed/`,
      };
    }
    const match = sourceUrl.match(/\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
    if (match) {
      return {
        type: 'instagram',
        embedUrl: `https://www.instagram.com/reel/${match[1]}/embed/`,
      };
    }
  }

  // TikTok
  if (sourceUrl.includes('tiktok.com')) {
    const match = sourceUrl.match(/\/video\/(\d+)/);
    if (match) {
      return {
        type: 'tiktok',
        embedUrl: `https://www.tiktok.com/embed/v2/${match[1]}`,
      };
    }
  }

  // YouTube
  if (sourceUrl.includes('youtube.com') || sourceUrl.includes('youtu.be')) {
    const match =
      sourceUrl.match(/v=([a-zA-Z0-9_-]{11})/) ||
      sourceUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (match) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${match[1]}`,
      };
    }
  }

  // Direct video
  if (sourceUrl.match(/\.(mp4|webm|mov)$/i)) {
    return {
      type: 'video',
      embedUrl: sourceUrl,
    };
  }

  return { type: 'unknown', embedUrl: sourceUrl };
}

function getTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return past.toLocaleDateString();
}

// Card component
function ReelCard({
  reel,
  onDelete,
}: {
  reel: Reel;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const embedInfo = getEmbedInfo(reel.source_url, reel.shortcode);
  const timeAgo = getTimeAgo(reel.created_at);

  return (
    <div
      className="group relative rounded-lg border border-gray-800 bg-[#111] overflow-hidden transition-all duration-300 hover:border-blue-500/50"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Video/Embed Container */}
      <div className="relative w-full aspect-[9/16] bg-black">
        {embedInfo.type === 'instagram' && (
          <iframe
            src={embedInfo.embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            className="w-full h-full"
            style={{
              pointerEvents: hovered ? 'none' : 'auto',
            }}
          />
        )}
        {embedInfo.type === 'tiktok' && (
          <iframe
            src={embedInfo.embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="w-full h-full"
          />
        )}
        {embedInfo.type === 'youtube' && (
          <iframe
            src={embedInfo.embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media"
            allowFullScreen
            className="w-full h-full"
          />
        )}
        {embedInfo.type === 'video' && (
          <video
            src={embedInfo.embedUrl}
            controls
            autoPlay
            muted
            loop
            className="w-full h-full object-cover"
          />
        )}
        {embedInfo.type === 'unknown' && (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-400">
            <p className="text-sm">Embed unavailable</p>
          </div>
        )}

        {/* Timestamp Badge - Top Left */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
          <Calendar size={12} />
          <span>{reel.posted_at_text || timeAgo}</span>
        </div>

        {/* Action Buttons - Top Right */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors">
            <Volume2 size={16} />
          </button>
          <button className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors">
            <Download size={16} />
          </button>
          <button className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors">
            <ExternalLink size={16} />
          </button>
          <button className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors">
            <Bookmark size={16} />
          </button>
          <button className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors">
            <Check size={16} />
          </button>
        </div>

        {/* View Count - Bottom Left Overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-sm font-semibold bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
          <Play size={14} fill="currentColor" />
          <span>{formatCount(reel.views)}</span>
        </div>

        {/* Delete Button on Hover */}
        {hovered && (
          <button
            onClick={() => onDelete(reel.id)}
            className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-red-500/90 hover:bg-red-600 flex items-center justify-center text-white transition-all duration-200 shadow-lg"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Footer Stats */}
      <div className="bg-[#0a0a0a] p-3 space-y-2">
        {/* Shares and Creator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 size={14} className="text-gray-400" />
            <span className="text-white text-sm font-medium">
              {formatCount(reel.shares)}x
            </span>
            <span className="text-gray-400 text-sm">
              @{reel.creator_handle}
            </span>
            <Check size={12} className="text-blue-400" />
          </div>
        </div>

        {/* Likes and Comments */}
        <div className="flex items-center gap-4 text-gray-400 text-sm">
          <div className="flex items-center gap-1">
            <Heart size={14} />
            <span>{formatCount(reel.likes)}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle size={14} />
            <span>{formatCount(reel.comments_count)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Reel Modal
function AddReelModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (reel: Omit<Reel, 'id'>) => void;
}) {
  const [url, setUrl] = useState('');
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: url,
          creator_handle: handle || 'anonymous',
          platform: 'instagram',
        }),
      });

      if (response.ok) {
        setUrl('');
        setHandle('');
        onClose();
      }
    } catch (err) {
      console.error('Failed to add reel:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#111] border border-gray-800 rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
        <h2 className="text-xl font-bold text-white">Add Reel</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Source URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://instagram.com/reel/..."
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Creator Handle
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@creator_name"
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {loading ? 'Adding...' : 'Add Reel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Component
export default function TrendsGrid({ initialReels }: TrendsGridProps) {
  const [reels, setReels] = useState<Reel[]>(initialReels);
  const [sortBy, setSortBy] = useState<'trending' | 'newest' | 'most-liked'>(
    'trending'
  );
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('day');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const sortedReels = useMemo(() => {
    let sorted = [...reels];

    if (sortBy === 'trending') {
      sorted.sort((a, b) => b.views - a.views);
    } else if (sortBy === 'newest') {
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortBy === 'most-liked') {
      sorted.sort((a, b) => b.likes - a.likes);
    }

    return sorted;
  }, [reels, sortBy]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/reels?id=${id}`, { method: 'DELETE' });
      setReels((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete reel:', err);
    }
  }, []);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      // This would be called with scraped data in a real scenario
      const response = await fetch('/api/reels', { method: 'PUT' });
      if (response.ok) {
        const data = await response.json();
        setReels(data.reels || []);
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-6">Trends</h1>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'trending' | 'newest' | 'most-liked')
              }
              className="px-4 py-2 bg-[#111] border border-gray-700 rounded-lg text-white text-sm hover:border-gray-600 focus:outline-none focus:border-blue-500"
            >
              <option value="trending">Trending</option>
              <option value="newest">Newest</option>
              <option value="most-liked">Most Liked</option>
            </select>

            {/* Time Filter Pills */}
            <div className="flex gap-2">
              {['day', 'week', 'month'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeFilter(period as 'day' | 'week' | 'month')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeFilter === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#111] text-gray-300 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus size={18} />
                <span>Add Reel</span>
              </button>

              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="px-4 py-2 bg-[#111] border border-gray-700 hover:border-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSyncing ? 'Syncing...' : 'Sync'}
              </button>

              <button className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-700 hover:border-gray-600 text-white rounded-lg transition-colors">
                <Settings size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sortedReels.map((reel) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {sortedReels.length === 0 && (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>No reels found</p>
          </div>
        )}
      </div>

      {/* Add Reel Modal */}
      <AddReelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={() => {}}
      />
    </div>
  );
}
