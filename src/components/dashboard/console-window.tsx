"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Terminal, 
  Trash2, 
  RefreshCw, 
  Activity, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { useData } from "@/context/data-provider";

// The animated status renderer (No Emojis)
const renderStatus = (status: string) => {
  switch (status) {
    case "running":
      return (
        <span className="flex items-center text-blue-400 text-xs font-medium">
          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
          Scanning Maps...
        </span>
      );
    case "enriching":
      return (
        <span className="flex items-center text-[#ffe600] text-xs font-medium">
          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
          Finding Emails...
        </span>
      );
    case "completed":
      return (
        <span className="flex items-center text-green-400 text-xs font-medium">
          <CheckCircle2 className="w-3 h-3 mr-1.5" />
          Ready
        </span>
      );
    case "failed":
      return (
        <span className="flex items-center text-red-400 text-xs font-medium">
          <AlertCircle className="w-3 h-3 mr-1.5" />
          Failed
        </span>
      );
    default:
      return <span className="text-zinc-500 text-xs capitalize">{status}</span>;
  }
};

export function ConsoleWindow() {
  const { monitors, deleteMonitor } = useData();
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/extract/logs");
      if (!res.ok) throw new Error("Route not found");
      const data = await res.json();

      if (data.logs) setLogs(data.logs);
    } catch (e) {
      console.error("Failed to fetch logs. Check API path.");
    }
  };

  const clearLogs = async () => {
    await fetch("/api/extract/logs", { method: "DELETE" });
    setLogs([]);
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. ACTIVE SCANS TABLE */}
      <div className="rounded-xl border border-zinc-800 bg-[#0b0a0b] overflow-hidden shadow-2xl">
        <div className="flex items-center border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <Activity size={16} className="text-blue-400 mr-2" />
          <span className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
            Active Scans
          </span>
        </div>
        
        <div className="overflow-x-auto">
          {monitors.length === 0 ? (
            <div className="p-4 text-zinc-500 text-sm italic">
              No active scans currently running.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/20 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Target Keyword</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Live Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {monitors.map((monitor) => (
                  <tr 
                    key={monitor.id} 
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-zinc-200 font-medium">{monitor.keyword}</td>
                    <td className="px-4 py-3 text-zinc-400">{monitor.location}</td>
                    <td className="px-4 py-3">{renderStatus(monitor.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteMonitor(monitor.id)}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Delete Scan Record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 2. RAW TERMINAL LOGS */}
      <div className="rounded-xl border border-zinc-800 bg-[#0b0a0b] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-[#ffe600]" />
            <span className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
              Live System Logs
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchLogs}
              className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={clearLogs}
              className="p-1.5 rounded-md hover:bg-red-500/20 hover:text-red-500 text-zinc-400 transition-colors"
              title="Clear Logs"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="h-64 overflow-y-auto p-4 font-mono text-xs space-y-2 bg-black/80 backdrop-blur-sm scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
        >
          {logs.length === 0 ? (
            <p className="text-zinc-600 italic">Waiting for system activity...</p>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                className="text-green-400/90 break-all border-l-2 border-transparent hover:border-[#ffe600]/50 pl-2 transition-all"
              >
                <span className="opacity-50 mr-2">{log.split("]")[0]}]</span>
                <span>{log.split("]").slice(1).join("]")}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
