import Link from "next/link";
import { ChevronRightIcon, CircleHelpIcon, ListChecksIcon } from "lucide-react";
import { NavMain } from "@/components/app-sidebar/nav-main";
import { NavUser } from "@/components/app-sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { copy } from "@/lib/copy";
import { mockOnboarding, mockUser } from "@/mock/session"; // MOCK

export function AppSidebar() {
  return (
    <Sidebar variant="inset" data-source="mock">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <span className="bg-sidebar-primary text-sidebar-primary-foreground flex size-6 items-center justify-center rounded-sm text-xs font-semibold">
                {copy.app.name[0]}
              </span>
              <span className="text-sm font-semibold">{copy.app.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <NavMain />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2">
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="outline"
              className="text-sidebar-primary h-9 rounded-full px-3"
              render={<Link href="#" />}
            >
              <ListChecksIcon />
              <span className="flex-1">
                {copy.sidebar.onboarding(mockOnboarding.done, mockOnboarding.total)}
              </span>
              <ChevronRightIcon />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="outline"
              className="h-9 rounded-full px-3"
              render={<Link href="#" />}
            >
              <CircleHelpIcon />
              <span>{copy.sidebar.support}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={mockUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
