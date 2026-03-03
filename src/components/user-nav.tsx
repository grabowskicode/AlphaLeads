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

// ÚJ: Prop típus definíció
interface UserNavProps {
  user?: User | null;
}

// MÓDOSÍTÁS: Elfogadjuk a user prop-ot
export function UserNav({ user }: UserNavProps) {
  const router = useRouter();
  // Ha kaptunk usert a szervertől, azt használjuk alapból (nincs villanás)
  const [userEmail, setUserEmail] = useState(user?.email || "user@example.com");

  const supabase = createClientComponentClient();

  useEffect(() => {
    // Ha már megvan a user a props-ból, nem kérdezzük le újra feleslegesen
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

  const handleLogout = async (e: Event | React.MouseEvent) => {
    // PREVENT DROPDOWN FROM UNMOUNTING BEFORE SIGNOUT FINISHES
    e.preventDefault();

    await supabase.auth.signOut();

    // HARD REDIRECT: Bypasses Next.js cache completely and forces a clean state
    window.location.href = "/login";
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
          onSelect={handleLogout} // onSelect is the correct event for Shadcn/Radix dropdowns!
          className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
