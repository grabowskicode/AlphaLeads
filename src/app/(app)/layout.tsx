import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DataProvider } from "@/context/data-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // THE FIX: We await the cookies first so Next.js doesn't complain!
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // 1. Get the current user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 2. If they are logged in, check the database flag
  if (session) {
    const { data: userData, error } = await supabase
      .from("users")
      .select("needs_password_change")
      .eq("id", session.user.id)
      .single();

    console.log("GATEKEEPER DATA:", userData);
    console.log("GATEKEEPER ERROR:", error);

    // 3. THE GATEKEEPER: Lock them out if the flag is true
    if (userData?.needs_password_change) {
      redirect("/update-password");
    }
  }

  // 4. If they pass the check, render your normal UI
  return (
    <DataProvider>
      <SidebarProvider
        style={{ backgroundColor: "rgba(0, 0, 0, 1)" }}
        className="w-full min-h-screen"
      >
        <AppSidebar />

        <main
          className="flex-1 overflow-y-auto h-screen text-white"
          style={{ backgroundColor: "rgba(0, 0, 0, 1)" }}
        >
          <div className="p-4 md:p-6">
            <div className="md:hidden mb-4">
              <SidebarTrigger className="text-white" />
            </div>
            {children}
          </div>
        </main>
      </SidebarProvider>
    </DataProvider>
  );
}
