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

/* ── Video Preview Thumbnail ──────────────────────────────────
   Plays a 2-second muted loop of the start of the reel as the
   card's resting-state preview. Falls back to thumbnail on error. */
function VideoPreview({ src, fallbackThumb }: { src: string; fallbackThumb?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Only play when card scrolls into view
  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(v);

    const handleTimeUpdate = () => {
      if (v.currentTime >= 2) {
        v.currentTime = 0;
      }
    };

    const handleError = () => setHasError(true);
    const handleStalled = () => {
      // If stalled for too long, show fallback
      setTimeout(() => {
        if (v.readyState < 2) setHasError(true);
      }, 5000);
    };

    v.addEventListener('timeupdate', handleTimeUpdate);
    v.addEventListener('error', handleError);
    v.addEventListener('stalled', handleStalled);

    // Timeout fallback: if video hasn't started in 8s, show thumbnail
    const timeout = setTimeout(() => {
      if (v.readyState < 2) setHasError(true);
    }, 8000);

    return () => {
      observer.disconnect();
      v.removeEventListener('timeupdate', handleTimeUpdate);
      v.removeEventListener('error', handleError);
      v.removeEventListener('stalled', handleStalled);
      clearTimeout(timeout);
    };
  }, [src]);

  if (hasError && fallbackThumb) {
    return (
      <img
        src={fallbackThumb}
        alt="Preview"
        className="w-full h-full object-cover"
        loading="lazy"
      />
    );
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
      ref={ref}
      src={src + '#t=0.1'}
      className="w-full h-full object-cover"
      muted
      playsInline
      preload="metadata"
    />
  );
}

function ReelCard({ reel }: { reel: Reel }) {
  const [isHovered, setIsHovered] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => {
      setIsHovered(true);
    }, 250);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setIsHovered(false);
    setVideoReady(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  }, []);

  const handleCanPlay = useCallback(() => {
    setVideoReady(true);
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <div
      className="group relative rounded-xl overflow-hidden bg-[#0f1729] border border-[#2a3a4a] hover:border-blue-500/40 transition-all cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="aspect-[9/16] relative overflow-hidden">
        {/* Preview: 2-sec video loop if source_url exists, else thumbnail, else placeholder */}
        {reel.source_url ? (
          <VideoPreview src={reel.source_url} fallbackThumb={reel.thumbnail_url} />
        ) : reel.thumbnail_url ? (
          <img
            src={reel.thumbnail_url}
            alt={reel.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/40 via-[#1a1a2e] to-blue-900/40 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Full video overlay - mounts on hover, crossfades in when buffered */}
        {isHovered && reel.source_url && (
          <video
            ref={videoRef}
            src={reel.source_url}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
            muted
            loop
            playsInline
            preload="auto"
            onCanPlay={handleCanPlay}
          />
        )}

        {/* Buffering spinner */}
        {isHovered && !videoReady && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </div>
        )}

        {/* Timestamp badge */}
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 z-20">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {timeAgo(reel.created_at)}
        </div>

        {/* Hover action icons */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          {[
            'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z',
            'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
            'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
            'M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3',
          ].map((d, i) => (
            <button
              key={i}
              onClick={(e) => e.stopPropagation()}
              className="w-6 h-6 bg-black/60 backdrop-blur-sm rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
              </svg>
            </button>
          ))}
        </div>

        {/* Bottom gradient overlay with stats */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 pt-10 z-20">
          {/* Views - right aligned */}
          <div className="flex justify-end mb-1.5">
            <span className="flex items-center gap-1 text-white text-xs font-medium">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {formatCount(reel.views)}
            </span>
          </div>

          {/* Shares + Likes row */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1 text-white/80 text-[11px]">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {formatCount(reel.shares)}x
            </span>
            <span className="flex items-center gap-1 text-white/80 text-[11px]">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {formatCount(reel.likes)}
            </span>
          </div>

          {/* Creator + Comments row */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-white/70 text-[11px] truncate max-w-[70%]">
              <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              @{reel.creator_handle}
              <svg className="w-2.5 h-2.5 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
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

/* ── Add Reel Modal ──────────────────────────────────────────── */
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#0f1729] border border-[#2a3a4a] rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl">
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
        <p className="text-gray-400 text-sm mb-5">Paste a video URL and it will show up in the grid with a live preview.</p>

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
              placeholder="https://videos.pexels.com/... or any direct video link"
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

        {/* Video preview */}
        {sourceUrl && (
          <div className="mt-4 rounded-lg overflow-hidden border border-[#2a3a4a] aspect-video bg-black">
            <video
              src={sourceUrl}
              className="w-full h-full object-contain"
              muted
              autoPlay
              loop
              playsInline
            />
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

/* ── Main Grid ───────────────────────────────────────────────── */
export default function TrendsGrid({ initialReels }: TrendsGridProps) {
  const [reels, setReels] = useState<Reel[]>(initialReels);
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('day');
  const [sortBy, setSortBy] = useState('trending');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddReel = (newReel: Reel) => {
    setReels((prev) => [newReel, ...prev]);
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
          (a, b) =>
            (b.views || 0) + (b.shares || 0) * 10 - ((a.views || 0) + (a.shares || 0) * 10)
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
                  timeFilter === f
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
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
              <ReelCard key={reel.id} reel={reel} />
            ))}
          </div>
        )}
      </div>

      {/* Add Reel Modal */}
      {showAddModal && (
        <AddReelModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddReel}
        />
      )}
    </div>
  );
}
