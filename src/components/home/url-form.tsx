"use client";

import { useState } from "react";
import { ArrowUpIcon } from "lucide-react";
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
  const [value, setValue] = useState("");
  const valid = isHttpUrl(value.trim());

  return (
    <form
      data-source="mock"
      className="bg-background rounded-xl border shadow-xs"
      onSubmit={(event) => {
        event.preventDefault(); // MOCK: 분석 요청은 C1에서 연결
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
        className="placeholder:text-muted-foreground w-full bg-transparent px-4 pt-4 pb-8 text-sm outline-none"
      />
      <div className="flex items-center justify-between px-3 pb-3">
        <span className="text-muted-foreground px-1 text-xs">{copy.home.urlHint}</span>
        <Button
          type="submit"
          size="icon-sm"
          variant={valid ? "default" : "secondary"}
          disabled={!valid}
          aria-label={copy.home.submit}
          className="rounded-full"
        >
          <ArrowUpIcon />
        </Button>
      </div>
    </form>
  );
}
