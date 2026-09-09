"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { copy } from "@/lib/copy";
import { updateBrandMoodKeyword } from "@/lib/brand-completion";
import type { BrandMoodKeywordProps } from "@/lib/types";

export function BrandMoodKeyword({ profile, index, onChange }: BrandMoodKeywordProps) {
  const keyword = profile.mood_keywords[index];
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(keyword);

  if (!keyword) return null;
  if (!onChange) {
    return (
      <span className="bg-shell-hover text-shell-ink rounded-full px-3 py-1 text-xs font-medium">
        {keyword}
      </span>
    );
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <Input
          autoFocus
          value={value}
          aria-label={copy.brandCompletion.edit(keyword)}
          onChange={(event) => setValue(event.target.value)}
          className="h-7 w-32 rounded-full text-xs"
        />
        <Button
          type="button"
          size="icon-xs"
          aria-label={copy.brandCompletion.save}
          disabled={!value.trim()}
          onClick={() => {
            onChange(updateBrandMoodKeyword(profile, index, value));
            setEditing(false);
          }}
        >
          <Check aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label={copy.brandCompletion.cancel}
          onClick={() => {
            setValue(keyword);
            setEditing(false);
          }}
        >
          <X aria-hidden="true" />
        </Button>
      </span>
    );
  }

  return (
    <span className="group/keyword bg-shell-hover text-shell-ink inline-flex items-center rounded-full py-1 pr-1 pl-3 text-xs font-medium">
      {keyword}
      <span className="ml-1 inline-flex opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within/keyword:opacity-100 sm:group-hover/keyword:opacity-100">
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label={copy.brandCompletion.edit(keyword)}
          onClick={() => setEditing(true)}
        >
          <Pencil aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label={copy.brandCompletion.removeKeyword(keyword)}
          onClick={() => onChange(updateBrandMoodKeyword(profile, index, null))}
        >
          <X aria-hidden="true" />
        </Button>
      </span>
    </span>
  );
}
