import { AppSidebar } from "@/components/app-sidebar/app-sidebar";
import { copy } from "@/lib/copy";
import { MockBadge } from "@/components/mock-badge";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main
        aria-label={copy.sidebar.workspace}
        className="bg-background flex min-h-dvh min-w-0 flex-1 flex-col"
      >
        {children}
      </main>
      <MockBadge />
    </SidebarProvider>
  );
}
