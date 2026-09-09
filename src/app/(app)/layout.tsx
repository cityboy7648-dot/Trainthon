import { AppSidebar } from "@/components/app-sidebar/app-sidebar";
import { HomeSkeleton } from "@/components/home/home-skeleton";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { copy } from "@/lib/copy";
import { getSessionUser } from "@/lib/data/session";
import { MockBadge } from "@/components/mock-badge";
import { SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <main
        aria-label={copy.sidebar.workspace}
        data-source="server"
        className="bg-background flex min-h-dvh min-w-0 flex-1 flex-col"
      >
        {user ? children : <HomeSkeleton />}
      </main>
      {!user && <AuthDialog />}
      <MockBadge />
    </SidebarProvider>
  );
}
