"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Lead, Monitor } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

interface DataContextType {
  leads: Lead[];
  monitors: Monitor[];
  userCredits: number;
  scansThisMonth: number;
  userEmail: string | undefined;
  addMonitor: (
    monitor: Partial<Monitor>,
  ) => Promise<{ success: boolean; error?: string }>;
  startScrape: (monitor: Monitor) => Promise<void>;
  unlockLead: (leadId: string) => Promise<void>;
  unlockAllLeads: (leadIds: string[]) => Promise<void>;
  clearLeads: () => Promise<void>; // NEW: Added to interface
  clearData: () => Promise<void>;
  deleteMonitor: (monitorId: string) => Promise<void>;
  updateMonitor: (
    monitorId: string,
    updates: Partial<Monitor>,
  ) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [userCredits, setUserCredits] = useState(0);
  const [scansThisMonth, setScansThisMonth] = useState(0);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const supabase = createClientComponentClient();

  const COST_PER_UNLOCK = 1;

  // --- 1. FETCH DATA ---
  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserEmail(user.email);

    // Get Credits (Source of Truth)
    const { data: userData } = await supabase
      .from("users")
      .select("credits, scans_this_month")
      .eq("id", user.id)
      .single();

    if (userData) {
      setUserCredits(userData.credits);
      setScansThisMonth(userData.scans_this_month || 0);
    }

    // Get Monitors
    const { data: monitorData } = await supabase
      .from("monitors")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (monitorData) setMonitors(monitorData);

    // Get Leads
    const { data: linkData } = await supabase
      .from("user_leads")
      .select("lead_id, is_unlocked")
      .eq("user_id", user.id);

    if (linkData && linkData.length > 0) {
      const leadIds = linkData.map((link) => link.lead_id);
      const { data: businessData } = await supabase
        .from("leads")
        .select("*")
        .in("id", leadIds);

      if (businessData) {
        const mergedLeads = businessData.map((biz) => {
          const link = linkData.find((l) => l.lead_id === biz.id);
          return { ...biz, is_unlocked: link?.is_unlocked || false };
        });
        setLeads(mergedLeads);
      }
    } else {
      setLeads([]);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 2. ADD MONITOR ---
  const addMonitor = async (
    newMonitor: Partial<Monitor>,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/extract/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMonitor),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error };
      setMonitors((prev) => [data.monitor, ...prev]);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // --- 3. START SCRAPE (V2 ASYNC ARCHITECTURE) ---
  const startScrape = async (monitor: Monitor) => {
    // 1. Optimistically set the UI to active so the user can't double-click
    setMonitors((prev) =>
      prev.map((m) => (m.id === monitor.id ? { ...m, status: "active" } : m)),
    );

    try {
      const startRes = await fetch("/api/extract/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: monitor.keyword,
          location: monitor.location,
        }),
      });

      const startData = await startRes.json();

      // If the backend rejects it (e.g. not enough credits for the dynamic hold)
      if (!startRes.ok) {
        throw new Error(startData.error || "Failed to start");
      }

      // 2. Fetch data immediately to sync the new pre-charge deduction from the database
      await fetchData();

      // 3. Inform the user of the new background process
      toast({
        title: "Background Scan Started 🚀",
        description:
          "Your scan is running safely in the background. We reserved the max credits and will auto-refund the difference when finished. You can close this tab or check back in 10-20 minutes.",
        duration: 10000, // Show for 10 seconds
      });
    } catch (error: any) {
      console.error(error);

      // Force Sync to ensure we match DB
      await fetchData();

      toast({
        title: "Scan Failed",
        description: error.message,
        variant: "destructive",
      });

      // Revert UI to paused
      setMonitors((prev) =>
        prev.map((m) => (m.id === monitor.id ? { ...m, status: "paused" } : m)),
      );
    }
  };

  // --- 4. UNLOCK SINGLE LEAD ---
  const unlockLead = async (leadId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (userCredits < COST_PER_UNLOCK) {
      toast({
        title: "Insufficient Credits",
        description: "Need 1 credit.",
        variant: "destructive",
      });
      return;
    }

    setUserCredits((prev) => prev - COST_PER_UNLOCK);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, is_unlocked: true } : l)),
    );

    await supabase
      .from("users")
      .update({ credits: userCredits - COST_PER_UNLOCK })
      .eq("id", user.id);
    await supabase
      .from("user_leads")
      .update({ is_unlocked: true })
      .eq("user_id", user.id)
      .eq("lead_id", leadId);
  };

  // --- 5. BULK UNLOCK ---
  const unlockAllLeads = async (leadIds: string[]) => {
    const cost = leadIds.length * COST_PER_UNLOCK;
    if (cost === 0) return;

    if (userCredits < cost) {
      toast({
        title: "Insufficient Credits",
        description: `Need ${cost} credits.`,
        variant: "destructive",
      });
      return;
    }

    setUserCredits((prev) => prev - cost);
    setLeads((prev) =>
      prev.map((l) =>
        leadIds.includes(l.id) ? { ...l, is_unlocked: true } : l,
      ),
    );

    try {
      const res = await fetch("/api/extract/leads/unlock-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({
        title: "Leads Unlocked",
        description: `Unlocked ${leadIds.length} leads.`,
      });
    } catch (error) {
      setUserCredits((prev) => prev + cost);
      setLeads((prev) =>
        prev.map((l) =>
          leadIds.includes(l.id) ? { ...l, is_unlocked: false } : l,
        ),
      );
      toast({
        title: "Error",
        description: "Failed to unlock.",
        variant: "destructive",
      });
    }
  };

  // --- 6. CLEAR LEADS (WORKSPACE RESET) ---
  const clearLeads = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // This ONLY deletes the user's connection to the lead.
    // The business data remains safely stored in your master 'leads' database.
    await supabase.from("user_leads").delete().eq("user_id", user.id);
    setLeads([]);

    toast({
      title: "Workspace Cleared",
      description: "Your leads have been cleared for a fresh start.",
    });
  };

  const clearData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_leads").delete().eq("user_id", user.id);
    await supabase.from("monitors").delete().eq("user_id", user.id);
    setLeads([]);
    setMonitors([]);
  };

  const deleteMonitor = async (monitorId: string) => {
    try {
      await fetch(`/api/extract/monitors?id=${monitorId}`, {
        method: "DELETE",
      });
      setMonitors((prev) => prev.filter((m) => m.id !== monitorId));
    } catch (e) {}
  };

  const updateMonitor = async (
    monitorId: string,
    updates: Partial<Monitor>,
  ) => {
    await supabase.from("monitors").update(updates).eq("id", monitorId);
    setMonitors((prev) =>
      prev.map((m) => (m.id === monitorId ? { ...m, ...updates } : m)),
    );
  };

  return (
    <DataContext.Provider
      value={{
        leads,
        monitors,
        userCredits,
        scansThisMonth,
        userEmail,
        addMonitor,
        startScrape,
        unlockLead,
        unlockAllLeads,
        clearLeads, // NEW: Exposed via provider
        clearData,
        deleteMonitor,
        updateMonitor,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
}
