import type { MissingBrandValueProps } from "@/lib/types";

export function MissingBrandValue({ cause }: MissingBrandValueProps) {
  return (
    <span className="border-shell-border text-shell-muted rounded-shell inline-flex min-h-9 items-center border border-dashed px-3 py-2 text-xs">
      {cause}
    </span>
  );
}
