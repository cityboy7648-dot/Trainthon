import { redirect } from "next/navigation";
import { AppAccess } from "@/components/app-sidebar/app-access";
import { getSessionUser } from "@/lib/data/session";
import { isPreviewAnalysis } from "@/lib/env";
import { getSavedBrandProfile } from "@/lib/data/brand-profile";
import { ErrorState } from "@/components/error-state";
import { AppError } from "@/lib/errors";
import { copy } from "@/lib/copy";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  if (!user && !isPreviewAnalysis) {
    redirect("/");
  }

  let savedProfile;
  try {
    savedProfile = user ? await getSavedBrandProfile() : null;
  } catch (error) {
    return (
      <ErrorState
        code={error instanceof AppError ? error.code : "network"}
        cause={copy.brandAnalysis.loadFailed}
      />
    );
  }
  return (
    <AppAccess user={user} savedProfile={savedProfile}>
      {children}
    </AppAccess>
  );
}
