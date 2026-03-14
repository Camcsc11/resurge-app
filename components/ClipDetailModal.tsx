'use client';

import { X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import StatusBadge from './StatusBadge';

interface Clip {
  id: string;
  name: string;
  status: string;
  editor_name: string;
  due_date?: string;
  example_reel_url?: string;
  notes?: string;
}

interface Submission {
  id: string;
  round: number;
  status: string;
  submitted_date: string;
  drive_link?: string;
}

interface ClipDetailModalProps {
  clip: Clip;
  submissions: Submission[];
  onClose: () => void;
}

export default function ClipDetailModal({
  clip,
  submissions,
  onClose,
}: ClipDetailModalProps) {
  const sortedSubmissions = [...submissions].sort((a, b) => b.round - a.round);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{clip.name}</h2>
            <StatusBadge status={clip.status} />
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition ml-2 flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Clip Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Editor</h3>
              <p className="text-gray-900">{clip.editor_name}</p>
            </div>

            {clip.due_date && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Due Date</h3>
                <p className="text-gray-900">{clip.due_date}</p>
              </div>
            )}

            {clip.example_reel_url && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Example Reel</h3>
                <a
                  href={clip.example_reel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  View External Link
                </a>
              </div>
            )}

            {clip.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Notes</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{clip.notes}</p>
              </div>
            )}
          </div>

          {/* Submission History */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission History</h3>

            {sortedSubmissions.length === 0 ? (
              <p className="text-gray-500 text-sm">No submissions yet</p>
            ) : (
              <div className="space-y-3">
                {sortedSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Round {submission.round}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(submission.submitted_date), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <StatusBadge status={submission.status} />
                    </div>

                    {submission.drive_link && (
                      <a
                        href={submission.drive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-2 inline-block"
                      >
                        View Submission
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
