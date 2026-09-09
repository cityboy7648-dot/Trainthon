import { redirect } from "next/navigation";
import { AppAccess } from "@/components/app-sidebar/app-access";
import { getSessionUser } from "@/lib/data/session";
import { isPreviewAnalysis } from "@/lib/env";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  if (!user && !isPreviewAnalysis) {
    redirect("/");
  }

  return <AppAccess user={user}>{children}</AppAccess>;
}
