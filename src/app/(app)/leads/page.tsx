"use client";

import { useState } from "react";
import {
  Search,
  Download,
  Filter,
  LayoutGrid,
  Unlock,
  Trash2,
} from "lucide-react";
import { useData } from "@/context/data-provider";
import { LeadFeed } from "@/components/dashboard/lead-feed";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { classifyLead } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function LeadsPage() {
  const { leads, unlockAllLeads, clearLeads, userCredits } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const filteredLeads = leads.filter(
    (l) =>
      l.business_name.toLowerCase().includes(search.toLowerCase()) ||
      (l.city || "").toLowerCase().includes(search.toLowerCase()),
  );

  const freshLeads = filteredLeads.filter(
    (l) => classifyLead(l).type === "fresh",
  );
  const painLeads = filteredLeads.filter(
    (l) => classifyLead(l).type === "pain",
  );

  // BULK ACTION
  const lockedLeads = filteredLeads.filter((l) => !l.is_unlocked);
  const unlockCost = lockedLeads.length;

  const handleBulkUnlock = async () => {
    if (unlockCost === 0) return;
    const idsToUnlock = lockedLeads.map((l) => l.id);
    await unlockAllLeads(idsToUnlock);
  };

  const handleExport = () => {
    const exportableLeads = filteredLeads.filter((l) => l.is_unlocked);
    if (exportableLeads.length === 0) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Unlock leads first.",
      });
      return;
    }
    const headers = [
      "Business Name",
      "City",
      "Rating",
      "Reviews",
      "Phone",
      "Email",
      "Website",
      "Category",
    ];
    const rows = exportableLeads.map((l) => {
      const cat = classifyLead(l);
      return [
        `"${l.business_name}"`,
        `"${l.city}"`,
        l.rating,
        l.review_count,
        `"${l.phone}"`,
        `"${l.email}"`,
        `"${l.website}"`,
        `"${cat.label}"`,
      ].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto pt-6 md:pt-14 pb-20 space-y-6 md:space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-wrap">
        <div className="min-w-[200px]">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Lead Database
          </h1>
          <p className="text-zinc-400 mt-2 text-sm md:text-base">
            You have <strong className="text-white">{leads.length}</strong>{" "}
            total Leads found.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {/* Search - Flexible width */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              size={16}
            />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#0b0a0b] border-zinc-800 text-white focus-visible:ring-[#ffe600]"
            />
          </div>

          {/* ACTION BUTTONS GROUP */}
          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
            {/* UNLOCK ALL BUTTON */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={unlockCost === 0}
                  className={`font-bold flex-1 md:flex-none ${
                    unlockCost > 0
                      ? "!bg-[#ffe600] !text-black hover:!bg-[#ffe600]/90"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  <Unlock size={16} className="mr-2 shrink-0" />
                  <span className="truncate">
                    {unlockCost > 0
                      ? `Unlock All (${unlockCost})`
                      : "All Unlocked"}
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#0b0a0b] border border-zinc-800 text-white rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Unlock {unlockCost} Leads?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400">
                    Cost:{" "}
                    <span className="text-[#ffe600] font-bold">
                      {unlockCost} Credits
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkUnlock}
                    disabled={userCredits < unlockCost}
                    className="!bg-[#ffe600] !text-black font-bold"
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* DOWNLOAD BUTTON */}
            <Button
              onClick={handleExport}
              variant="outline"
              className="flex-1 md:flex-none border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0"
            >
              <Download size={16} className="mr-2 shrink-0" />
              Export
            </Button>

            {/* CLEAR DATA BUTTON */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={leads.length === 0}
                  variant="outline"
                  className="flex-1 md:flex-none border-red-900/30 text-red-500 hover:text-white hover:bg-red-600 hover:border-red-600 shrink-0 transition-colors"
                >
                  <Trash2 size={16} className="mr-2 shrink-0" />
                  Clear Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#0b0a0b] border border-zinc-800 text-white rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Workspace?</AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400">
                    This will wipe all leads from your current dashboard so you
                    can start a fresh scan. <br />
                    <br />
                    <strong className="text-zinc-300">Note:</strong> Your
                    unlocked businesses are safely archived in our master
                    database, but they will be removed from your view here.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearLeads}
                    className="bg-red-600 text-white hover:bg-red-700 font-bold"
                  >
                    Yes, Clear Dashboard
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* TABS SYSTEM */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-[#0b0a0b] border border-zinc-800 p-1 h-auto rounded-xl flex flex-col md:flex-row gap-2">
          {/* ALL LEADS - YELLOW */}
          <TabsTrigger
            value="all"
            className="group data-[state=active]:bg-[#ffe600] data-[state=active]:text-black text-zinc-400 px-6 py-2.5 rounded-lg w-full md:w-auto justify-start md:justify-center"
          >
            <LayoutGrid size={16} className="mr-2" />
            All Leads
            <Badge
              variant="secondary"
              className="ml-auto md:ml-2 bg-white/20 group-data-[state=active]:bg-black/20 text-current text-[10px]"
            >
              {filteredLeads.length}
            </Badge>
          </TabsTrigger>

          {/* FRESH / NEEDS WEBSITE - BLUE */}
          <TabsTrigger
            value="fresh"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-zinc-400 px-6 py-2.5 rounded-lg w-full md:w-auto justify-start md:justify-center"
          >
            Needs Website
            <Badge
              variant="secondary"
              className="ml-auto md:ml-2 bg-white/20 text-current text-[10px]"
            >
              {freshLeads.length}
            </Badge>
          </TabsTrigger>

          {/* PAIN / BAD REVIEWS - RED */}
          <TabsTrigger
            value="pain"
            className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-zinc-400 px-6 py-2.5 rounded-lg w-full md:w-auto justify-start md:justify-center"
          >
            Bad Reviews
            <Badge
              variant="secondary"
              className="ml-auto md:ml-2 bg-white/20 text-current text-[10px]"
            >
              {painLeads.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="all" className="m-0 focus-visible:outline-none">
            <LeadFeed leads={filteredLeads} hidePitch={true} />
          </TabsContent>

          <TabsContent value="fresh" className="m-0 focus-visible:outline-none">
            <div className="mb-4 p-4 border border-blue-500/20 bg-blue-500/5 rounded-xl text-blue-400 text-sm flex items-center gap-2">
              <Filter size={16} className="shrink-0" />
              <span>
                Showing <strong>Fresh Opportunities</strong>: Businesses with no
                website or unclaimed profiles.
              </span>
            </div>
            <LeadFeed leads={freshLeads} />
          </TabsContent>

          <TabsContent value="pain" className="m-0 focus-visible:outline-none">
            <div className="mb-4 p-4 border border-red-500/20 bg-red-500/5 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <Filter size={16} className="shrink-0" />
              <span>
                Showing <strong>Pain Points</strong>: Businesses with bad
                reviews, low ratings, or low number of ratings.
              </span>
            </div>
            <LeadFeed leads={painLeads} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
