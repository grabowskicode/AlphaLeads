"use client";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Coins } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";



export function MainNav() {
  const pathname = usePathname();
  // In a real app, you would fetch this from useData()
  const credits = 15;

  const menuItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/leads",
      label: "Leads",
      icon: Users,
    },
  ];

  return (
    <SidebarMenu className="px-2 space-y-6">
      {/* 1. Credit Widget (New Addition) */}
      <SidebarMenuItem>
        <div className="mx-1 mt-2 mb-4 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Available Credits
            </span>
            <Coins size={14} className="text-[#ffe600]" />
          </div>
          <div className="text-2xl font-bold text-white">{credits}</div>

        </div>
      </SidebarMenuItem>

      {/* 2. Navigation Links */}
      <div className="space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <SidebarMenuItem key={item.href}>
                                              <SidebarMenuButton
                                                asChild
                                                tooltip={item.label}
                                                className={`
                                                  w-full rounded-3xl px-3 py-2 text-sm font-medium transition-all duration-200
                                                  ${
                                                    isActive
                                                      ? "bg-[#ffe600] text-black shadow-[0_0_15px_rgba(255,230,0,0.15)]"
                                                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                                                  }
                                                `}
                                              >                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon
                    className={`h-4 w-4 ${isActive ? "text-black" : "text-current"}`}
                  />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </div>

      {/* 3. Theme Toggle at Bottom - Removed */}
    </SidebarMenu>
  );
}
