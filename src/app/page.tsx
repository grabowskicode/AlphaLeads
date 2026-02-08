"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Moon,
  Sun,
  ShieldCheck,
  Zap,
  Search,
  Bell,
  Twitter,
  Linkedin,
  Mail,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <div className={cn("min-h-screen transition-colors flex flex-col")}>
      {/* NAVIGATION BAR */}
      <header
        className={cn(
          "sticky top-6 z-50 mx-auto flex w-[90%] max-w-5xl items-center justify-between px-6 py-3",
          "rounded-3xl border shadow-sm",
          isDark
            ? "bg-neutral-950 border-white/30 shadow-black/20"
            : "bg-slate-50 border-slate-200",
        )}
      >
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
          {/* Target Logo is removed as requested previously */}
          <span>AlphaLeads</span>
        </div>

        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/#how-it-works"
            className={cn(
              "text-sm font-medium transition-colors hover:text-[#ffe600]",
              isDark ? "text-slate-200" : "text-slate-800",
            )}
          >
            How it works
          </Link>

          {/* FIX: Added 'hover:bg-transparent' to remove the black background on hover */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              "font-medium transition-colors hover:bg-transparent hover:text-[#ffe600]",
              isDark ? "text-slate-200" : "text-slate-800",
            )}
          >
            <Link href="/login">Log in</Link>
          </Button>

          <div className="h-4 w-[1px] bg-border/50 mx-1"></div>
        </nav>
      </header>

      <main className="flex-1 mx-auto flex w-full max-w-5xl flex-col items-center justify-start px-4 py-10 text-center">
        {/* HERO SECTION */}
        <div className="mx-auto max-w-2xl space-y-8 mb-20 mt-16">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Stop Selling to Cold Databases. Sell to Businesses{" "}
            <span className="text-[#ffe600]">Who Will Respond.</span>
          </h1>

          <p
            className={cn(
              "text-lg max-w-lg mx-auto",
              isDark ? "text-white" : "text-slate-600",
            )}
          >
            Scan your target market and get leads that needs websites or AI
            solutions.
          </p>

          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="!bg-[#fee100] !text-black px-8 text-base h-12 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <Link href="/login">Start Finding Leads →</Link>
              </Button>
            </div>
            <p
              className={cn(
                "text-xs italic",
                isDark ? "text-white" : "text-slate-400",
              )}
            >
              *get 3000 free credits upon registration
            </p>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div id="how-it-works" className="w-full max-w-4xl mb-24 scroll-mt-32">
          <h2 className="text-3xl font-bold mb-12">
            The Set-and-Forget Engine
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            {/* Step 1 */}
            <div
              className={cn(
                "relative p-8 rounded-3xl border flex flex-col items-center text-center hover:scale-105 transition-transform duration-300",
                isDark
                  ? "bg-neutral-950 border-[#333]"
                  : "bg-slate-50 border-slate-200 shadow-sm",
              )}
            >
              <div className="absolute -top-4 bg-[#ffe600] text-black font-bold py-1 px-4 rounded-full text-sm shadow-md">
                STEP 1: SETUP
              </div>
              <div className="mb-6 p-4 rounded-full bg-[#ffe600] text-black shadow-lg">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-bold mb-2">Create a Monitor</h3>
              <p
                className={cn(
                  "text-sm",
                  isDark ? "text-white" : "text-slate-600",
                )}
              >
                Tell us the industry and location (e.g., "Dentists in
                Budapest"). Our AI wakes up every Monday to scan for
                opportunities.
              </p>
            </div>

            {/* Step 2 */}
            <div
              className={cn(
                "relative p-8 rounded-3xl border flex flex-col items-center text-center hover:scale-105 transition-transform duration-300",
                isDark
                  ? "bg-neutral-950 border-[#333]"
                  : "bg-slate-50 border-slate-200 shadow-sm",
              )}
            >
              <div className="absolute -top-4 bg-[#ffe600] text-black font-bold py-1 px-4 rounded-full text-sm shadow-md">
                STEP 2: NOTIFY
              </div>
              <div className="mb-6 p-4 rounded-full bg-[#ffe600] text-black shadow-lg">
                <Bell size={40} />
              </div>
              <h3 className="text-xl font-bold mb-2">Get Trigger Alerts</h3>
              <p
                className={cn(
                  "text-sm",
                  isDark ? "text-white" : "text-slate-600",
                )}
              >
                Receive an email when we find "Fresh Opportunity" (new
                businesses) or "Pain Points" (businesses with bad recent
                reviews).
              </p>
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <h2 className="text-3xl font-bold mb-12">Intelligence Features</h2>
        <div
          id="features"
          className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 text-left"
        >
          <div
            className={cn(
              "p-6 rounded-2xl border hover:scale-105 transition-transform duration-300",
              isDark
                ? "bg-neutral-950 border-[#333]"
                : "bg-slate-50 border-slate-200 shadow-sm",
            )}
          >
            <div className="h-10 w-10 bg-[#ffe600] rounded-lg flex items-center justify-center mb-4 text-black shadow-md">
              <Zap size={20} />
            </div>
            <h3 className="text-xl font-bold mb-2">AI Tagging</h3>
            <p
              className={cn(
                "text-sm",
                isDark ? "text-white" : "text-slate-600",
              )}
            >
              Our AI logic automatically tags leads as "Missed Call" or
              "Chatbot" opportunities based on customer complaints.
            </p>
          </div>

          <div
            className={cn(
              "p-6 rounded-2xl border hover:scale-105 transition-transform duration-300",
              isDark
                ? "bg-neutral-950 border-[#333]"
                : "bg-slate-50 border-slate-200 shadow-sm",
            )}
          >
            <div className="h-10 w-10 bg-[#ffe600] rounded-lg flex items-center justify-center mb-4 text-black shadow-md">
              <Mail size={20} />
            </div>
            <h3 className="text-xl font-bold mb-2">Email Enrichment</h3>
            <p
              className={cn(
                "text-sm",
                isDark ? "text-white" : "text-slate-600",
              )}
            >
              Don't waste time hunting. Unlock verified owner emails with a
              single click using your monthly credits.
            </p>
          </div>

          <div
            className={cn(
              "p-6 rounded-2xl border hover:scale-105 transition-transform duration-300",
              isDark
                ? "bg-neutral-950 border-[#333]"
                : "bg-slate-50 border-slate-200 shadow-sm",
            )}
          >
            <div className="h-10 w-10 bg-[#ffe600] rounded-lg flex items-center justify-center mb-4 text-black shadow-md">
              <Target size={20} />
            </div>
            <h3 className="text-xl font-bold mb-2">Strategic Scripts</h3>
            <p
              className={cn(
                "text-sm",
                isDark ? "text-white" : "text-slate-600",
              )}
            >
              Get a custom AI-generated sales pitch for every lead, referencing
              their specific pain point or opening date.
            </p>
          </div>
        </div>

        {/* SECURITY */}
        <h2 className="text-3xl font-bold mb-12">
          Built for Performance Agencies
        </h2>
        <div
          className={cn(
            "w-full max-w-3xl p-8 rounded-3xl border flex flex-col md:flex-row items-center gap-6 mb-24 hover:scale-105 transition-transform duration-300",
            isDark
              ? "bg-neutral-950 border-[#333]"
              : "bg-slate-50 border-slate-200 shadow-sm",
          )}
        >
          <div className="flex-shrink-0 h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm">
            <ShieldCheck size={32} />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold mb-2">Data Integrity</h3>
            <p
              className={cn(
                "text-sm leading-relaxed",
                isDark ? "text-white" : "text-slate-600",
              )}
            >
              We use AI and Scraper tools to ensure your lead data is fresh
              (recently scraped) and your tags are accurate. No more 3-year-old
              CSV files.
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer
        className={cn(
          "w-full py-8 px-4 border-t mt-auto",
          isDark
            ? "border-[#333] bg-neutral-950"
            : "border-slate-200 bg-slate-50",
        )}
      >
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="text-xl font-semibold">AlphaLeads</div>
            <p
              className={cn(
                "text-sm",
                isDark ? "text-white" : "text-slate-500",
              )}
            >
              © 2026 AlphaLeadsFinder. All rights reserved.
            </p>
          </div>

          <div
            className={cn(
              "flex gap-6 text-sm font-medium",
              isDark ? "text-white" : "text-slate-600",
            )}
          >
            <Link href="#" className="hover:underline">
              Privacy
            </Link>
            <Link href="#" className="hover:underline">
              Terms
            </Link>
            <Link href="#" className="hover:underline">
              Contact
            </Link>
          </div>

          <div className="flex gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <Twitter
                size={18}
                className={isDark ? "text-white" : "text-slate-600"}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <Linkedin
                size={18}
                className={isDark ? "text-white" : "text-slate-600"}
              />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
