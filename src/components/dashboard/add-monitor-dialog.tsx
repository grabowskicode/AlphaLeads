"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/context/data-provider";
import { useToast } from "@/hooks/use-toast";

export function AddMonitorDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const { addMonitor } = useData();
  const { toast } = useToast();

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword || !location) return;

    setLoading(true);
    try {
      // CTO NOTE: Sends 'paused' status so it shows as READY (not RUNNING)
      const result = await addMonitor({
        keyword,
        location,
        status: "paused",
      });

      if (result.success) {
        toast({
          title: "Scan Created",
          description: `Ready to scan ${keyword} in ${location}. Click Play to start.`,
        });
        setKeyword("");
        setLocation("");
        setOpen(false);
      } else {
        if (result.error && result.error.includes("Duplicate")) {
          setShowWarning(true);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "Failed to create scan.",
          });
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "System Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="!bg-[#ffe600] text-black hover:!bg-[#ffe600] font-bold shadow-lg shadow-[#ffe600]/20 transition-all flex items-center gap-2 px-6">
            <Plus size={16} />
            Add Scan
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-zinc-800 bg-zinc-950 text-white">
          <DialogHeader>
            <DialogTitle>New Scan Monitor</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Define the target business and location you want to scan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="keyword">Target Keyword</Label>
              <Input
                id="keyword"
                placeholder="e.g. Dentists, Gyms, Roofers"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-[#ffe600]"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">City / Area</Label>
              <Input
                id="location"
                placeholder="e.g. London, Budapest, Berlin"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-[#ffe600]"
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={loading || !keyword || !location}
                className="w-full !bg-[#ffe600] text-black hover:!bg-[#ffe600] font-bold rounded-3xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Scan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DUPLICATE WARNING POPUP */}
      {showWarning && (
        <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Scan Already Exists</AlertDialogTitle>
              <AlertDialogDescription>
                You are already tracking <strong>{keyword}</strong> in{" "}
                <strong>{location}</strong>.
                <br />
                <br />
                Please delete the existing scan if you want to start fresh, or
                select a different location.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => setShowWarning(false)}
                className="bg-zinc-800 hover:bg-zinc-700"
              >
                Understood
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
