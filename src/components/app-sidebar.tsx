"use client";

import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Coins,
  ChevronUp,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "@/context/data-provider";

export function AppSidebar() {
  const pathname = usePathname();
  const { userCredits, userEmail } = useData();
  const credits = userCredits ?? 0;

  // LOGIC: Get first 2 letters of email for the icon
  const displayEmail = userEmail || "user@alphaleads.com";
  const userInitials = displayEmail.substring(0, 2).toUpperCase();

  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      style={{ "--sidebar-width": "15.5rem" } as React.CSSProperties}
      className="m-4 h-[calc(100vh-2rem)] rounded-3xl border border-white/10 bg-[#0b0a0b]/90 shadow-2xl backdrop-blur-2xl [&_[data-sidebar=sidebar]]:!bg-transparent [&_[data-sidebar=sidebar]]:!border-none"
    >
      <SidebarHeader className="border-b border-white/5 p-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          AlphaLeads
        </h1>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        {/* Credit Glass Widget */}
        <div className="group relative mb-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-[#ffe600]/30 hover:shadow-[0_0_30px_rgba(255,230,0,0.05)]">
          <div className="absolute -right-4 -top-4 text-white/5 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
            <Coins size={80} />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Credits
            </span>
          </div>
          <div className="text-4xl font-bold text-white tracking-tight">
            {credits}
          </div>
          <button className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#ffe600] transition-colors hover:text-[#ffe600]/80">
            <span className="border-b border-[#ffe600]"></span>
          </button>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 px-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {[
                {
                  label: "Dashboard",
                  icon: LayoutDashboard,
                  href: "/dashboard",
                },
                { label: "Lead Database", icon: Users, href: "/leads" },
              ].map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      className={`h-12 w-full rounded-2xl transition-all duration-300 ${
                        isActive
                          ? "!bg-[#ffe600] !text-black shadow-[0_0_20px_rgba(255,230,0,0.4)] hover:!bg-[#ffe600] hover:!text-black"
                          : "text-zinc-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-4 px-4"
                      >
                        <item.icon
                          size={20}
                          // Also forcing the icon to stay black when active
                          className={isActive ? "!text-black" : "text-current"}
                        />
                        <span className="font-semibold tracking-wide">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5 p-6">
        {/* User Profile Glass */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex w-full items-center gap-3 rounded-2xl border border-transparent bg-transparent p-2 transition-all hover:bg-white/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 font-bold text-white transition-colors group-hover:border-[#ffe600]">
                {userInitials}
              </div>

              <div className="flex-1 text-left min-w-0">
                <p className="truncate text-sm font-bold text-white">
                  {displayEmail}
                </p>
              </div>

              <ChevronUp size={16} className="text-zinc-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="center"
            className="w-56 rounded-2xl border border-zinc-800 bg-zinc-950/90 p-2 text-zinc-200 shadow-2xl backdrop-blur-xl"
          >
            <DropdownMenuItem className="rounded-xl text-red-500 focus:bg-red-500/10 focus:text-red-500 cursor-pointer py-2.5 px-3">
              <LogOut size={16} className="mr-2" />
              <span className="font-medium">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
