type LogContext = {
  requestId: string;
  runId: string | null;
  assetId: string | null;
};

type LogDetails = Record<string, boolean | number | string | null | undefined>;

function write(level: "error" | "info", event: string, context: LogContext, details: LogDetails) {
  console[level](
    JSON.stringify({
      level,
      event,
      ...context,
      ...details,
      timestamp: new Date().toISOString(),
    }),
  );
}

export const log = {
  info(event: string, context: LogContext, details: LogDetails = {}) {
    write("info", event, context, details);
  },
  error(event: string, context: LogContext, details: LogDetails = {}) {
    write("error", event, context, details);
  },
};

export type { LogContext };
