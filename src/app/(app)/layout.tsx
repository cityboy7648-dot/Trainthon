import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar/app-sidebar";
import { copy } from "@/lib/copy";
import { getSessionUser } from "@/lib/data/session";
import { isPreviewAnalysis } from "@/lib/env";
import { MockBadge } from "@/components/mock-badge";
import { SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  if (!user && !isPreviewAnalysis) {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <main
        aria-label={copy.sidebar.workspace}
        data-source="server"
        className="bg-background flex min-h-dvh min-w-0 flex-1 flex-col"
      >
        {children}
      </main>
      <MockBadge />
    </SidebarProvider>
  );
}
