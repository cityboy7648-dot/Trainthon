import { isProduction } from "@/lib/env";

export const authCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  secure: isProduction,
};
