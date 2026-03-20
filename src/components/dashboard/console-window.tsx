"use client";

import { useEffect, useState, useRef } from "react";
import { Terminal, Trash2, RefreshCw } from "lucide-react";

export function ConsoleWindow() {
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
      {/* RAW TERMINAL LOGS */}
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
