"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: StatCardProps) {
  return (
    <Card className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/40 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400">
          {title}
        </CardTitle>
        <div className="rounded-xl bg-[#ffe600]/10 p-2">
          <Icon className="h-4 w-4 text-[#ffe600]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {value}
        </div>
        {description && (
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
