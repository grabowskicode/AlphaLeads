"use client";

import { LeadCard } from "@/components/dashboard/lead-card";
import { Database } from "lucide-react";
import type { Lead } from "@/lib/types";

interface LeadFeedProps {
  leads: Lead[];
  hidePitch?: boolean;
}

export function LeadFeed({ leads, hidePitch }: LeadFeedProps) {
  // 1. The Empty State
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
        <Database size={48} className="mb-4 opacity-20" />
        <h3 className="text-lg font-bold text-white mb-2">No Leads Found</h3>
        <p className="text-sm max-w-md text-center">
          There are no leads matching your current search or filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 2. The Grid Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}
