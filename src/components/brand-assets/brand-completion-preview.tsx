"use client";

import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { BrandProfile } from "@/components/brand-assets/brand-profile";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import type { BrandProfileData } from "@/lib/types";
import { incompleteBrandProfile } from "@/mock/brand-completion"; // MOCK

export function BrandCompletionPreview() {
  const [completed, setCompleted] = useState<BrandProfileData>(incompleteBrandProfile);
  const [attempt, setAttempt] = useState(0);

  return (
    <main data-source="mock" className="font-shell min-h-dvh">
      <header className="flex items-center justify-between gap-4 px-6 py-6">
        <BrandMark />
        <Button
          variant="outline"
          onClick={() => {
            setCompleted(incompleteBrandProfile);
            setAttempt(attempt + 1);
          }}
        >
          {copy.brandCompletion.previewReset}
        </Button>
      </header>
      <BrandProfile key={attempt} profile={completed} onChange={setCompleted} />
    </main>
  );
}
