'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Creator {
  id: string;
  name: string;
}

interface Reel {
  id: string;
  title: string;
  source_url: string;
  description: string;
  thumbnail_url: string;
  status: string;
  priority: string;
  due_date: string;
  admin_notes: string;
  creator_id: string;
  assigned_creator: { name: string } | null;
  created_at: string;
  updated_at: string;
  submission_data: any;
  creator_notes: string;
}

interface ReelsClientProps {
  initialReels: Reel[];
}

const STATUS_COLORS = {
  unassigned: 'bg-gray-500',
  assigned: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  submitted: 'bg-purple-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
};

const PRIORITY_BADGES = {
  low: 'bg-blue-900 text-blue-200',
  medium: 'bg-yellow-900 text-yellow-200',
  high: 'bg-red-900 text-red-200',
};

export default function ReelsClient({ initialReels }: ReelsClientProps) {
  const [reels, setReels] = useState<Reel[]>(initialReels);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filterTab, setFilterTab] = useState<string>('all');
  const [loadingCreators, setLoadingCreators] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [addForm, setAddForm] = useState({
    title: '',
    source_url: '',
    description: '',
    thumbnail_url: '',
    priority: 'medium',
    due_date: '',
    admin_notes: '',
  });
  const [assignForm, setAssignForm] = useState({
    creator_id: '',
    due_date: '',
    priority: 'medium',
    notes: '',
  });
  const [reviewForm, setReviewForm] = useState({
    approved: false,
    review_notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const filteredReels = useMemo(() => {
    return reels.filter((reel) => {
      if (filterTab === 'unassigned') return reel.status === 'unassigned';
      if (filterTab === 'assigned')
        return ['assigned', 'in_progress'].includes(reel.status);
      if (filterTab === 'submitted') return reel.status === 'submitted';
      if (filterTab === 'approved') return reel.status === 'approved';
      return true;
    });
  }, [reels, filterTab]);

  const fetchCreators = useCallback(async () => {
    if (creators.length > 0) return;
    setLoadingCreators(true);
    try {
      const { data, error } = await supabase
        .from('ofm_creators')
        .select('id, name')
        .order('name');
      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load creators',
        variant: 'destructive',
      });
    } finally {
      setLoadingCreators(false);
    }
  }, [creators.length, supabase, toast]);

  const handleAddReel = async () => {
    if (!addForm.title.trim()) {
      toast({ title: 'Error', description: 'Title is required' });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ofm_reels')
        .insert({
          title: addForm.title,
          source_url: addForm.source_url,
          description: addForm.description,
          thumbnail_url: addForm.thumbnail_url,
          priority: addForm.priority,
          due_date: addForm.due_date || null,
          admin_notes: addForm.admin_notes,
          status: 'unassigned',
        })
        .select();

      if (error) throw error;

      setReels([...(data || []), ...reels]);
      setAddModalOpen(false);
      setAddForm({
        title: '',
        source_url: '',
        description: '',
        thumbnail_url: '',
        priority: 'medium',
        due_date: '',
        admin_notes: '',
      });
      toast({ title: 'Success', description: 'Reel created' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create reel',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignReel = async () => {
    if (!assignForm.creator_id) {
      toast({ title: 'Error', description: 'Please select a creator' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('ofm_reels')
        .update({
          creator_id: assignForm.creator_id,
          status: 'assigned',
          due_date: assignForm.due_date || null,
          priority: assignForm.priority,
          admin_notes: assignForm.notes,
        })
        .eq('id', selectedReel?.id);

      if (error) throw error;

      setReels(
        reels.map((r) =>
          r.id === selectedReel?.id
            ? {
                ...r,
                creator_id: assignForm.creator_id,
                status: 'assigned',
                due_date: assignForm.due_date,
                priority: assignForm.priority,
                admin_notes: assignForm.notes,
              }
            : r
        )
      );
      setAssignModalOpen(false);
      setSelectedReel(null);
      toast({ title: 'Success', description: 'Reel assigned' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign reel',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewReel = async () => {
    setIsLoading(true);
    try {
      const newStatus = reviewForm.approved ? 'approved' : 'rejected';
      const { error } = await supabase
        .from('ofm_reels')
        .update({
          status: newStatus,
          admin_notes: reviewForm.review_notes,
        })
        .eq('id', selectedReel?.id);

      if (error) throw error;

      setReels(
        reels.map((r) =>
          r.id === selectedReel?.id
            ? {
                ...r,
                status: newStatus,
                admin_notes: reviewForm.review_notes,
              }
            : r
        )
      );
      setReviewModalOpen(false);
      setSelectedReel(null);
      toast({
        title: 'Success',
        description: `Reel ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to review reel',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReel = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('ofm_reels')
        .delete()
        .eq('id', selectedReel?.id);

      if (error) throw error;

      setReels(reels.filter((r) => r.id !== selectedReel?.id));
      setDeleteConfirmOpen(false);
      setSelectedReel(null);
      toast({ title: 'Success', description: 'Reel deleted' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete reel',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openAssignModal = async (reel: Reel) => {
    await fetchCreators();
    setSelectedReel(reel);
    setAssignForm({
      creator_id: reel.creator_id || '',
      due_date: reel.due_date || '',
      priority: reel.priority || 'medium',
      notes: reel.admin_notes || '',
    });
    setAssignModalOpen(true);
  };

  const openReviewModal = (reel: Reel) => {
    setSelectedReel(reel);
    setReviewForm({
      approved: false,
      review_notes: reel.admin_notes || '',
    });
    setReviewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Reels Management</h1>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Add Reel
        </Button>
      </div>

      <div className="flex gap-2 border-b border-[#2a3a4a]">
        {['all', 'unassigned', 'assigned', 'submitted', 'approved'].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2 capitalize transition ${
                filterTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          )
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredReels.map((reel) => (
          <div
            key={reel.id}
            className="overflow-hidden rounded-lg bg-[#1a2332] border border-[#2a3a4a] transition hover:border-blue-500"
          >
            <div
              className="h-40 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm text-white"
              style={{
                backgroundImage: reel.thumbnail_url
                  ? `url(${reel.thumbnail_url})`
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!reel.thumbnail_url && 'No Thumbnail'}
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white flex-1 line-clamp-2">
                  {reel.title}
                </h3>
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                    STATUS_COLORS[reel.status as keyof typeof STATUS_COLORS] ||
                    STATUS_COLORS.unassigned
                  }`}
                />
              </div>

              <p className="text-sm text-gray-400 line-clamp-2">
                {reel.description}
              </p>

              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-gray-400">
                  {reel.assigned_creator?.name || 'Unassigned'}
                </div>
                {reel.priority && (
                  <span
                    className={`px-2 py-1 text-xs rounded font-medium ${
                      PRIORITY_BADGES[
                        reel.priority as keyof typeof PRIORITY_BADGES
                      ] || PRIORITY_BADGES.medium
                    }`}
                  >
                    {reel.priority}
                  </span>
                )}
              </div>

              {reel.due_date && (
                <div className="text-xs text-gray-500">
                  Due: {new Date(reel.due_date).toLocaleDateString()}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {reel.status === 'unassigned' && (
                  <Button
                    onClick={() => openAssignModal(reel)}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    Assign
                  </Button>
                )}
                {reel.status === 'submitted' && (
                  <Button
                    onClick={() => openReviewModal(reel)}
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Review
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setSelectedReel(reel);
                    setDeleteConfirmOpen(true);
                  }}
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="bg-[#1a2332] border-[#2a3a4a]">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Reel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300">Title</label>
              <Input
                placeholder="Reel title"
                value={addForm.title}
                onChange={(e) =>
                  setAddForm({ ...addForm, title: e.target.value })
                }
                className="mt-1 bg-[#0f1729] border-[#2a3a4a] text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">Source URL</label>
              <Input
                placeholder="https://..."
                value={addForm.source_url}
                onChange={(e) =>
                  setAddForm({ ...addForm, source_url: e.target.value })
                }
                className="mt-1 bg-[#0f1729] border-[#2a3a4a] text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">Description</label>
              <Textarea
                placeholder="Reel description"
                value={addForm.description}
                onChange={(e) =>
                  setAddForm({ ...addForm, description: e.target.value })
                }
                className="mt-1 bg-[#0f1729] border-[#2a3a4a] text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">Thumbnail URL</label>
              <Input
                placeholder="https://..."
                value={addForm.thumbnail_url}
                onChange={(e) =>
                  setAddForm({ ...addForm, thumbnail_url: e.target.value })
                }
                className="mt-1 bg-[#0f1729] border-[#2a3a4a] text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300">Priority</label>
                <Select
                  value={addForm.priority}
                  onValueChange={(val) =>
                    setAddForm({ ...addForm, priority: val })
                  }
                >
                  <SelectTrigger className="mt-1 bg-[#0f1729] border-[#2a3a4a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2332] border-[#2a3a4a]">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-300">Due Date</label>
                <Input
                  type="date"
                  value={addForm.due_date}
                  onChange={(e) =>
                    setAddForm({ ...addForm, due_date: e.target.value })
                  }
                  className="mt-1 bg-[#0f1729] border-[#2a3a4a] text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-300">Admin Notes</label>
              <Textarea
                placeholder="Internal notes"
                value={addForm.admin_notes}
                onChange={(e) =>
                  setAddForm({ ...addForm, admin_notes: e.target.value })
                }
                className="mt-1 bg-[#0f1729] border-[#2a3a4a] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setAddModalOpen(false)}
              variant="outline"
              className="border-[#2a3a4a]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddReel}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Creating...' : 'Create Reel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="bg-[#1a2332] border-[#2a3a4a]">
          <DialogHeader>
            <DialogTitle className="text-white">Assign Reel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300">Creator</label>
              <Select
                value={assignForm.creator_id}
                onValueChange={(val) =>
                  setAssignForm({ ...assignForm, creator_id: val })
                }
              >
                <SelectTrigger
                  disabled={loadingCreators}
                  className="mt-1 bg-[#0f1729] border-[#2a3a4a] text-white"
                >
                  <SelectValue placeholder="Select creator" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2332] border-[#2a3a4a]">
                  {creators.map((creator) => (
                    <SelectItem key={creator.id} value={creator.id}>
                      {creator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-300">Due Date</label>
              <Input
                type="date"
                value={assignForm.due_date}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, due_date: e.target.value })
                }
                className="mt-1 bg-[#0f1729] border-[#2a3a4a] text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">Priority</label>
              <Select
                value={assignForm.priority}
                onValueChange={(val) =>
                  setAssignForm({ ...assignForm, priority: val })
                }
              >
                <SelectTrigger className="mt-1 bg-[#0f1729] border-[#2a3a4a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2332] border-[#2a3a4a]">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-300">Notes</label>
              <Textarea
                placeholder="Assignment notes for creator"
                value={assignForm.notes}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, notes: e.target.value })
                }
                className="mt-1 bg-[#0f1729] border-[#2a3a4a] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setAssignModalOpen(false)}
              variant="outline"
              className="border-[#2a3a4a]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignReel}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="bg-[#1a2332] border-[#2a3a4a]">
          <DialogHeader>
            <DialogTitle className="text-white">Review Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReel?.submission_data && (
              <div className="bg-[#0f1729] p-3 rounded border border-[#2a3a4a]">
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Submission Details
                </h4>
                <p className="text-xs text-gray-400 break-all">
                  {JSON.stringify(selectedReel.submission_data, null, 2)}
                </p>
              </div>
            )}
            {selectedReel?.creator_notes && (
              <div className="bg-[#0f1729] p-3 rounded border border-[#2a3a4a]">
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Creator Notes
                </h4>
                <p className="text-xs text-gray-400">
                  {selectedReel.creator_notes}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-300">Review Decision</label>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() =>
                    setReviewForm({ ...reviewForm, approved: true })
                  }
                  className={`flex-1 py-2 rounded font-medium transition ${
                    reviewForm.approved
                      ? 'bg-green-600 text-white'
                      : 'bg-[#0f1729] text-gray-400 border border-[#2a3a4a]'
                  }`}
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    setReviewForm({ ...reviewForm, approved: false })
                  }
                  className={`flex-1 py-2 rounded font-medium transition ${
                    !reviewForm.approved
                      ? 'bg-red-600 text-white'
                      : 'bg-[#0f1729] text-gray-400 border border-[#2a3a4a]'
                  }`}
                >
                  Reject
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-300">Review Notes</label>
              <Textarea
                placeholder="Add review comments"
                value={reviewForm.review_notes}
                onChange={(e) =>
                  setReviewForm({
                    ...reviewForm,
                    review_notes: e.target.value,
                  })
                }
                className="mt-1 bg-[#0f1729] border-[#2a3a4a] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setReviewModalOpen(false)}
              variant="outline"
              className="border-[#2a3a4a]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReviewReel}
              disabled={isLoading}
              className={`${
                reviewForm.approved
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isLoading
                ? 'Processing...'
                : reviewForm.approved
                  ? 'Approve'
                  : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-[#1a2332] border-[#2a3a4a]">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Reel</DialogTitle>
          </DialogHeader>
          <p className="text-gray-300">
            Are you sure you want to delete "{selectedReel?.title}"? This action
            cannot be undone.
          </p>
          <DialogFooter>
            <Button
              onClick={() => setDeleteConfirmOpen(false)}
              variant="outline"
              className="border-[#2a3a4a]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteReel}
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
