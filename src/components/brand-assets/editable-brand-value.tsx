"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { MissingBrandValue } from "@/components/brand-assets/missing-brand-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyBrandCompletionAnswer } from "@/lib/brand-completion";
import { copy } from "@/lib/copy";
import type { EditableBrandValueProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EditableBrandValue({
  profile,
  question,
  value: initialValue,
  cause,
  onChange,
  className,
}: EditableBrandValueProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue ?? "");
  const [invalid, setInvalid] = useState(false);

  if (!onChange) {
    return initialValue ? (
      <span className={className}>{initialValue}</span>
    ) : (
      <MissingBrandValue cause={cause} />
    );
  }

  if (!editing) {
    return (
      <span className="group/value inline-flex min-w-0 items-center gap-1">
        {initialValue ? (
          <span className={cn("min-w-0", className)}>{initialValue}</span>
        ) : (
          <MissingBrandValue cause={cause} />
        )}
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={copy.brandCompletion.edit(question.title)}
          onClick={() => {
            setValue(initialValue ?? "");
            setEditing(true);
          }}
          className="opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within/value:opacity-100 sm:group-hover/value:opacity-100"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </Button>
      </span>
    );
  }

  return (
    <form
      className="flex max-w-md items-start gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        try {
          onChange(applyBrandCompletionAnswer(profile, question, value));
          setEditing(false);
          setInvalid(false);
        } catch {
          setInvalid(true);
        }
      }}
    >
      <div className="min-w-0 flex-1">
        <Input
          autoFocus
          aria-label={question.title}
          aria-invalid={invalid}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setInvalid(false);
          }}
        />
        {invalid && <p className="text-destructive mt-1 text-xs">{copy.brandCompletion.invalid}</p>}
      </div>
      <Button
        type="submit"
        size="icon-sm"
        disabled={!value.trim()}
        aria-label={copy.brandCompletion.save}
      >
        <Check className="size-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={copy.brandCompletion.cancel}
        onClick={() => {
          setEditing(false);
          setValue("");
          setInvalid(false);
        }}
      >
        <X className="size-3.5" aria-hidden="true" />
      </Button>
    </form>
  );
}
