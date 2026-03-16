"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Fontos: Ide irányítjuk vissza a felhasználót a linkre kattintás után
      redirectTo: `${location.origin}/auth/callback?next=/update-password`,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Email sent",
        description: "Check your email for the password reset link.",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center px-4",
        isDark ? "bg-[#171717] text-slate-50" : "bg-white text-slate-900",
      )}
    >
      <div
        className={cn(
          "w-full max-w-md rounded-3xl border p-6 shadow-xl",
          isDark ? "border-[#090909] bg-[#090909]" : "border-input bg-white",
        )}
      >
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Reset Password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your email to receive a reset link.
          </p>
        </div>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button
            type="submit"
            className="w-full !bg-[#ffd700] !text-black"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </Button>
          <div className="text-center text-sm">
            <Link href="/login" className="underline hover:text-primary">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
