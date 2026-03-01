"use client";
import { useState } from "react";

export default function AdminInvitePage() {
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Sending...");

    const res = await fetch("/api/admin/0320", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, secret }),
    });

    const data = await res.json();
    if (res.ok) {
      setStatus("✅ Success! Invite sent.");
      setEmail(""); // Clear the input for the next user
    } else {
      setStatus(`❌ Error: ${data.error}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
          AlphaLeads Admin
        </h1>
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1">
              Admin Password
            </label>
            <input
              type="password"
              required
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-4 py-2 border rounded-md bg-transparent dark:border-zinc-700 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter WEBHOOK_SECRET"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1">
              Client Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-md bg-transparent dark:border-zinc-700 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="client@example.com"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium py-2 px-4 rounded-md hover:bg-zinc-800 dark:hover:bg-white transition-colors mt-2"
          >
            Send Instant Invite
          </button>
        </form>
        {status && (
          <p className="mt-4 text-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
