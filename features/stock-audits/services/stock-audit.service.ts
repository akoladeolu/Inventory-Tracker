import { createClient } from '@/lib/supabase/server';

export async function getAudits(status?: string) {
  const supabase = await createClient();
  let query = supabase
    .from('stock_audits')
    .select('*, started_by_user:users!stock_audits_started_by_fkey(name)')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getAuditById(id: string) {
  const supabase = await createClient();

  const { data: audit, error: auditError } = await supabase
    .from('stock_audits')
    .select('*, started_by_user:users!stock_audits_started_by_fkey(name), reviewed_by_user:users!stock_audits_reviewed_by_fkey(name)')
    .eq('id', id)
    .single();

  if (auditError) throw new Error(auditError.message);

  const { data: items, error: itemsError } = await supabase
    .from('stock_audit_items')
    .select('*, product:products(name, sku, selling_price, category_id)')
    .eq('audit_id', id)
    .order('created_at', { ascending: true });

  if (itemsError) throw new Error(itemsError.message);

  return { ...audit, items: items || [] };
}

export async function updateAuditItemCount(
  itemId: string,
  countedQuantity: number,
  variance: number,
  reason?: string,
  notes?: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('stock_audit_items')
    .update({
      counted_quantity: countedQuantity,
      variance,
      variance_reason: reason || null,
      variance_notes: notes || null,
      scanned_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (error) throw new Error(error.message);
}

export async function submitAuditForReview(auditId: string) {
  const supabase = await createClient();

  // Update counted totals before submitting
  const { data: items } = await supabase
    .from('stock_audit_items')
    .select('counted_quantity, expected_quantity, variance')
    .eq('audit_id', auditId);

  const totalCounted = (items || []).reduce((sum: number, i: any) =>
    sum + (i.counted_quantity ?? i.expected_quantity), 0);
  const totalVariance = (items || []).reduce((sum: number, i: any) =>
    sum + (i.variance ?? 0), 0);

  const { error } = await supabase
    .from('stock_audits')
    .update({
      status: 'pending_review',
      total_counted: totalCounted,
      total_variance: totalVariance,
    })
    .eq('id', auditId);

  if (error) throw new Error(error.message);
}

export async function cancelAudit(auditId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('stock_audits')
    .update({ status: 'cancelled' })
    .eq('id', auditId);

  if (error) throw new Error(error.message);
}
