"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface UserNavProps {
  user?: User | null;
}

export function UserNav({ user }: UserNavProps) {
  const [userEmail, setUserEmail] = useState(user?.email || "user@example.com");
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
    <div className="flex items-center w-full max-w-[85%] mx-auto rounded-3xl border border-slate-200 dark:border-white/20 bg-white/60 dark:bg-black/60 backdrop-blur-2xl px-4 h-12 cursor-default select-none">
      <Avatar className="h-8 w-8 mr-2">
        <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium">
          {userEmail.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">
        {userEmail}
      </span>
    </div>
  );
}
