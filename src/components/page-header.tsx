import { SidebarTrigger } from "@/components/ui/sidebar";

type PageHeaderProps = {
  title: string;
};

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <header className="flex h-12 items-center gap-2 border-b px-4">
      <SidebarTrigger className="md:hidden" />
      <h1 className="text-sm font-medium">{title}</h1>
    </header>
  );
}
