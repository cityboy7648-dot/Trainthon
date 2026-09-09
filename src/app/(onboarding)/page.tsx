import { redirect } from "next/navigation";
import { HomeHeader } from "@/components/home/home-header";
import { HomePrompt } from "@/components/home/home-prompt";
import { copy } from "@/lib/copy";
import { getSessionUser } from "@/lib/data/session";
import { isPreviewAnalysis, isProduction } from "@/lib/env";
import { homeErrorFromSearch } from "@/lib/home";
import type { HomePageProps } from "@/lib/types";
import { mockAdminEmail } from "@/mock/brand-profile"; // MOCK

export default async function HomePage({ searchParams }: HomePageProps) {
  const user = await getSessionUser();
  const canSubmitUrl = isPreviewAnalysis || Boolean(user);
  const { error, cause } = await searchParams;
  const homeError = homeErrorFromSearch(error, cause);

  if (user?.email === mockAdminEmail && !isPreviewAnalysis && !isProduction && !homeError) {
    redirect("/brands");
  }

  return (
    <main
      aria-label={copy.sidebar.workspace}
      data-source="server"
      className="font-shell relative flex min-h-dvh flex-col items-center justify-center px-6"
    >
      <HomeHeader user={user} />
      <HomePrompt
        user={user}
        canSubmitUrl={canSubmitUrl}
        errorCode={homeError?.code}
        errorCause={homeError?.cause}
      />
    </main>
  );
}
