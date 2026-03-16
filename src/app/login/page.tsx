"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const supabase = createClientComponentClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  // State checks
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);

    // Check active session
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
      }
    };
    checkSession();
  }, []);

  const isDark = theme === "dark";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setEmail("");
    setPassword("");
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Google Login Failed",
        description: error.message,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const loginAttempts = JSON.parse(
      localStorage.getItem("loginAttempts") || "{}",
    );
    const now = new Date().getTime();

    if (loginAttempts[email] && loginAttempts[email].count >= 5) {
      const lastAttempt = loginAttempts[email].timestamp;
      if (now - lastAttempt < 5 * 60 * 1000) {
        toast({
          variant: "destructive",
          title: "Too many failed login attempts",
          description: "Please try again in 5 minutes.",
        });
        return;
      } else {
        delete loginAttempts[email];
        localStorage.setItem("loginAttempts", JSON.stringify(loginAttempts));
      }
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      if (!loginAttempts[email]) {
        loginAttempts[email] = { count: 0, timestamp: 0 };
      }
      loginAttempts[email].count++;
      loginAttempts[email].timestamp = now;
      localStorage.setItem("loginAttempts", JSON.stringify(loginAttempts));

      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
      setIsSubmitting(false);
    } else {
      delete loginAttempts[email];
      localStorage.setItem("loginAttempts", JSON.stringify(loginAttempts));

      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      });
      router.refresh();
      router.push("/dashboard");
      router.refresh();
      router.push("/dashboard");
    }
  };

  // --- RENDER ---

  if (!mounted) return null;

  // SCENARIO 1: User is ALREADY LOGGED IN
  if (currentUser) {
    return (
      <div
        className={cn(
          "flex min-h-screen items-center justify-center px-4",
          isDark ? "bg-[#171717] text-slate-50" : "bg-white text-slate-900",
        )}
      >
        <div
          className={cn(
            "w-full max-w-md rounded-3xl border p-8 text-center",
            isDark ? "border-[#090909] bg-[#090909]" : "border-input bg-white",
          )}
        >
          <div className="mb-6 flex flex-col items-center">
            <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
              {currentUser.email?.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold mb-2">Welcome Back!</h1>
            <p className="text-sm text-muted-foreground mb-4">
              You are currently signed in as <br />
              <span className="font-semibold text-foreground">
                {currentUser.email}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              className="w-full text-base py-6 !bg-[#ffd700] !text-black"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // SCENARIO 2: NOT LOGGED IN (Show Form)
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
            AlphaLeads
          </h1>
          <p
            className={cn(
              "mt-1 text-sm",
              isDark ? "text-slate-300" : "text-slate-700",
            )}
          >
            Members Only Access
          </p>
        </div>

        {/* Google Login Removed or kept based on preference.
            Usually invite-only apps stick to Email/Password invite links.
            Kept here for convenience if you use Google for your own team. */}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              className="mt-2 w-full !bg-[#ffd700] !text-black"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Working..." : "Sign in"}
            </Button>

            <Link
              href="/forgot-password"
              className="text-xs text-center text-muted-foreground hover:text-foreground hover:underline py-1"
            >
              Forgot password?
            </Link>

            {/* CTO CHANGE: REMOVED REGISTER BUTTON & ADDED INVITE NOTICE */}
            <div className="mt-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-start gap-3">
              <AlertCircle
                size={18}
                className="text-zinc-500 mt-0.5 shrink-0"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-left">
                <strong>Invite Only:</strong> Public registration is disabled.
                You can Sign Up by joining the{" "}
                <a
                  href="https://www.skool.com/cold-email-accelerator-6406/plans"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  Premium Skool
                </a>{" "}
                tier in the community.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
