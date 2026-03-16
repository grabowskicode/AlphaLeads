"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Moon, Sun } from "lucide-react";

export function AppearanceSettings() {
  const { setTheme } = useTheme();

  return (
    <Card className="border-zinc-800 bg-[#0b0a0b]">
      <CardHeader>
        <CardTitle className="text-white">Appearance</CardTitle>
        <CardDescription className="text-zinc-400">
          Customize the look and feel of AlphaLeads.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="font-medium text-sm text-zinc-300">Theme Preference</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setTheme("light")}
            className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            <Sun className="mr-2 h-4 w-4" />
            Light
          </Button>
          <Button
            variant="outline"
            onClick={() => setTheme("dark")}
            className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
