"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AuditStatusBadge } from "@/features/stock-audits/components/AuditStatusBadge";

interface AuditItem {
  id: string;
  expected_quantity: number;
  counted_quantity: number | null;
  variance: number | null;
  variance_reason: string | null;
  variance_notes: string | null;
  scanned_at: string | null;
  product: {
    name: string;
    sku: string;
    selling_price: string;
  } | null;
}

interface AuditDetail {
  id: string;
  audit_number: string;
  scope: string;
  status: string;
  total_expected: number;
  total_counted: number;
  total_variance: number;
  variance_value: string;
  notes: string | null;
  started_at: string;
  completed_at: string | null;
  items: AuditItem[];
}

export default function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: auditData, error: auditError } = await supabase
      .from("stock_audits")
      .select("*")
      .eq("id", resolvedParams.id)
      .single();

    if (auditError || !auditData) {
      toast.error("Audit not found");
      setLoading(false);
      return;
    }

    const { data: itemsData } = await supabase
      .from("stock_audit_items")
      .select(`
        *,
        product:products(name, sku, selling_price)
      `)
      .eq("audit_id", resolvedParams.id)
      .order("created_at", { ascending: true });

    setAudit({
      ...auditData,
      items: itemsData || [],
    });
    setLoading(false);
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  const handleApprove = async () => {
    if (!audit) return;
    setActionLoading(true);
    try {
      const supabase = createClient();
      const { data: result, error } = await supabase.rpc("complete_stock_audit", {
        p_audit_id: audit.id,
      });

      if (error) throw error;

      toast.success(`Audit ${result} approved & stock movements created! 🎉`);
      fetchAudit();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve audit");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!audit) return;
    setActionLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("stock_audits")
        .update({ status: "cancelled" })
        .eq("id", audit.id);

      if (error) throw error;

      toast.success("Audit cancelled");
      fetchAudit();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel audit");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#C8A348]" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center py-20">
        <h2 className="text-xl font-bold text-gray-900">Audit Not Found</h2>
        <Button onClick={() => router.push("/inventory/audits")} className="mt-4">
          Back to Audits
        </Button>
      </div>
    );
  }

  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return `\u20A6${num.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const itemsWithVariance = audit.items.filter((i) => i.variance && i.variance !== 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Nav */}
      <button
        onClick={() => router.push("/inventory/audits")}
        className="flex items-center text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Stock Audits
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#111827]">{audit.audit_number}</h1>
            <AuditStatusBadge status={audit.status} />
          </div>
          <p className="text-sm text-[#6B7280] mt-1">
            Scope: <span className="font-semibold text-[#111827] uppercase">{audit.scope}</span> · Started {new Date(audit.started_at).toLocaleString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {audit.status === "pending_review" && (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={actionLoading}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Cancel Audit
              </Button>
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-[#C8A348] hover:bg-[#B8933E] text-white"
              >
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Approve & Apply Adjustments
              </Button>
            </>
          )}
          {audit.status === "in_progress" && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={actionLoading}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Cancel Audit
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Total Expected</span>
          <p className="text-2xl font-bold text-[#111827] mt-1">{audit.total_expected}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Total Counted</span>
          <p className="text-2xl font-bold text-[#111827] mt-1">{audit.total_counted || audit.total_expected}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Discrepancy Items</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{itemsWithVariance.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Variance Value</span>
          <p className={`text-2xl font-bold mt-1 ${parseFloat(audit.variance_value) < 0 ? "text-red-600" : "text-[#111827]"}`}>
            {formatCurrency(audit.variance_value || 0)}
          </p>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="p-5 border-b border-[#E5E7EB] flex justify-between items-center">
          <h3 className="font-semibold text-[#111827]">Audit Line Items</h3>
          <span className="text-xs text-[#6B7280]">{audit.items.length} items total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8F9FA] text-xs font-semibold text-[#6B7280] uppercase border-b border-[#E5E7EB]">
              <tr>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">SKU</th>
                <th className="px-6 py-3.5 text-center">Expected</th>
                <th className="px-6 py-3.5 text-center">Counted</th>
                <th className="px-6 py-3.5 text-center">Variance</th>
                <th className="px-6 py-3.5">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {audit.items.map((item) => {
                const hasVariance = item.variance && item.variance !== 0;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      hasVariance ? (item.variance! < 0 ? "bg-red-50/40" : "bg-amber-50/40") : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-semibold text-[#111827]">
                      {item.product?.name || "Unknown Product"}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-[#6B7280]">
                      {item.product?.sku || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-[#111827]">
                      {item.expected_quantity}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-[#111827]">
                      {item.counted_quantity !== null ? item.counted_quantity : "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.variance !== null && item.variance !== 0 ? (
                        <span
                          className={`font-bold px-2 py-1 rounded-md text-xs ${
                            item.variance < 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.variance > 0 ? `+${item.variance}` : item.variance}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#6B7280] capitalize">
                      {item.variance_reason ? item.variance_reason.replace("_", " ") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
