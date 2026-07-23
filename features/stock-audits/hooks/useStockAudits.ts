'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAudits,
  fetchAuditDetail,
  createAudit,
  completeAudit,
  submitForReview,
  cancelAuditAction,
  updateItemCount,
} from '../actions/stock-audit.actions';

export function useAudits(status?: string) {
  return useQuery({
    queryKey: ['stock-audits', status],
    queryFn: () => fetchAudits(status),
  });
}

export function useAuditDetail(id: string) {
  return useQuery({
    queryKey: ['stock-audit', id],
    queryFn: () => fetchAuditDetail(id),
    enabled: !!id,
  });
}

export function useCreateAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { scope: string; scopeFilter?: any; notes?: string }) =>
      createAudit(data.scope, data.scopeFilter, data.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-audits'] });
    },
  });
}

export function useCompleteAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auditId: string) => completeAudit(auditId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-audits'] });
      queryClient.invalidateQueries({ queryKey: ['stock-audit'] });
    },
  });
}

export function useSubmitForReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auditId: string) => submitForReview(auditId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-audits'] });
      queryClient.invalidateQueries({ queryKey: ['stock-audit'] });
    },
  });
}

export function useCancelAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auditId: string) => cancelAuditAction(auditId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-audits'] });
      queryClient.invalidateQueries({ queryKey: ['stock-audit'] });
    },
  });
}

export function useUpdateItemCount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      itemId: string;
      counted_quantity: number;
      variance: number;
      variance_reason?: string;
      variance_notes?: string;
    }) => updateItemCount(data.itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-audit'] });
    },
  });
}
