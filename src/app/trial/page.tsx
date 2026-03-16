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

export default function TrialPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const { theme } = useTheme();
  const supabase = createClientComponentClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create trial.");
      }

      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: pin,
      });

      if (signInError) {
        throw new Error("Invalid PIN. Please check your email and try again.");
      }

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
        <div className="mb-6 text-center">
          <h1
            className={cn(
              "text-xl font-semibold",
              isDark ? "text-white" : "text-slate-900",
            )}
          >
            Try AlphaLeads
          </h1>
          <p
            className={cn(
              "mt-1 text-sm",
              isDark ? "text-slate-300" : "text-slate-700",
            )}
          >
            {step === 1
              ? "Claim your 20 Free Credits"
              : "Check your inbox for the PIN"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
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

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={loading || !email}
                className="mt-2 w-full !bg-[#ffd700] !text-black hover:!bg-[#ffd700]/90 font-medium"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                ) : null}
                {loading ? "Working..." : "Claim Free Credits"}
              </Button>

              <div className="mt-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-start gap-3">
                <AlertCircle
                  size={18}
                  className="text-zinc-500 mt-0.5 shrink-0"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-left">
                  <strong>Risk-Free Trial:</strong> You will instantly receive
                  20 free credits to test the platform. No credit card required.
                </p>
              </div>
            </div>

            <div className="text-center mt-4">
              <Link
                href="/login"
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Already have an account? Log in
              </Link>
            </div>
          </form>
        ) : (
          <form
            onSubmit={handlePinSubmit}
            className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="space-y-1.5">
              <Label htmlFor="pin" className="text-center block">
                6-Digit Access PIN
              </Label>
              <Input
                id="pin"
                type="text"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="------"
                maxLength={6}
                className={cn(
                  "font-mono text-center tracking-[0.5em] text-lg h-12",
                  isDark ? "bg-[#171717] border-white/10" : "",
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={loading || pin.length < 6}
                className="mt-2 w-full !bg-[#ffd700] !text-black hover:!bg-[#ffd700]/90 font-medium"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                ) : null}
                {loading ? "Verifying..." : "Log In & Start Scraping"}
              </Button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-center text-muted-foreground hover:text-foreground hover:underline py-2"
              >
                Wrong email? Go back
              </button>

              <div className="mt-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-start gap-3">
                <AlertCircle
                  size={18}
                  className="text-zinc-500 mt-0.5 shrink-0"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-left">
                  <strong>Email sent!</strong> If you don't see the email with
                  your PIN within 2 minutes, please check your spam or
                  promotional folders.
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
