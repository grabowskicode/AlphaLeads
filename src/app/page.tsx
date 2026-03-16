"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Zap,
  Search,
  Bell,
  Twitter,
  Linkedin,
  Mail,
  Target,
  ArrowRight,
  CheckCircle2,
  Lock,
  Play,
  Activity,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // --- DASHBOARD THEME EXTRACTION ---
  const cardStyle = cn(
    "group relative p-8 rounded-2xl border flex flex-col items-start text-left transition-all duration-300 hover:border-[#ffe600]/30 overflow-hidden",
    "bg-white/5 border-zinc-800 shadow-sm",
  );

  return (
    <div className="min-h-screen flex flex-col font-sans bg-black text-white selection:bg-[#ffe600] selection:text-black">
      {/* --- NAVIGATION BAR --- */}
      <header className="sticky top-6 z-50 mx-auto flex w-[90%] max-w-5xl items-center justify-between px-6 py-3 rounded-full border border-zinc-800 bg-[#0b0a0b]/80 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2 font-bold tracking-tight">
          <span className="text-2xl text-[#ffff]">AlphaLeads</span>
        </div>

        <nav className="flex items-center gap-6 font-medium">
          <Link
            href="/#how-it-works"
            className="hidden sm:block text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            How it works
          </Link>

          <Link
            href="/login"
            className="hidden sm:block text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Log in
          </Link>

          {/* PRIMARY FREE TRIAL BUTTON */}
          <Button
            asChild
            size="sm"
            className="!bg-[#ffe600] !text-black font-bold text-sm rounded-full hover:!bg-[#ffe600]/90 transition-all shadow-[0_0_15px_rgba(255,230,0,0.3)] px-6 ml-2"
          >
            <Link href="/trial">Free Trial</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 mx-auto flex w-full max-w-6xl flex-col items-center justify-start px-4 py-12 text-center">
        {/* --- HERO SECTION --- */}
        <div className="mx-auto max-w-4xl space-y-8 mb-12 mt-8">
          <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl text-white">
            Hunt the <span className="text-[#ffe600]">1% of Businesses</span>{" "}
            That Needs You.
          </h1>

          <p className="text-lg md:text-xl max-w-xl mx-auto leading-relaxed text-zinc-400">
            Stop burning credits on successful companies. We scan the market and
            only show you businesses with{" "}
            <span className="text-zinc-200">low ratings</span>,{" "}
            <span className="text-zinc-200">missing websites</span>, or{" "}
            <span className="text-zinc-200">unclaimed profiles</span>.
          </p>

          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* PRIMARY HERO TRIAL BUTTON */}
              <Button
                asChild
                size="lg"
                className="!bg-[#ffe600] !text-black px-8 text-lg h-14 rounded-full font-bold shadow-[0_0_30px_-5px_rgba(255,230,0,0.3)] hover:shadow-[0_0_40px_-5px_rgba(255,230,0,0.4)] hover:scale-105 transition-all"
              >
                <Link href="/trial">
                  Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>

              {/* SECONDARY HERO LOGIN BUTTON */}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="px-8 text-lg h-14 rounded-full font-bold border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all"
              >
                <Link href="/login">Member Login</Link>
              </Button>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={14} className="text-[#ffe600]" /> 3000
                Credits / Month
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={14} className="text-[#ffe600]" /> No Credit
                Card Required
              </span>
            </div>
          </div>
        </div>

        {/* --- DEMO VIDEO SECTION --- */}
        <div className="w-full max-w-5xl mb-20 relative z-10">
          <div className="relative aspect-video w-full rounded-2xl border border-zinc-800 bg-[#0b0a0b] overflow-hidden shadow-2xl group cursor-pointer hover:border-[#ffe600]/50 transition-colors">
            <video
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src="/demo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="absolute -inset-1 bg-gradient-to-r from-[#ffe600]/10 via-[#ffe600]/5 to-[#ffe600]/10 blur-3xl -z-10 rounded-[3rem] opacity-30"></div>
        </div>

        {/* --- HOW IT WORKS (The Sniper Logic) --- */}
        <div id="how-it-works" className="w-full max-w-5xl mb-20 scroll-mt-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-white">
              The "Sniper" Logic
            </h2>
            <p className="text-zinc-400">
              Most scrapers dump 1,000 bad leads on you. We filter for pain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className={cardStyle}>
              <div className="absolute -right-6 -top-6 text-white/5 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <Search size={100} />
              </div>
              <div className="relative z-10">
                <Search size={32} className="text-[#ffe600] mb-4" />
                <h3 className="text-xl font-bold mb-2 text-white">
                  1. The Wide Scan
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  You enter a niche (e.g. "Roofers in Miami"). Our engine checks
                  hundreds of Google Maps listings in seconds to gather raw
                  data.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className={cardStyle}>
              <div className="absolute -right-6 -top-6 text-white/5 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <Trash2 size={100} />
              </div>
              <div className="relative z-10">
                <Trash2 size={32} className="text-[#ffe600] mb-4" />
                <h3 className="text-xl font-bold mb-2 text-white">
                  2. The "Kill" Filter
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  We automatically <strong>discard</strong> successful
                  businesses (4.9+ rating, verified, good website). It's hard to
                  sell to them, so you don't pay for these leads.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className={cardStyle}>
              <div className="absolute -right-6 -top-6 text-white/5 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <Target size={100} />
              </div>
              <div className="relative z-10">
                <Target size={32} className="text-[#ffe600] mb-4" />
                <h3 className="text-xl font-bold mb-2 text-white">
                  3. The Opportunity
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  You only see "Distressed" businesses:
                  <br />
                  <span className="text-[#ffe600]">• Low Ratings</span> (Need
                  Reputation)
                  <br />
                  <span className="text-[#ffe600]">• No Website</span> (Need
                  Design)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- FEATURES GRID --- */}
        <div id="features" className="w-full max-w-5xl mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-white">
              Intelligence Features
            </h2>
            <p className="text-zinc-400">
              Everything you need to close the deal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className={cardStyle}>
              <div className="absolute -right-6 -top-6 text-white/5 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <Mail size={120} />
              </div>
              <div className="relative z-10">
                <Mail size={32} className="text-[#ffe600] mb-4" />
                <h3 className="text-xl font-bold mb-2 text-white">
                  Verified Owner Emails
                </h3>
                <p className="text-sm text-zinc-400">
                  We don't just scrape garbage, we cross-reference data to find
                  personal emails of decision-makers, verified instantly.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className={cardStyle}>
              <div className="absolute -right-6 -top-6 text-white/5 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <Zap size={120} />
              </div>
              <div className="relative z-10">
                <Zap size={32} className="text-[#ffe600] mb-4" />
                <h3 className="text-xl font-bold mb-2 text-white">
                  AI Pitch Generator
                </h3>
                <p className="text-sm text-zinc-400">
                  One-click AI scripts that reference the business's specific
                  bad review or missing website. "I saw your 1-star review
                  about..."
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className={cardStyle}>
              <div className="absolute -right-6 -top-6 text-white/5 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <Bell size={120} />
              </div>
              <div className="relative z-10">
                <Bell size={32} className="text-[#ffe600] mb-4" />
                <h3 className="text-xl font-bold mb-2 text-white">
                  "Fresh" Monitors
                </h3>
                <p className="text-sm text-zinc-400">
                  Set a monitor for "Dentists". We'll email you the moment a NEW
                  dentist opens or gets a bad review. Be the first to pitch.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className={cardStyle}>
              <div className="absolute -right-6 -top-6 text-white/5 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <Lock size={120} />
              </div>
              <div className="relative z-10">
                <Lock size={32} className="text-[#ffe600] mb-4" />
                <h3 className="text-xl font-bold mb-2 text-white">
                  Risk-Free Guarantee
                </h3>
                <p className="text-sm text-zinc-400">
                  If a scan returns 0 qualified leads (market saturation), we
                  automatically refund your credits instantly. You never lose.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="w-full py-12 px-6 border-t border-zinc-800 bg-[#0b0a0b] mt-auto">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="text-lg font-bold text-white">AlphaLeads</div>
            <p className="text-xs text-zinc-500">© 2026 AlphaLeads Systems.</p>
          </div>

          <div className="flex gap-6 text-sm font-medium text-zinc-400">
            <Link href="#" className="hover:text-[#ffe600] transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-[#ffe600] transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-[#ffe600] transition-colors">
              Contact
            </Link>
          </div>

          <div className="flex gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:!bg-white hover:!text-black text-zinc-400 transition-all"
            >
              <Twitter size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:!bg-white hover:!text-black text-zinc-400 transition-all"
            >
              <Linkedin size={18} />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
