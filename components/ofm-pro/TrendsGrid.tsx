'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';

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
}

interface TrendsGridProps {
  initialReels: Reel[];
}

function formatCount(n: number): string {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

/* ── URL embed helpers ──────────────────────────────────────── */
function getEmbedInfo(url: string): { type: 'video' | 'iframe'; embedUrl: string } {
  if (!url) return { type: 'video', embedUrl: '' };

  // Instagram Reel / Post
  const igMatch = url.match(/instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/);
  if (igMatch) {
    return { type: 'iframe', embedUrl: `https://www.instagram.com/reel/${igMatch[1]}/embed/` };
  }

  // TikTok video
  const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (ttMatch) {
    return { type: 'iframe', embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}` };
  }

  // YouTube / Shorts
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) {
    return { type: 'iframe', embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1` };
  }

  // Pexels video page — extract numeric ID at end
  const pxPageMatch = url.match(/pexels\.com\/video\/[^/]*?-?(\d{5,})\/?$/);
  if (pxPageMatch) {
    return { type: 'iframe', embedUrl: url };
  }

  // Direct video file extensions
  if (/\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url) || url.includes('video-files')) {
    return { type: 'video', embedUrl: url };
  }

  // Fallback: try as iframe (works for many embeddable pages)
  return { type: 'iframe', embedUrl: url };
}

/* ── Media Preview (smart embed) ────────────────────────────── */
function MediaPreview({ src, fallbackThumb }: { src: string; fallbackThumb?: string }) {
  const { type, embedUrl } = getEmbedInfo(src);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIframeLoaded(false);
  }, [src]);

  useEffect(() => {
    if (type !== 'video') return;
    const v = videoRef.current;
    if (!v) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(v);

    const handleError = () => setHasError(true);
    const handleTimeUpdate = () => {
      if (v.currentTime >= 2) v.currentTime = 0;
    };
    const timeout = setTimeout(() => {
      if (v.readyState < 2) setHasError(true);
    }, 8000);

    v.addEventListener('timeupdate', handleTimeUpdate);
    v.addEventListener('error', handleError);

    return () => {
      observer.disconnect();
      v.removeEventListener('timeupdate', handleTimeUpdate);
      v.removeEventListener('error', handleError);
      clearTimeout(timeout);
    };
  }, [src, type]);

  // Iframe embed (Instagram, TikTok, YouTube, etc.)
  if (type === 'iframe') {
    return (
      <div className="w-full h-full relative bg-black">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/40 via-[#1a1a2e] to-blue-900/40">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
          </div>
        )}
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          loading="lazy"
          onLoad={() => setIframeLoaded(true)}
          style={{ overflow: 'hidden' }}
        />
      </div>
    );
  }

  // Video tag with error fallback
  if (hasError && fallbackThumb) {
    return <img src={fallbackThumb} alt="Preview" className="w-full h-full object-cover" loading="lazy" />;
  }

  if (hasError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-900/40 via-[#1a1a2e] to-blue-900/40 flex items-center justify-center">
        <svg className="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={src + '#t=0.1'}
      className="w-full h-full object-cover"
      muted
      playsInline
      preload="metadata"
    />
  );
}

/* ── Reel Card (with delete) ────────────────────────────────── */
function ReelCard({ reel, onDelete }: { reel: Reel; onDelete: (id: string) => void }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/reels?id=${reel.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete(reel.id);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="group relative bg-[#0f1729] border border-[#1e2d3d] rounded-xl overflow-hidden hover:border-[#3a4a5a] transition-all duration-200">
      {/* Preview */}
      <div className="relative aspect-[9/16]">
        {reel.source_url ? (
          <MediaPreview src={reel.source_url} fallbackThumb={reel.thumbnail_url} />
        ) : reel.thumbnail_url ? (
          <img src={reel.thumbnail_url} alt={reel.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/40 via-[#1a1a2e] to-blue-900/40 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Time badge */}
        <div className="absolute top-2 left-2 z-10">
          <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-md">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {timeAgo(reel.created_at)}
          </span>
        </div>

        {/* Delete button — shows on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {showConfirm ? (
            <div className="flex gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-medium px-2 py-1 rounded-md transition-colors"
              >
                {deleting ? '...' : 'Yes'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-black/60 hover:bg-black/80 text-white text-[10px] font-medium px-2 py-1 rounded-md transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="bg-black/60 hover:bg-red-600 text-white/80 hover:text-white p-1.5 rounded-md transition-colors backdrop-blur-sm"
              title="Delete reel"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Bottom stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8 z-10">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-white/90 font-medium">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {formatCount(reel.views)}
            </span>
            <span className="flex items-center gap-1 text-white/60 text-[11px]">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {formatCount(reel.shares)}
            </span>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="p-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-white/80 text-[11px] truncate">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="truncate">@{reel.creator_handle}</span>
            <svg className="w-3 h-3 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex items-center gap-1">
            <span className="flex items-center gap-1 text-white/60 text-[11px]">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {formatCount(reel.likes)}
            </span>
            <span className="flex items-center gap-1 text-white/60 text-[11px]">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {formatCount(reel.comments_count)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Add Reel Modal ─────────────────────────────────────────── */
function AddReelModal({ onClose, onAdd }: { onClose: () => void; onAdd: (reel: Reel) => void }) {
  const [sourceUrl, setSourceUrl] = useState('');
  const [title, setTitle] = useState('');
  const [creatorHandle, setCreatorHandle] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!sourceUrl.trim()) {
      setError('Video URL is required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: sourceUrl.trim(),
          title: title.trim() || 'Untitled Reel',
          creator_handle: creatorHandle.trim() || 'anonymous',
          platform,
          description: description.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add reel');
      }
      const { reel } = await res.json();
      onAdd(reel);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const previewEmbed = sourceUrl.trim() ? getEmbedInfo(sourceUrl.trim()) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#0f1729] border border-[#2a3a4a] rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Add Reel</h2>
        <p className="text-gray-400 text-sm mb-5">Paste an Instagram, TikTok, YouTube, or direct video URL.</p>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Video URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Video URL *</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/... or any video link"
              className="w-full bg-[#1a2332] border border-[#2a3a4a] text-white px-3 py-2.5 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/60 transition-colors"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="pool day hits different"
              className="w-full bg-[#1a2332] border border-[#2a3a4a] text-white px-3 py-2.5 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/60 transition-colors"
            />
          </div>

          {/* Creator Handle + Platform row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Creator Handle</label>
              <input
                type="text"
                value={creatorHandle}
                onChange={(e) => setCreatorHandle(e.target.value)}
                placeholder="jasmine.xoxx"
                className="w-full bg-[#1a2332] border border-[#2a3a4a] text-white px-3 py-2.5 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-[#1a2332] border border-[#2a3a4a] text-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-blue-500/60 transition-colors appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '16px',
                }}
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Living for this weather rn"
              rows={2}
              className="w-full bg-[#1a2332] border border-[#2a3a4a] text-white px-3 py-2.5 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/60 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Live preview */}
        {previewEmbed && (
          <div className="mt-4 rounded-lg overflow-hidden border border-[#2a3a4a] bg-black" style={{ height: '280px' }}>
            {previewEmbed.type === 'iframe' ? (
              <iframe
                src={previewEmbed.embedUrl}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <video
                src={previewEmbed.embedUrl}
                className="w-full h-full object-contain"
                muted
                autoPlay
                loop
                playsInline
              />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !sourceUrl.trim()}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 disabled:text-white/40 rounded-lg transition-colors"
          >
            {submitting ? 'Adding...' : 'Add Reel'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Grid ──────────────────────────────────────────────── */
export default function TrendsGrid({ initialReels }: TrendsGridProps) {
  const [reels, setReels] = useState<Reel[]>(initialReels);
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('day');
  const [sortBy, setSortBy] = useState('trending');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddReel = (newReel: Reel) => {
    setReels((prev) => [newReel, ...prev]);
  };

  const handleDeleteReel = (id: string) => {
    setReels((prev) => prev.filter((r) => r.id !== id));
  };

  const sortedReels = useMemo(() => {
    const sorted = [...reels];
    switch (sortBy) {
      case 'views':
        return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
      case 'likes':
        return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      case 'shares':
        return sorted.sort((a, b) => (b.shares || 0) - (a.shares || 0));
      default:
        return sorted.sort(
          (a, b) => (b.views || 0) + (b.shares || 0) * 10 - ((a.views || 0) + (a.shares || 0) * 10)
        );
    }
  }, [reels, sortBy]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-5">Trends</h1>

        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#1a2332] border border-[#2a3a4a] text-white px-3 py-2 rounded-lg text-sm appearance-none cursor-pointer pr-8"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              backgroundSize: '16px',
            }}
          >
            <option value="trending">Trending</option>
            <option value="views">Most Viewed</option>
            <option value="likes">Most Liked</option>
            <option value="shares">Most Shared</option>
          </select>

          <div className="flex bg-[#1a2332] border border-[#2a3a4a] rounded-lg overflow-hidden">
            {(['day', 'week', 'month'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-5 py-2 text-sm font-medium capitalize transition-colors ${
                  timeFilter === f ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Add Reel button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Reel
          </button>

          <button className="flex items-center gap-2 bg-[#1a2332] border border-[#2a3a4a] text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
        </div>

        {/* Grid */}
        {sortedReels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-[#1a2332] flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No trending reels</h2>
            <p className="text-gray-400 max-w-sm">Click &quot;Add Reel&quot; to start adding content.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {sortedReels.map((reel) => (
              <ReelCard key={reel.id} reel={reel} onDelete={handleDeleteReel} />
            ))}
          </div>
        )}
      </div>

      {/* Add Reel Modal */}
      {showAddModal && (
        <AddReelModal onClose={() => setShowAddModal(false)} onAdd={handleAddReel} />
      )}
    </div>
  );
}
