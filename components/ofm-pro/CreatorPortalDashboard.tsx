'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'A/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from 'A/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Reel {
  id: string;
  title: string;
  description: string;
  source_url: string;
  status: string;
  priority: string;
  due_date: string;
  admin_notes: string;
  creator_notes: string;
  submission_data: any;
}

interface CreatorPortalDashboardProps {
  initialReels: Reel[];
  creatorId: string;
}

const PRIORITY_COLORS = {
  low: 'text-blue-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

const STATUS_LABELS = {
  assigned: 'Ready to Start',
  in_progress: 'In Progress',
  submitted: 'Waiting for Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function CreatorPortalDashboard({
  initialReels,
  creatorId,
}: CreatorPortalDashboardProps) {
  const [reels, setReels] = useState<Reel[]>(initialReels);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    url: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleStartWorking = async (reel: Reel) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/creator-reels', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reel_id: reel.id,
          status: 'in_progress',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setReels(
        reels.map((r) =>
          r.id === reel.id ? { ...r, status: 'in_progress' } : r
        )
      );

      toast({
        title: 'Success',
        description: 'Started working on reel',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenUploadModal = (reel: Reel) => {
    setSelectedReel(reel);
    setUploadForm({ file: null, url: '', notes: '' });
    setUploadModalOpen(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setUploadForm({ ...uploadForm, file: files[0] });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file && !uploadForm.url.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a file or URL',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      if (uploadForm.file) {
        formData.append('file', uploadForm.file);
      }
      if (uploadForm.url) {
        formData.append('url', uploadForm.url);
      }
      formData.append('reel_id', selectedReel?.id || '');
      formData.append('notes', uploadForm.notes);

      const response = await fetch('/api/creator-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      setReels(
        reels.map((r) =>
          r.id === selectedReel?.id
            ? { ...r, status: 'submitted', creator_notes: uploadForm.notes }
            : r
        )
      );

      setUploadModalOpen(false);
      setSelectedReel(null);

      toast({
        title: 'Success',
        description: 'Reel submitted for review',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Upload failed';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {reels.length === 0 ? (
        <div className="bg-[#1a2332] rounded-lg border border-[#2a3a4a] p-12 text-center">
          <p className="text-gray-400">No reels assigned yet</p>
        </div>
      ) : (
        reels.map((reel) => (
          <div
            key={reel.id}
            className="bg-[#1a2332] rounded-lg border border-[#2a3a4a] p-6 transition hover:border-blue-500"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {reel.title}
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  {reel.description}
                </p>

                {reel.source_url && (
                  <a
                    href={reel.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm underline mb-2 inline-block"
                  >
                    View Source
                  </a>
                )}

                <div className="flex gap-4 text-xs text-gray-400 mt-3">
                  {reel.due_date && (
                    <div>
                      Due: {new Date(reel.due_date).toLocaleDateString()}
                    </div>
                  )}
                  {reel.priority && (
                    <div className={PRIORITY_COLORS[reel.priority as keyof typeof PRIORITY_COLORS]}>
                      Priority: {reel.priority}
                    </div>
                  )}
                </div>

                {reel.admin_notes && (
                  <div className="mt-3 p-3 bg-[#0f1729] rounded border border-[#2a3a4a]">
                    <p className="text-xs text-gray-400 font-medium mb-1">
                      Admin Notes
                    </p>
                    <p className="text-xs text-gray-300">{reel.admin_notes}</p>
                  </div>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <div className="inline-block px-3 py-1 rounded-full bg-blue-900 text-blue-200 text-xs font-medium">
                  {STATUS_LABELS[reel.status as keyof typeof STATUS_LABELS] ||
                    reel.status}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#2a3a4a]">
              {reel.status === 'assigned' && (
                <>
                  <Button
                    onClick={() => handleStartWorking(reel)}
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? 'Updating...' : 'Start Working'}
                  </Button>
                  <Button
                    onClick={() => handleOpenUploadModal(reel)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Upload
                  </Button>
                </>
              )}

              {reel.status === 'in_progress' && (
                <Button
                  onClick={() => handleOpenUploadModal(reel)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Submit for Review
                </Button>
              )}

              {reel.status === 'submitted' && (
                <div className="flex-1 py-2 px-4 rounded bg-purple-900/30 text-purple-300 text-sm font-medium flex items-center justify-center">
                  Waiting for Review
                </div>
              )}

              {reel.status === 'approved' && (
                <div className="flex-1 py-2 px-4 rounded bg-green-900/30 text-green-300 text-sm font-medium flex items-center justify-center">
                  Approved - Complete
                </div>
              )}
            </div>
          </div>
        ))
      )}

      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="bg-[#1a2332] border-[#2a3a4a]">
          <DialogHeader>
            <DialogTitle className="text-white">
              Submit Reel: {selectedReel?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 block mb-2">
                Upload File or Paste URL
              </label>

              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
                  dragActive
                    ? 'border-blue-400 bg-blue-900/20'
                    : 'border-[#2a3a4a] bg-[#0f1729]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      file: e.target.files?.[0] || null,
                    })
                  }
                  className="hidden"
                />

                {uploadForm.file ? (
                  <div className="text-green-400 text-sm">
                    File selected: {uploadForm.file.name}
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">
                      Drag and drop your file here or
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      className="border-[#2a3a4a]"
                    >
                      Browse Files
                    </Button>
                  </div>
                )}
              </div>

              <div className="text-center text-xs text-gray-400 my-3">or</div>

              <Input
                placeholder="Paste URL here (e.g., https://...)"
                value={uploadForm.url}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, url: e.target.value })
                }
                className="bg-[#0f1729] border-[#2a3a4a] text-white"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 block mb-2">
                Creator Notes
              </label>
              <Textarea
                placeholder="Add any notes about your submission..."
                value={uploadForm.notes}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, notes: e.target.value })
                }
                className="bg-[#0f1729] border-[#2a3a4a] text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setUploadModalOpen(false)}
              variant="outline"
              className="border-[#2a3a4a]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Uploading...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
