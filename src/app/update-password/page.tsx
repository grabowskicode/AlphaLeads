"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme } = useTheme();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please make sure your passwords match.",
      });
    }
    if (password.length < 6) {
      return toast({
        variant: "destructive",
        title: "Password too short",
        description: "Your password must be at least 6 characters long.",
      });
    }

    setIsSubmitting(true);

    try {
      // 1. Get current user session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session found.");

      // 2. Update the secure password in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: password,
      });
      if (authError) throw authError;

      // 3. Flip the database flag so they are no longer locked out
      const { error: dbError } = await supabase
        .from("users")
        .update({ needs_password_change: false })
        .eq("id", session.user.id);
      if (dbError) throw dbError;

      // 4. Success!
      toast({
        title: "Password Updated",
        description: "Your account is now secure. Welcome to AlphaLeads!",
      });

      // Force a hard navigation so the server gatekeeper checks the new state
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update password",
        description: error.message,
      });
      setIsSubmitting(false);
    }
  };

  // Prevent hydration mismatch
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
          "w-full max-w-md rounded-3xl border p-6",
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
            Secure Your Account
          </h1>
          <p
            className={cn(
              "mt-1 text-sm",
              isDark ? "text-slate-300" : "text-slate-700",
            )}
          >
            Please set a permanent password to replace your temporary login
            code.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              className="mt-2 w-full !bg-[#ffd700] !text-black"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Password & Continue"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
