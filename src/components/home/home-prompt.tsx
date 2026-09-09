import { UrlForm } from "@/components/home/url-form";
import { copy } from "@/lib/copy";
import type { HomePromptProps } from "@/lib/types";

export function HomePrompt({ user, canSubmitUrl, errorCode, errorCause }: HomePromptProps) {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <h1 className="text-shell-ink mb-3 text-center text-4xl font-semibold tracking-tight">
        {user ? copy.home.greeting(user.name) : copy.home.headline}
      </h1>
      <UrlForm authenticated={canSubmitUrl} errorCode={errorCode} errorCause={errorCause} />
    </div>
  );
}
