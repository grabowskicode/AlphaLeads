"use client";

import {
  Radio,
  Target,
  Globe,
  AlertTriangle,
  Play,
  Loader2,
  Trash2,
  Activity,
} from "lucide-react";
import { useData } from "@/context/data-provider";
import { AddMonitorDialog } from "@/components/dashboard/add-monitor-dialog";
import { ConsoleWindow } from "@/components/dashboard/console-window";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

export default function DashboardPage() {
  const { leads, monitors, deleteMonitor, startScrape, scansThisMonth } =
    useData();

  // --- 1. METRIC: Total Leads ---
  const totalLeads = leads.length;

  // --- 2. METRIC: Needs Website (Fresh Ops) ---
  const websiteLeads = leads.filter(
    (l) => !l.website || l.is_verified === false,
  ).length;

  // --- 3. METRIC: Bad Reviews (Pain Points) ---
  const badReviewLeads = leads.filter(
    (l) =>
      (l.rating > 0 && l.rating < 4.5) ||
      (l.review_count > 0 && l.review_count < 50) ||
      (l.reviews_per_score_1 && l.reviews_per_score_1 > 0),
  ).length;

  // --- 4. METRIC: Scans Left ---
  const MAX_SCANS = 10;
  const scansLeft = Math.max(0, MAX_SCANS - scansThisMonth);

  const stats = [
    {
      label: "Scans Remaining",
      value: `${scansLeft} / ${MAX_SCANS}`,
      color: scansLeft === 0 ? "text-red-500" : "text-[#ffe600]",
      icon: Activity,
    },
    {
      label: "Total Leads",
      value: totalLeads,
      color: "text-white",
      icon: Target,
    },
    {
      label: "Needs Website",
      value: websiteLeads,
      color: "text-blue-400",
      icon: Globe,
    },
    {
      label: "Bad Reviews",
      value: badReviewLeads,
      color: "text-red-400",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto space-y-6 md:space-y-8 pt-6 md:pt-14 pb-20">
      {/* SECTION 1: STATS */}
      <div className="space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="group relative overflow-hidden bg-white/5 border border-zinc-800 p-6 rounded-2xl shadow-sm hover:border-[#ffe600]/30 transition-all"
            >
              {/* Ghost Icon Effect */}
              <div className="absolute -right-6 -top-6 text-white/5 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <stat.icon size={100} />
              </div>

              <div className="relative z-10">
                <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                  <stat.icon size={16} className={stat.color} />
                  {stat.label}
                </p>
                <p className={`text-4xl font-bold mt-2 ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: ACTIVE MONITORS */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio size={20} className="text-[#ffe600]" />
            Active Scans Monitor
          </h2>
          <div className="w-full md:w-auto bg-[#ffe600] rounded-full text-black font-bold shadow-lg shadow-[#ffe600]/20 transition-all hover:bg-[#ffe600]/90">
            <div className="w-full md:w-auto flex justify-center">
              <AddMonitorDialog />
            </div>
          </div>
        </div>

        <div className="bg-[#0b0a0b] border border-zinc-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-3">Keyword</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last Checked</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {monitors.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-zinc-500"
                  >
                    No active scans. Click "Add Scan" to start tracking.
                  </td>
                </tr>
              ) : (
                monitors.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-zinc-900/50 transition-colors group"
                  >
                    <td className="px-6 py-4 text-white font-medium">
                      {m.keyword}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{m.location}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={`uppercase text-[10px] tracking-wider border ${
                          m.status === "active"
                            ? "bg-[#ffe600]/10 text-[#ffe600] border-[#ffe600]/20 animate-pulse"
                            : "bg-zinc-800 text-zinc-500 border-zinc-700"
                        }`}
                      >
                        {m.status === "active" ? "RUNNING" : "READY"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      {/* START BUTTON */}
                      {m.status !== "active" ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-[#ffe600] hover:text-[#ffe600] hover:bg-[#ffe600]/10"
                              title="Start Scan (100 Credits)"
                            >
                              <Play size={16} fill="currentColor" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Start New Scan?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action will start a fresh scrape for{" "}
                                <strong>"{m.keyword}"</strong> in{" "}
                                <strong>"{m.location}"</strong>.
                                <br />
                                <br />
                                <span className="text-[#ffe600] font-bold">
                                  Cost: 100 Credits
                                </span>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => startScrape(m)}
                                className="!bg-[#ffe600] !text-black hover:!bg-[#ffe600]/90 font-bold border-none"
                              >
                                Confirm (100 Credits)
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <div className="flex items-center text-[#ffe600] text-xs font-bold px-3">
                          <Loader2 className="animate-spin mr-2" size={14} />
                          Scraping...
                        </div>
                      )}

                      {/* DELETE BUTTON */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete this monitor?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will also delete all leads associated with
                              it.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMonitor(m.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK LINK */}
      <div className="flex justify-end pt-2">
        <Link href="/leads" className="w-full md:w-auto">
          <Button
            variant="outline"
            className="w-full md:w-auto text-zinc-400 hover:text-white border-zinc-700"
          >
            View All Leads →
          </Button>
        </Link>
      </div>

      {/* CONSOLE WINDOW */}
      <div className="space-y-4 pt-4">
        <ConsoleWindow />
      </div>
    </div>
  );
}
