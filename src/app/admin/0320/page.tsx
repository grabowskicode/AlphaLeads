"use client";

import { useState } from "react";
import { Copy, RefreshCw } from "lucide-react";

export default function AdminInvitePage() {
  const [secret, setSecret] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    setGeneratedKey("");

    // Notice how this calls the /api/ folder!
    const res = await fetch("/api/admin/0320", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });

    const data = await res.json();
    if (res.ok) {
      setGeneratedKey(data.key);
      setStatus("✅ Success! Send this code to the new member.");
    } else {
      setStatus(`❌ Error: ${data.error}`);
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
    setStatus("✅ Copied to clipboard!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0a0b] px-4 text-white">
      <div className="p-8 bg-zinc-900/50 border border-white/10 rounded-3xl shadow-2xl max-w-md w-full backdrop-blur-xl">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Premium Key Generator
        </h1>

        {generatedKey && (
          <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-[#ffe600]/30 flex items-center justify-between">
            <span className="text-[#ffe600] font-mono font-bold text-2xl tracking-[0.2em]">
              {generatedKey}
            </span>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <Copy size={20} className="text-zinc-400 hover:text-white" />
            </button>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Admin Password
            </label>
            <input
              type="password"
              required
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#ffe600] transition-colors"
              placeholder="Enter WEBHOOK_SECRET"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !secret}
            className="w-full h-12 bg-[#ffe600] text-black font-bold rounded-xl hover:bg-[#ffe600]/90 transition-all flex items-center justify-center"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              "Generate 1-Time Code"
            )}
          </button>
        </form>

        {status && (
          <p className="mt-4 text-center text-sm font-medium text-zinc-400">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
