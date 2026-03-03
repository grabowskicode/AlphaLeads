"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

// Prop type definition
interface UserNavProps {
  user?: User | null;
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState(user?.email || "user@example.com");

  // NEW: Add a loading state to prevent spam-clicking and show feedback
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    if (user?.email) return;

    const getUser = async () => {
      const {
        data: { user: fetchedUser },
      } = await supabase.auth.getUser();
      if (fetchedUser && fetchedUser.email) {
        setUserEmail(fetchedUser.email);
      }
    };
    getUser();
  }, [supabase, user]);

  const handleLogout = async (e: Event) => {
    // 1. Keep the dropdown open while it processes
    e.preventDefault();

    if (isLoggingOut) return; // Prevent double clicks
    setIsLoggingOut(true);

    try {
      // 2. Attempt the official sign out
      await supabase.auth.signOut();
    } catch (error) {
      // If it fails silently behind the scenes, log it but don't stop!
      console.error("Supabase logout error:", error);
    } finally {
      // 3. THIS ALWAYS RUNS: Force the browser to dump cache and go to login
      window.location.href = "/login";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full max-w-[85%] mx-auto rounded-3xl border border-slate-200 dark:border-white/20 bg-white/60 dark:bg-black/60 backdrop-blur-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/70 dark:hover:bg-black/70 active:scale-[0.98] h-12"
        >
          <Avatar className="h-8 w-8 mr-2">
            <AvatarFallback>
              {userEmail.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate">{userEmail}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56 rounded-3xl border border-slate-200 dark:border-white/20 bg-white/60 dark:bg-black/60 backdrop-blur-2xl"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer focus:bg-primary focus:text-primary-foreground">
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer focus:bg-primary focus:text-primary-foreground">
            Billing
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer focus:bg-primary focus:text-primary-foreground text-red-500 focus:text-red-500"
        >
          {isLoggingOut ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
