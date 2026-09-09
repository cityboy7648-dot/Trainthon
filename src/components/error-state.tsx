import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { errorMessages, type ErrorCode } from "@/lib/errors";

type ErrorStateProps = {
  code: ErrorCode;
  cause?: string;
  onRetry?: () => void;
};

export function ErrorState({ code, cause, onRetry }: ErrorStateProps) {
  const message = errorMessages[code];
  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center gap-2 rounded-xl border px-6 py-12 text-center"
    >
      <p className="text-destructive text-sm font-medium">{message.title}</p>
      <p className="text-muted-foreground max-w-sm text-sm">{message.description}</p>
      {cause && (
        <p className="bg-muted text-muted-foreground max-w-md rounded-md px-2 py-1 font-mono text-xs">
          {cause}
        </p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          {copy.common.retry}
        </Button>
      )}
    </div>
  );
}
