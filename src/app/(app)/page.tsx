import { UrlForm } from "@/components/home/url-form";
import { copy } from "@/lib/copy";
import { getSessionUser } from "@/lib/data/session";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }

  return (
    <div className="font-shell flex flex-1 flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-3xl flex-col gap-3">
        <h1 className="text-shell-ink mb-3 text-center text-4xl font-semibold tracking-tight">
          {copy.home.greeting(user.name)}
        </h1>
        <UrlForm />
      </div>
    </div>
  );
}
