'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, Download, CheckCircle, Clock, AlertCircle, Play, ExternalLink } from 'lucide-react';

type AssignmentStatus =
  | 'pending'
  | 'in_creation'
  | 'submitted'
  | 'approved_for_editing'
  | 'in_editing'
  | 'pending_review'
  | 'ready_for_posting'
  | 'posted';

interface Assignment {
  id: string;
  reel_id: string;
  model_id: string;
  status: AssignmentStatus;
  assigned_at: string;
  submission_url: string | null;
  submission_notes: string | null;
  edited_url: string | null;
  review_notes: string | null;
  posted_at: string | null;
  ofm_reels: {
    id: string;
    title: string;
    description: string;
    source_url: string;
  };
}

interface Creator {
  id: string;
  name: string;
  email: string;
}

function getStatusColor(status: AssignmentStatus): string {
  const colors: Record<AssignmentStatus, string> = {
    pending: 'bg-gray-600',
    in_creation: 'bg-blue-600',
    submitted: 'bg-purple-600',
    approved_for_editing: 'bg-indigo-600',
    in_editing: 'bg-orange-600',
    pending_review: 'bg-pink-600',
    ready_for_posting: 'bg-green-600',
    posted: 'bg-teal-600',
  };
  return colors[status] || 'bg-gray-500';
}

function getStatusLabel(status: AssignmentStatus): string {
  const labels: Record<AssignmentStatus, string> = {
    pending: 'Pending',
    in_creation: 'In Creation',
    submitted: 'Submitted',
    approved_for_editing: 'Approved for Editing',
    in_editing: 'In Editing',
    pending_review: 'Pending Review',
    ready_for_posting: 'Ready for Posting',
    posted: 'Posted',
  };
  return labels[status] || status;
}

export default function ContentCreationPage() {
  const supabase = createClient();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAssignmentId, setUploadingAssignmentId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const initializeCreator = async () => {
      try {
        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error('Failed to get user:', userError);
          setLoading(false);
          return;
        }

        // Find creator record by user_id (set during invite)
        const { data: creatorData, error: creatorError } = await supabase
          .from('ofm_creators')
          .select('id, name, email')
          .eq('user_id', user.id)
          .single();

        if (creatorError) {
          console.error('Failed to find creator:', creatorError);
          setLoading(false);
          return;
        }

        setCreator(creatorData);

        // Fetch assignments
        const response = await fetch(
          `/api/content-assignments?model_id=${creatorData.id}`
        );
        const data = await response.json();

        if (data.assignments) {
          setAssignments(data.assignments);
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeCreator();
  }, []);

  const handleVideoUpload = async (
    assignmentId: string,
    file: File,
    uploadType: 'submission' | 'edited'
  ) => {
    setUploadingAssignmentId(assignmentId);
    setUploadError(null);

    try {
      // Upload directly to Supabase Storage from the browser
      // This bypasses Vercel's 4.5MB serverless body size limit
      const fileName = uploadType === 'submission' ? 'submission.mp4' : 'edited.mp4';
      const filePath = `${assignmentId}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('content-submissions')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message || 'Upload failed');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('content-submissions')
        .getPublicUrl(filePath);

      // Update assignment with submission_url and status
      const updateResponse = await fetch('/api/content-assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          new_status: uploadType === 'submission' ? 'submitted' : 'pending_review',
          submission_url: uploadType === 'submission' ? publicUrl : undefined,
          edited_url: uploadType === 'edited' ? publicUrl : undefined,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update assignment');
      }

      const updatedAssignment = await updateResponse.json();

      // Update local state
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? { ...a, ...updatedAssignment.assignment }
            : a
        )
      );
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploadingAssignmentId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0f0f1a]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const activeAssignments = assignments.filter(
    (a) => a.status === 'pending' || a.status === 'in_creation'
  );
  const submittedAssignments = assignments.filter(
    (a) =>
      a.status === 'submitted' ||
      a.status === 'approved_for_editing'
  );
  const pendingReviewAssignments = assignments.filter(
    (a) => a.status === 'pending_review'
  );
  const readyForPosting = assignments.filter(
    (a) => a.status === 'ready_for_posting'
  );
  const completedAssignments = assignments.filter(
    (a) => a.status === 'posted'
  );

  const handleMarkAsPosted = async (assignmentId: string) => {
    try {
      const response = await fetch('/api/content-assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          new_status: 'posted',
          posted_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as posted');
      }

      const updatedAssignment = await response.json();

      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? { ...a, ...updatedAssignment.assignment }
            : a
        )
      );
    } catch (error) {
      console.error('Error marking as posted:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-white mb-2">Content Creation</h1>
        <p className="text-gray-400 mb-8">
          Manage your video submissions and track their progress
        </p>

        {/* Active Assignments */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">
            Active Assignments
          </h2>
          {activeAssignments.length === 0 ? (
            <div className="bg-[#1a1a2e] border border-gray-700 rounded-lg p-8 text-center text-gray-400">
              No active assignments
            </div>
          ) : (
            <div className="grid gap-4">
              {activeAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-[#1a1a2e] border border-gray-700 rounded-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {assignment.ofm_reels.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {assignment.ofm_reels.description}
                      </p>
                    </div>
                    <span
                      className={`${getStatusColor(
                        assignment.status
                      )} text-white text-xs font-medium px-3 py-1 rounded-full`}
                    >
                      {getStatusLabel(assignment.status)}
                    </span>
                  </div>
                  {/* Example Reel Link */}
                  {assignment.ofm_reels.source_url && (
                    <a
                      href={assignment.ofm_reels.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm mb-4"
                    >
                      <Play className="w-4 h-4" />
                      View Example Reel
                    </a>
                  )}

                  {/* Pending: Show Start Creating button */}
                  {assignment.status === 'pending' && (
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/content-assignments', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              assignment_id: assignment.id,
                              new_status: 'in_creation',
                            }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setAssignments((prev) =>
                              prev.map((a) =>
                                a.id === assignment.id
                                  ? { ...a, ...data.assignment }
                                  : a
                              )
                            );
                          }
                        } catch (err) {
                          console.error('Failed to start creating:', err);
                        }
                      }}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Start Creating
                    </button>
                  )}

                  {/* In Creation: Show upload section with example reel side by side */}
                  {assignment.status === 'in_creation' && (
                    <div className="mt-4 p-4 bg-black/20 border border-purple-500/30 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Example Reel */}
                        <div className="p-3 bg-black/30 rounded-lg border border-gray-700">
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Example Reel</h4>
                          {assignment.ofm_reels.source_url && (
                            <a
                              href={assignment.ofm_reels.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              {assignment.ofm_reels.source_url.substring(0, 40)}...
                            </a>
                          )}
                        </div>
                        {/* Upload Area */}
                        <div className="p-3 bg-black/30 rounded-lg border border-gray-700">
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Your Video</h4>
                          <input
                            type="file"
                            accept="video/mp4"
                            onChange={(e) => {
                              const file = e.currentTarget.files?.[0];
                              if (file) {
                                handleVideoUpload(assignment.id, file, 'submission');
                              }
                            }}
                            disabled={uploadingAssignmentId === assignment.id}
                            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500"
                          />
                        </div>
                      </div>
                      {uploadingAssignmentId === assignment.id && (
                        <p className="text-sm text-purple-400">Uploading and submitting for editing...</p>
                      )}
                      {uploadError && (
                        <p className="text-sm text-red-400 mt-1">{uploadError}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Awaiting Review */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">
            Awaiting Review
          </h2>
          {submittedAssignments.length === 0 ? (
            <div className="bg-[#1a1a2e] border border-gray-700 rounded-lg p-8 text-center text-gray-400">
              No submissions awaiting review
            </div>
          ) : (
            <div className="grid gap-4">
              {submittedAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-[#1a1a2e] border border-gray-700 rounded-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {assignment.ofm_reels.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Status: {getStatusLabel(assignment.status)}
                      </p>
                    </div>
                    <span
                      className={`${getStatusColor(
                        assignment.status
                      )} text-white text-xs font-medium px-3 py-1 rounded-full`}
                    >
                      {getStatusLabel(assignment.status)}
                    </span>
                  </div>
                  {assignment.submission_notes && (
                    <div className="bg-black/30 border-l-2 border-yellow-500 p-3 rounded text-sm text-gray-300 mb-3">
                      <strong>Notes:</strong> {assignment.submission_notes}
                    </div>
                  )}
                  {assignment.review_notes && (
                    <div className="bg-black/30 border-l-2 border-orange-500 p-3 rounded text-sm text-gray-300">
                      <strong>Review Feedback:</strong>{' '}
                      {assignment.review_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pending Review - Admin reviews edited video */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">
            Pending Review
          </h2>
          {pendingReviewAssignments.length === 0 ? (
            <div className="bg-[#1a1a2e] border border-gray-700 rounded-lg p-8 text-center text-gray-400">
              No videos pending review
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingReviewAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-[#1a1a2e] border border-gray-700 rounded-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {assignment.ofm_reels.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Edited video submitted — waiting for admin approval
                      </p>
                    </div>
                    <span className="bg-pink-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Pending Review
                    </span>
                  </div>
                  {assignment.edited_url && (
                    <a
                      href={assignment.edited_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Edited Video
                    </a>
                  )}
                  {assignment.review_notes && (
                    <div className="bg-black/30 border-l-2 border-orange-500 p-3 rounded text-sm text-gray-300 mt-3">
                      <strong>Review Feedback:</strong>{' '}
                      {assignment.review_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Ready for Posting */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready for Posting
          </h2>
          {readyForPosting.length === 0 ? (
            <div className="bg-[#1a1a2e] border border-gray-700 rounded-lg p-8 text-center text-gray-400">
              No videos ready for posting
            </div>
          ) : (
            <div className="grid gap-4">
              {readyForPosting.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-[#1a1a2e] border border-gray-700 rounded-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {assignment.ofm_reels.title}
                      </h3>
                    </div>
                    <span className="bg-green-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Ready for Posting
                    </span>
                  </div>
                  <div className="flex gap-3">
                    {assignment.edited_url && (
                      <a
                        href={assignment.edited_url}
                        download
                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download Video
                      </a>
                    )}
                    <button
                      onClick={() => handleMarkAsPosted(assignment.id)}
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Posted
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Completed */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Completed</h2>
          {completedAssignments.length === 0 ? (
            <div className="bg-[#1a1a2e] border border-gray-700 rounded-lg p-8 text-center text-gray-400">
              No completed videos
            </div>
          ) : (
            <div className="grid gap-4">
              {completedAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-[#1a1a2e] border border-gray-700 rounded-lg p-6 opacity-75"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {assignment.ofm_reels.title}
                      </h3>
                      {assignment.posted_at && (
                        <p className="text-sm text-gray-400 mt-1">
                          Posted on{' '}
                          {new Date(assignment.posted_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className="bg-teal-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Posted
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
