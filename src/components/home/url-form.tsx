"use client";

import { useState } from "react";
import { ArrowUpIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { resolveUrlSubmission } from "@/lib/home";
import type { UrlFormProps } from "@/lib/types";

export function UrlForm({ authenticated, errorCode, errorCause }: UrlFormProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const submission = resolveUrlSubmission(value, authenticated);

  function requireAuthentication() {
    if (!authenticated) {
      setAuthOpen(true);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        className="bg-background rounded-shell border-shell-border border"
        onSubmit={(event) => {
          event.preventDefault();

          if (submission.kind === "authenticate") {
            setAuthOpen(true);
            return;
          }
          if (submission.kind === "invalid") {
            setInvalid(true);
            return;
          }
          setInvalid(false);
          router.push(submission.href);
        }}
      >
        <input
          type="text"
          name="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          readOnly={!authenticated}
          placeholder={copy.home.urlPlaceholder}
          value={value}
          onPointerDown={(event) => {
            if (!authenticated) {
              event.preventDefault();
              requireAuthentication();
            }
          }}
          onPaste={(event) => {
            if (!authenticated) {
              event.preventDefault();
              requireAuthentication();
            }
          }}
          onKeyDown={requireAuthentication}
          onChange={(event) => {
            setInvalid(false);
            setValue(event.target.value);
          }}
          className="placeholder:text-shell-muted text-shell-ink w-full bg-transparent px-4 pt-4 pb-8 text-sm outline-none"
        />
        <div className="flex items-center justify-between px-3 pb-3">
          <span className="text-shell-muted text-shell-caption px-1">{copy.home.urlHint}</span>
          <Button
            type="submit"
            size="icon-sm"
            aria-label={copy.home.submit}
            className="bg-shell-button hover:bg-shell-button-hover rounded-shell size-shell-control text-white"
          >
            <ArrowUpIcon />
          </Button>
        </div>
      </form>
      {invalid ? (
        <ErrorState code="invalid_url" />
      ) : (
        errorCode && <ErrorState code={errorCode} cause={errorCause} />
      )}
      {!authenticated && <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />}
    </div>
  );
}
