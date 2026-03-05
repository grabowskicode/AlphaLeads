"use client";

import { useState, useEffect, useTransition } from "react";
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
import type { User } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// IMPORT OUR NEW SERVER ACTION!
import { logoutUser } from "@/app/actions";

interface UserNavProps {
  user?: User | null;
}

export function UserNav({ user }: UserNavProps) {
  const [userEmail, setUserEmail] = useState(user?.email || "user@example.com");

  // This is the Next.js way to handle loading states for Server Actions
  const [isPending, startTransition] = useTransition();

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

        {/* THIS IS WHERE THE MAGIC HAPPENS */}
        <DropdownMenuItem
          disabled={isPending}
          onClick={(e) => {
            e.preventDefault(); // Keep menu open
            // Trigger the server action in the background
            startTransition(() => {
              logoutUser();
            });
          }}
          className="cursor-pointer focus:bg-primary focus:text-primary-foreground text-red-500 focus:text-red-500"
        >
          {isPending ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
