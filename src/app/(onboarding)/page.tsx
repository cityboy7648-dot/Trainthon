import { HomeHeader } from "@/components/home/home-header";
import { HomePrompt } from "@/components/home/home-prompt";
import { copy } from "@/lib/copy";
import { getSessionUser } from "@/lib/data/session";
import { isPreviewAnalysis } from "@/lib/env";

export default async function HomePage() {
  const user = await getSessionUser();
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
