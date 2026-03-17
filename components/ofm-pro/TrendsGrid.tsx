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
  reel: Ree