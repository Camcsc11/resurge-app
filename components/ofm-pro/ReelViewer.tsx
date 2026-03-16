'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Reel {
  id: string;
  title: string;
  source_url: string;
  description: string;
  thumbnail_url: string;
  status: string;
  platform: string;
  created_at: string;
}

interface ReelViewerProps {
  initialReels: Reel[];
}

function getEmbedUrl(url: string): { embedUrl: string; platform: string } | null {
  if (!url) return null;

  // Instagram Reel
  const igMatch = url.match(
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/
  );
  if (igMatch) {
    return {
      embedUrl: `https://www.instagram.com/reel/${igMatch[1]}/embed/`,
      platform: 'instagram',
    };
  }

  // TikTok
  const ttMatch = url.match(
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[^/]+\/video\/(\d+)/
  );
  if (ttMatch) {
    return {
      embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}`,
      platform: 'tiktok',
    };
  }

  // TikTok short link (vm.tiktok.com)
  const ttShort = url.match(/(?:https?:\/\/)?vm\.tiktok\.com\/([A-Za-z0-9]+)/);
  if (ttShort) {
    return {
      embedUrl: url,
      platform: 'tiktok-short',
    };
  }

  // YouTube Shorts
  const ytMatch = url.match(
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]+)/
  );
  if (ytMatch) {
    return {
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      platform: 'youtube',
    };
  }

  // Direct video file
  if (url.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
    return {
      embedUrl: url,
      platform: 'video',
    };
  }

  return null;
}

function ReelCard({
  reel,
  isActive,
}: {
  reel: Reel;
  isActive: boolean;
}) {
  const embed = getEmbedUrl(reel.source_url);

  return (
    <div className="w-full h-full flex items-center justify-center snap-start snap-always relative">
      <div className="relative w-full max-w-[400px] h-[calc(100vh-140px)] bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#2a3a4a]">
        {/* Video / Embed area */}
        <div className="absolute inset-0">
          {embed && embed.platform === 'video' ? (
            <video
              src={embed.embedUrl}
              className="w-full h-full object-cover"
              loop
              playsInline
              muted={!isActive}
              autoPlay={isActive}
              controls
            />
          ) : embed && (embed.platform === 'instagram' || embed.platform === 'youtube') ? (
            <iframe
              src={isActive ? embed.embedUrl : 'about:blank'}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : embed && embed.platform === 'tiktok' ? (
            <iframe
              src={isActive ? embed.embedUrl : 'about:blank'}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1a2e] to-[#16213e] p-6">
              {reel.thumbnail_url ? (
                <img
                  src={reel.thumbnail_url}
                  alt={reel.title}
                  className="w-full h-full object-cover absolute inset-0 opacity-40"
                />
              ) : null}
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-white/70 text-sm">Open link to view</p>
                <a
                  href={reel.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors"
                >
                  Open Original
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Bottom overlay with title & info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-16">
          <h3 className="text-white font-semibold text-lg leading-tight mb-1">
            {reel.title}
          </h3>
          {reel.description && (
            <p className="text-white/70 text-sm line-clamp-2 mb-2">
              {reel.description}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                reel.status === 'approved'
                  ? 'bg-green-500/20 text-green-300'
                  : reel.status === 'submitted'
                  ? 'bg-purple-500/20 text-purple-300'
                  : reel.status === 'in_progress'
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : reel.status === 'assigned'
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-gray-500/20 text-gray-300'
              }`}
            >
              {reel.status?.replace('_', ' ') || 'draft'}
            </span>
            {reel.platform && (
              <span className="text-xs text-white/40">{reel.platform}</span>
            )}
          </div>
        </div>
      </div>

      {/* Side action buttons */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-5">
        {reel.source_url && (
          <a
            href={reel.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
            title="Open original"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

export default function ReelViewer({ initialReels }: ReelViewerProps) {
  const [reels, setReels] = useState<Reel[]>(initialReels);
  const [activeIndex, setActiveIndex] = useState(0);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const index = Math.round(scrollTop / itemHeight);
    setActiveIndex(Math.min(index, reels.length - 1));
  }, [reels.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleAddReel = async () => {
    if (!newUrl.trim()) return;
    setIsAdding(true);
    try {
      const embed = getEmbedUrl(newUrl);
      const platform = embed?.platform || 'unknown';
      const title = newTitle.trim() || `Reel ${reels.length + 1}`;

      const { data, error } = await supabase
        .from('ofm_reels')
        .insert({
          title,
          source_url: newUrl.trim(),
          status: 'approved',
          platform,
        })
        .select('id, title, source_url, description, thumbnail_url, status, platform, created_at');

      if (error) throw error;
      if (data && data.length > 0) {
        setReels([data[0], ...reels]);
      }
      setNewUrl('');
      setNewTitle('');
      setAddModalOpen(false);
    } catch (err) {
      console.error('Failed to add reel:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (addModalOpen) return;
      if (!containerRef.current) return;
      const itemHeight = containerRef.current.clientHeight;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        const next = Math.min(activeIndex + 1, reels.length - 1);
        containerRef.current.scrollTo({ top: next * itemHeight, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        const prev = Math.max(activeIndex - 1, 0);
        containerRef.current.scrollTo({ top: prev * itemHeight, behavior: 'smooth' });
      }
    },
    [activeIndex, reels.length, addModalOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a3a4a]">
        <div>
          <h1 className="text-2xl font-bold text-white">Reels</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {reels.length} reel{reels.length !== 1 ? 's' : ''} — scroll to browse
          </p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white"
        >
          + Add Reel
        </Button>
      </div>

      {/* Reel feed */}
      {reels.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-20 h-20 rounded-full bg-[#1a2332] flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No reels yet</h2>
          <p className="text-gray-400 mb-6 max-w-sm">
            Add Instagram or TikTok reel URLs to start building your feed.
          </p>
          <Button
            onClick={() => setAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            Add Your First Reel
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex justify-center relative min-h-0">
          {/* Scroll container */}
          <div
            ref={containerRef}
            className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none' }}
          >
            {reels.map((reel, i) => (
              <div key={reel.id} className="w-full h-full snap-start snap-always shrink-0">
                <ReelCard reel={reel} isActive={i === activeIndex} />
              </div>
            ))}
          </div>

          {/* Progress indicator */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
            {reels.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-200 ${
                  i === activeIndex
                    ? 'h-6 bg-blue-500'
                    : 'h-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Navigation hint */}
          {reels.length > 1 && activeIndex === 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
              <span className="text-xs text-white/40 mb-1">Scroll down</span>
              <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Add Reel Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="bg-[#1a2332] border-[#2a3a4a] text-white">
          <DialogHeader>
            <DialogTitle>Add Reel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Reel URL <span className="text-red-400">*</span>
              </label>
              <Input
                value={newUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUrl(e.target.value)}
                placeholder="https://www.instagram.com/reel/... or TikTok link"
                className="bg-[#0f1729] border-[#2a3a4a] text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supports Instagram Reels, TikTok, and YouTube Shorts
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Title (optional)
              </label>
              <Input
                value={newTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)}
                placeholder="Give this reel a name"
                className="bg-[#0f1729] border-[#2a3a4a] text-white"
              />
            </div>
            {newUrl && getEmbedUrl(newUrl) && (
              <div className="rounded-lg border border-[#2a3a4a] p-3 bg-[#0f1729]">
                <p className="text-xs text-green-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Detected: {getEmbedUrl(newUrl)?.platform} embed
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddModalOpen(false)}
              className="border-[#2a3a4a] text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddReel}
              disabled={!newUrl.trim() || isAdding}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {isAdding ? 'Adding...' : 'Add Reel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
