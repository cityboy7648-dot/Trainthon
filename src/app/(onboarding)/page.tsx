import { HomeHeader } from "@/components/home/home-header";
import { HomePrompt } from "@/components/home/home-prompt";
import { copy } from "@/lib/copy";
import { getSessionUser } from "@/lib/data/session";
import { isPreviewAnalysis, isProduction } from "@/lib/env";
import { shouldRedirectPreviewHome } from "@/lib/home";
import { getSavedBrandProfile } from "@/lib/data/brand-profile";
import { ErrorState } from "@/components/error-state";
import { AppError } from "@/lib/errors";
import { redirect } from "next/navigation";

export default async function HomePage() {
  if (shouldRedirectPreviewHome(isProduction, isPreviewAnalysis)) redirect("/dashboard");
  const user = await getSessionUser();
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
  if (savedProfile) redirect("/dashboard");
  const canSubmitUrl = isPreviewAnalysis || Boolean(user);

  return (
    <main
      aria-label={copy.sidebar.workspace}
      data-source="server"
      className="font-shell relative flex min-h-dvh flex-col items-center justify-center px-6"
    >
      <HomeHeader user={user} />
      <HomePrompt user={user} canSubmitUrl={canSubmitUrl} />
    </main>
  );
}
