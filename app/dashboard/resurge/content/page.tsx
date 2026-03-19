'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, Download, CheckCircle, Clock, AlertCircle, Play } from 'lucide-react';

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

        // Find creator record
        const { data: creatorData, error: creatorError } = await supabase
          .from('ofm_creators')
          .select('id, name, email')
          .eq('email', user.email)
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assignment_id', assignmentId);
      formData.append('upload_type', uploadType);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();
      const videoUrl = uploadData.url;

      // Update assignment with submission_url and status
      const updateResponse = await fetch('/api/content-assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          new_status: uploadType === 'submission' ? 'submitted' : undefined,
          submission_url: uploadType === 'submission' ? videoUrl : undefined,
          edited_url: uploadType === 'edited' ? videoUrl : undefined,
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
                  {assignment.status === 'in_creation' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Upload Your Video
                      </label>
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
                      {uploadingAssignmentId === assignment.id && (
                        <p className="text-sm text-purple-400 mt-2">
                          Uploading...
                        </p>
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
