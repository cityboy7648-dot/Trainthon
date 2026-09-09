import { Badge } from "@/components/ui/badge";
import { copy } from "@/lib/copy";
import { isPreviewAnalysis } from "@/lib/env";

export function MockBadge() {
  if (process.env.NODE_ENV !== "development" || isPreviewAnalysis) return null;
  return (
    <Badge variant="outline" className="bg-background fixed right-4 bottom-4 z-50">
      {copy.dev.mockBadge}
    </Badge>
  );
}
