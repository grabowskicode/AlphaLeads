"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function PremiumSignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const { theme } = useTheme();
  const supabase = createClientComponentClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, licenseKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError)
        throw new Error(
          "Account created, but auto-login failed. Please log in manually.",
        );

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center px-4",
        isDark ? "bg-[#171717] text-slate-50" : "bg-white text-slate-900",
      )}
    >
      <div
        className={cn(
          "w-full max-w-md rounded-3xl border p-6 transition-all duration-300",
          isDark ? "border-[#090909] bg-[#090909]" : "border-input bg-white",
        )}
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <h1
            className={cn(
              "text-xl font-semibold",
              isDark ? "text-white" : "text-slate-900",
            )}
          >
            AlphaLeads Premium
          </h1>
          <p
            className={cn(
              "mt-1 text-sm",
              isDark ? "text-slate-300" : "text-slate-700",
            )}
          >
            Your 1-Time Access Code is in your Skool DM's
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Account Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={cn(isDark ? "bg-[#171717] border-white/10" : "")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Create a Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={cn(isDark ? "bg-[#171717] border-white/10" : "")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="licenseKey">1-Time Access Code</Label>
            <Input
              id="licenseKey"
              type="text"
              required
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="e.g. 218492"
              className={cn(isDark ? "bg-[#171717] border-white/10" : "")}
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              disabled={loading || !email || !password || !licenseKey}
              className="mt-2 w-full !bg-[#ffd700] !text-black hover:!bg-[#ffd700]/90 font-medium"
            >
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
              ) : null}
              {loading ? "Verifying..." : "Unlock Premium Access"}
            </Button>

            <div className="mt-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-start gap-3">
              <AlertCircle
                size={18}
                className="text-zinc-500 mt-0.5 shrink-0"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-left">
                <strong>Important:</strong> This code can only be used once.
                After your account is created, you will use your email and
                password to log in.
              </p>
            </div>
          </div>

          <div className="text-center mt-2">
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Already upgraded? Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
