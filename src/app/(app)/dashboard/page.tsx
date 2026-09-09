import { HomePrompt } from "@/components/home/home-prompt";
import { getSessionUser } from "@/lib/data/session";

export default async function DashboardPage() {
  const user = await getSessionUser();

  return (
    <div className="font-shell flex flex-1 flex-col items-center justify-center px-6">
      <HomePrompt user={user} canSubmitUrl />
    </div>
  );
}
