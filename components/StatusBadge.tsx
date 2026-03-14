'use client';

interface StatusBadgeProps {
  status: string;
}

const statusColors: Record<string, string> = {
  assigned: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  submitted: 'bg-purple-50 text-purple-700',
  in_qa: 'bg-orange-50 text-orange-700',
  pending_qa: 'bg-orange-50 text-orange-700',
  needs_revision: 'bg-red-50 text-red-700',
  approved: 'bg-emerald-50 text-emerald-700',
  finished: 'bg-gray-100 text-gray-600',
};

function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colors = statusColors[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`badge ${colors}`}>
      {formatStatus(status)}
    </span>
  );
}
