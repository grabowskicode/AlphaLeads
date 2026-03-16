"use client";

import { useData } from "@/context/data-provider";
import { Button } from "@/components/ui/button";
import { Lock, Mail, Phone, Star, MapPin, Unlock } from "lucide-react";
import type { Lead } from "@/lib/types";

export function LeadCard({ lead }: { lead: Lead }) {
  const { unlockLead, userCredits } = useData();

  const handleUnlock = async () => {
    await unlockLead(lead.id);
  };

  return (
    <div className="bg-[#0b0a0b] border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between h-full">
      {/* 1. HEADER & METADATA */}
      <div>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-base font-bold text-white mb-1 leading-tight">
              {lead.business_name}
            </h3>
            <p className="text-zinc-400 text-xs flex items-center gap-1">
              <MapPin size={12} />
              {lead.city || "Unknown Area"}{" "}
              {lead.zip_code && `(${lead.zip_code})`}
            </p>
          </div>
        </div>

        {/* 2. STATS */}
        <div className="flex gap-4 mb-5 text-xs">
          <div className="flex items-center gap-1">
            <Star
              size={14}
              className={lead.rating < 4 ? "text-red-400" : "text-[#ffe600]"}
            />
            <span
              className={`font-bold ${lead.rating < 4 ? "text-red-400" : "text-white"}`}
            >
              {lead.rating || "N/A"}
            </span>
            <span className="text-zinc-500">
              ({lead.review_count || 0} reviews)
            </span>
          </div>
        </div>
      </div>

      {/* 3. THE CONTACT PAYWALL */}
      <div className="mt-auto border-t border-zinc-800 pt-4">
        {lead.is_unlocked ? (
          // UNLOCKED STATE: Reveal Data
          <div className="space-y-2.5 animate-in fade-in duration-500">
            <div className="flex items-center gap-2.5 text-white">
              <div className="bg-green-500/10 p-1.5 rounded-lg border border-green-500/20">
                <Phone size={14} className="text-green-400" />
              </div>
              <span className="font-medium text-sm select-all">
                {lead.phone || "No phone available"}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-white">
              <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20">
                <Mail size={14} className="text-blue-400" />
              </div>
              <span className="font-medium text-sm select-all truncate">
                {lead.email || "No email available"}
              </span>
            </div>
          </div>
        ) : (
          // LOCKED STATE: Blur & Button
          <div className="relative rounded-xl overflow-hidden border border-zinc-800/50 bg-zinc-900/20 p-3">
            {/* Blurred Fake Data */}
            <div className="space-y-2.5 blur-[5px] opacity-40 select-none pointer-events-none">
              <div className="flex items-center gap-2.5 text-zinc-400">
                <Phone size={14} />
                <span className="text-sm">+1 (555) ***-****</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-400">
                <Mail size={14} />
                <span className="text-sm">contact@********.com</span>
              </div>
            </div>

            {/* Interactive Paywall Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0a0b]/40 backdrop-blur-[2px]">
              <Button
                onClick={handleUnlock}
                disabled={userCredits < 1}
                className="!bg-[#ffe600] text-black hover:!bg-[#ffe600]/90 font-bold rounded-full shadow-lg shadow-[#ffe600]/20 transition-transform active:scale-95 text-xs h-8 px-4"
              >
                {userCredits < 1 ? (
                  <>
                    <Lock size={14} className="mr-1.5" /> Out of Credits
                  </>
                ) : (
                  <>
                    <Unlock size={14} className="mr-1.5" /> Unlock (1 CR)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
