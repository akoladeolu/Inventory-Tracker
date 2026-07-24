'use client';

import { useState } from 'react';
import { ClipboardCheck, Minus, CheckCircle } from 'lucide-react';

type AuditStatus = 'draft' | 'in_progress' | 'pending_review' | 'completed' | 'cancelled';

const statusConfig: Record<AuditStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  pending_review: { label: 'Pending Review', className: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
};

export function AuditStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as AuditStatus] || statusConfig.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}
