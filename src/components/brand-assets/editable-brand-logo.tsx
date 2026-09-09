"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff, Pencil } from "lucide-react";
import { applyBrandCompletionAnswer, getBrandEditQuestion } from "@/lib/brand-completion";
import { copy } from "@/lib/copy";
import type { EditableBrandLogoProps } from "@/lib/types";

export function EditableBrandLogo({ profile, onChange }: EditableBrandLogoProps) {
  const [invalid, setInvalid] = useState(false);
  const question = getBrandEditQuestion(profile, "logo_url")!;

  return (
    <div>
      <div className="group/logo bg-shell-background border-shell-border relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full border">
        {profile.logo_url ? (
          <Image
            src={profile.logo_url}
            alt={copy.brandAnalysis.logoAlt(profile.name)}
            width={112}
            height={112}
            unoptimized
          />
        ) : (
          <ImageOff className="text-shell-icon size-6" aria-hidden="true" />
        )}
        {onChange && (
          <label className="bg-background/80 absolute inset-0 grid cursor-pointer place-items-center opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within/logo:opacity-100 sm:group-hover/logo:opacity-100">
            <span className="sr-only">{copy.brandCompletion.edit(question.title)}</span>
            <Pencil className="text-shell-ink size-5" aria-hidden="true" />
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (
                  file.size > 2_000_000 ||
                  !["image/png", "image/jpeg", "image/webp"].includes(file.type)
                ) {
                  setInvalid(true);
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    onChange(applyBrandCompletionAnswer(profile, question, String(reader.result)));
                    setInvalid(false);
                  } catch {
                    setInvalid(true);
                  }
                };
                reader.onerror = () => setInvalid(true);
                reader.readAsDataURL(file);
              }}
            />
          </label>
        )}
      </div>
      {invalid && <p className="text-destructive mt-2 text-xs">{copy.brandCompletion.invalid}</p>}
    </div>
  );
}
