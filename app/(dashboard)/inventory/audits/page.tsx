"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Plus, Search, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreateAuditDialog } from "@/features/stock-audits/components/CreateAuditDialog";
import { AuditStatusBadge } from "@/features/stock-audits/components/AuditStatusBadge";

interface Audit {
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
  created_at: string;
}

const statusTabs = ["all", "in_progress", "pending_review", "completed", "cancelled"];
const statusLabels: Record<string, string> = {
  all: "All",
  in_progress: "In Progress",
  pending_review: "Pending Review",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function AuditsPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const fetchAudits = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("stock_audits")
      .select("*")
      .order("created_at", { ascending: false });

    if (activeTab !== "all") {
      query = query.eq("status", activeTab);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Failed to fetch audits:", error);
    }
    setAudits(data || []);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const scopeLabels: Record<string, string> = {
    full: "Full Inventory",
    category: "By Category",
    brand: "By Brand",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-[#C8A348]" />
            Stock Audits
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Perform and review physical inventory counts
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#C8A348] hover:bg-[#B8933E] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Audit
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-[#111827] shadow-sm"
                : "text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            {statusLabels[tab]}
          </button>
        ))}
      </div>

      {/* Audit List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#C8A348]" />
        </div>
      ) : audits.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#E5E7EB]">
          <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#111827] mb-1">No audits found</h3>
          <p className="text-sm text-[#6B7280]">
            Start a new stock audit to verify physical inventory counts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {audits.map((audit) => (
            <button
              key={audit.id}
              onClick={() => router.push(`/inventory/audits/${audit.id}`)}
              className="w-full bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:border-[#C8A348]/40 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#111827]">
                    {audit.audit_number}
                  </span>
                  <AuditStatusBadge status={audit.status} />
                </div>
                <span className="text-xs text-[#6B7280]">
                  {new Date(audit.started_at).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-[#6B7280]">Scope: </span>
                  <span className="font-medium text-[#111827]">
                    {scopeLabels[audit.scope] || audit.scope}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280]">Items: </span>
                  <span className="font-medium text-[#111827]">
                    {audit.total_expected}
                  </span>
                </div>
                {audit.total_variance !== 0 && (
                  <div>
                    <span className="text-[#6B7280]">Variance: </span>
                    <span
                      className={`font-semibold ${
                        audit.total_variance < 0 ? "text-red-600" : "text-amber-600"
                      }`}
                    >
                      {audit.total_variance > 0 ? "+" : ""}
                      {audit.total_variance}
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <CreateAuditDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={fetchAudits}
      />
    </div>
  );
}
