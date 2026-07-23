'use server';

import { createClient } from '@/lib/supabase/server';
import * as auditService from '../services/stock-audit.service';

export async function createAudit(
  scope: string,
  scopeFilter?: { category_id?: string; brand_id?: string },
  notes?: string
) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('start_stock_audit', {
      p_scope: scope,
      p_scope_filter: scopeFilter || null,
      p_notes: notes || '',
    });

    if (error) throw new Error(error.message);
    return { success: true, auditId: data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function completeAudit(auditId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('complete_stock_audit', {
      p_audit_id: auditId,
    });

    if (error) throw new Error(error.message);
    return { success: true, auditNumber: data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function submitForReview(auditId: string) {
  try {
    await auditService.submitAuditForReview(auditId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function cancelAuditAction(auditId: string) {
  try {
    await auditService.cancelAudit(auditId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateItemCount(
  itemId: string,
  data: {
    counted_quantity: number;
    variance: number;
    variance_reason?: string;
    variance_notes?: string;
  }
) {
  try {
    await auditService.updateAuditItemCount(
      itemId,
      data.counted_quantity,
      data.variance,
      data.variance_reason,
      data.variance_notes
    );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchAudits(status?: string) {
  try {
    const audits = await auditService.getAudits(status);
    return { success: true, data: audits };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

export async function fetchAuditDetail(id: string) {
  try {
    const audit = await auditService.getAuditById(id);
    return { success: true, data: audit };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
