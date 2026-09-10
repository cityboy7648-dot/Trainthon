"use client";

import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";

export function SignUpForm({ onBack }: { onBack: () => void }) {
  return (
    <Button
      type="button"
      onClick={onBack}
      className="border-shell-border text-shell-ink hover:bg-shell-hover h-shell-create rounded-shell w-full border bg-transparent text-xs font-medium shadow-none"
    >
      {copy.signUp.back}
    </Button>
  );
}
