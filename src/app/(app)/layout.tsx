import { AppSidebar } from "@/components/app-sidebar/app-sidebar";
import { MockBadge } from "@/components/mock-badge";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="md:peer-data-[variant=inset]:border">{children}</SidebarInset>
      <MockBadge />
    </SidebarProvider>
  );
}
