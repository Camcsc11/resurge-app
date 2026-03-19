'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Play, Download, Upload, CheckCircle } from 'lucide-react';

interface Assignment {
  id: string;
  reel_id: string;
  model_id: string;
  status: 'approved_for_editing' | 'in_editing';
  submission_url: string | null;
  submission_notes: string | null;
  edited_url: string | null;
  editor_id: string | null;
  ofm_reels: {
    id: string;
    title: string;
    description: string;
    source_url: string;
  };
  ofm_creators: {
    id: string;
    name: string;
    email: string;
  };
}

export default function EditorQueuePage() {
  const supabase = createClient();
  const [editor, setEditor] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [uploadingAssignmentId, setUploadingAssignmentId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const initializeEditor = async () => {
      try {
        // Get current user (editor)
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error('Failed to get user:', userError);
          setLoading(false);
          return;
        }

        setEditor(user);

        // Fetch assignments with status 'approved_for_editing' or 'in_editing'
        const response = await fetch('/api/content-assignments');
        const data = await response.json();

        if (data.assignments) {
          const filteredAssignments = data.assignments.filter(
            (a: Assignment) =>
              a.status === 'approved_for_editing' || a.status === 'in_editing'
          );
          setAssignments(filteredAssignments);
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeEditor();
  }, []);

  const handleStartEditing = async (assignmentId: string) => {
    setEditingAssignmentId(assignmentId);
    try {
      const response = await fetch('/api/content-assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },(€€€€€€€‰½‘äè)M=8¹ÍÑÉ¥¹¥™ä¡ì(€€€€€€€€€…ÍÍ¥¹µ•¹Ñ}¥è…ÍÍ¥¹µ•¹Ñ%°(€€€€€€€€€¹•Ý}ÍÑ…ÑÕÌè€¥¹}•‘¥Ñ¥¹œœ°(€€€€€€€€€•‘¥Ñ½É}¥è•‘¥Ñ½Èü¹¥°(€€€€€€€ô¤°(€€€€€ô¤ì((€€€€€¥˜€ …É•ÍÁ½¹Í”¹½¬¤ì(€€€€€€€Ñ¡É½Ü¹•ÜÉÉ½È …¥±•Ñ¼ÍÑ…ÉÐ•‘¥Ñ¥¹œœ¤ì(€€€€€ô((€€€€€½¹ÍÐÕÁ‘…Ñ•‘ÍÍ¥¹µ•¹Ð€ô…Ý…¥ÐÉ•ÍÁ½¹Í”¹©Í½¸ ¤ì((€€€€€Í•ÑÍÍ¥¹µ•¹ÑÌ ¡ÁÉ•Ø¤€ôø(€€€€€€€ÁÉ•Ø¹µ…À ¡„¤€ôø(€€€€€€€€€„¹¥€ôôô…ÍÍ¥¹µ•¹Ñ%(€€€€€€€€€€€€üì€¸¸¹„°€¸¸¹ÕÁ‘…Ñ•‘ÍÍ¥¹µ•¹Ð¹…ÍÍ¥¹µ•¹Ðô(€€€€€€€€€€€€è„(€€€€€€€€¤(€€€€€€¤ì(€€€ô…Ñ €¡•ÉÉ½È¤ì(€€€€€½¹Í½±”¹•ÉÉ½È ÉÉ½ÈÍÑ…ÉÑ¥¹œ•‘¥Ñ¥¹œèœ°•ÉÉ½È¤ì(€€€€€…±•ÉÐ …¥±•Ñ¼ start editing');
    } finally {
      setEditingAssignmentId(null);
    }
  };

  const handleSubmitForReview = async (assignmentId: string, file: File) => {
    setUploadingAssignmentId(assignmentId);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assignment_id', assignmentId);
      formData.append('upload_type', 'edited');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();
      const videoUrl = uploadData.url;

      // Update assignment with edited_url and status pending_review
      const updateResponse = await fetch('/api/content-assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          new_status: 'pending_review',
          edited_url: videoUrl,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update assignment');
      }

      const updatedAssignment = await updateResponse.json();

      // Remove from queue (move to pending_review)
      setAssignments((prev) =>
        prev.filter((a) => a.id !== assignmentId)
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

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-white mb-2">Editing Queue</h1>
        <p className="text-gray-400 mb-8">
          {assignments.length} {assignments.length === 1 ? 'video' : 'videos'} awaiting
          editing
        </p>

        {assignments.length === 0 ? (
          <div className="bg-[#1a1a2e] border border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg">
              No videos in queue. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-[#1a1a2e] border border-gray-700 rounded-lg p-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Info & Links */}
                  <div className="lg:col-span-1">
                    <h2 className="text-xl font-bold text-white mb-2">
                      {assignment.ofm_reels.title}
                    </h2>
                    <p className="text-sm text-gray-400 mb-4">
                      {assignment.ofm_reels.description}
                    </p>

                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                          Creator
                        </p>
                        <p className="text-sm text-white">
                          {assignment.ofm_creators.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {assignment.ofm_creators.email}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                          Status
                        </p>
                        <p className="inline-block px-2 py-1 bg-orange-600 text-white text-xs rounded font-medium">
                          {assignment.status === 'approved_for_editing'
                            ? 'Approved for Editing'
                            : 'In Editing'}
                        </p>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="space-y-2">
                      {assignment.ofm_reels.source_url && (
                        <a
                          href={assignment.ofm_reels.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium"
                        >
                          <Play className="w-4 h-4" />
                          View Example Reel
                        </a>
                      )}

                      {assignment.submission_url && (
                        <a
                          href={assignment.submission_url}
                          download
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium"
                        >
                          <Download className="w-4 h-4" />
                          Download Submission
                        </a>
                      )}
                    </div>

                    {assignment.submission_notes && (
                      <div className="mt-4 p-3 bg-black/30 border-l-2 border-blue-500 rounded">
                        <p className="text-xs text-gray-400 font-semibold mb-1">
                          Creator Notes
                        </p>
                        <p className="text-sm text-gray-300">
                          {assignment.submission_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Action Area */}
                  <div className="lg:col-span-2">
                    {assignment.status === 'approved_for_editing' ? (
                      <div className="flex items-center justify-center h-full">
                        <button
                          onClick={() => handleStartEditing(assignment.id)}
                          disabled={editingAssignmentId === assignment.id}
                          className="px-6 py-3 bg-purple-600 hover:bg-purple-50 disabled:bg-purple-600/50 text-white rounded-lg font-medium transition-colors"
                        >
                          {editingAssignmentId === assignment.id
                            ? 'Starting...'
                            : 'Start Editing'}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-300 font-medium mb-4">
                          Upload your edited video
                        </p>

                        {uploadError && (
                          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded mb-4">
                            {uploadError}
                          </div>
                        )}

                        <div className="mb-4">
                          <input
                            type="file"
                            accept="video/mp4"
                            onChange={(e) => {
                              const file = e.currentTarget.files?.[0];
                              if (file) {
                                handleSubmitForReview(assignment.id, file);
                              }
                            }}
                            disabled={uploadingAssignmentId === assignment.id}
                            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 disabled:file:bg-blue-600/50"
                          />
                          {uploadingAssignmentId === assignment.id && (
                            <p className="text-sm text-blue-400 mt-2">
                              Uploading...
                            </p>
                          )}
                        </div>

                        {assignment.edited_url && (
                          <div className="mt-4 p-3 bg-green-500/p10 border border-green-500/30 rounded">
                            <p className="flex items-center gap-2 text-green-400 text-sm font-medium">
                              <CheckCircle className="w-4 h-4" />
                              Edited video submitted for review
                            </p>
                            <a
                              href={assignment.edited_url}
                              download
                              className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm mt-2"
                            >
                              <Download className="w-4 h-4" />
                              Download your upload
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
