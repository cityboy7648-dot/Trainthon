"use client";

import { useState } from "react";
import { ArrowUpIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function UrlForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const valid = isHttpUrl(value.trim());

  return (
    <form
      data-source="mock"
      className="bg-background rounded-shell border-shell-border border"
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid) return;

        router.push(`/brands?url=${encodeURIComponent(value.trim())}`); // MOCK
      }}
    >
      <input
        type="url"
        name="url"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        placeholder={copy.home.urlPlaceholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="placeholder:text-shell-muted text-shell-ink w-full bg-transparent px-4 pt-4 pb-8 text-sm outline-none"
      />
      <div className="flex items-center justify-between px-3 pb-3">
        <span className="text-shell-muted text-shell-caption px-1">{copy.home.urlHint}</span>
        <Button
          type="submit"
          size="icon-sm"
          disabled={!valid}
          aria-label={copy.home.submit}
          className="bg-shell-button hover:bg-shell-button-hover rounded-shell size-shell-control disabled:bg-shell-active disabled:text-shell-icon text-white"
        >
          <ArrowUpIcon />
        </Button>
      </div>
    </form>
  );
}
