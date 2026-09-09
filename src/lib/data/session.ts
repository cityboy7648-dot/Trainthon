import { createSessionReader } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/types";

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSessionReader();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) {
    return null;
  }
  const name = data.user?.user_metadata.name;
  return {
    name: typeof name === "string" && name.length > 0 ? name : email.split("@")[0],
    email,
  };
}
