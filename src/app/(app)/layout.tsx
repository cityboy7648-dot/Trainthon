import { redirect } from "next/navigation";
import { AppAccess } from "@/components/app-sidebar/app-access";
import { getSessionUser } from "@/lib/data/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/");
  }

  return <AppAccess user={user}>{children}</AppAccess>;
}
