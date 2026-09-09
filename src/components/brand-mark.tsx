import Image from "next/image";
import { copy } from "@/lib/copy";

export function BrandMark() {
  return (
    <div className="min-h-shell-header flex items-center gap-2">
      <Image
        src="/margo-icon.png"
        alt={copy.sidebar.logo}
        width={30}
        height={30}
        className="size-7.5 shrink-0 object-contain"
      />
      <strong className="font-brand text-shell-ink text-shell-brand font-semibold tracking-tight group-data-[collapsed=true]/shell:hidden">
        {copy.sidebar.name}
      </strong>
    </div>
  );
}
