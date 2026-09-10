"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { copy } from "@/lib/copy";
import { AppError } from "@/lib/errors";
import { log } from "@/lib/log";
import { createSessionWriter } from "@/lib/supabase/server";
import type { SignInResult, SignUpResult } from "@/lib/types";

const emailSchema = z.email(copy.signUp.invalidEmail);

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(emailSchema),
  password: z.string().min(1).max(72),
});

function authLogContext() {
  return { requestId: crypto.randomUUID(), runId: null, assetId: null };
}

function readEmail(formData: FormData) {
  return String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
}

export async function signIn(_previous: SignInResult, formData: FormData): Promise<SignInResult> {
  const email = readEmail(formData);
  const parsed = signInSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) {
    return { email, cause: copy.login.invalidInput };
  }

  const supabase = await createSessionWriter();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    log.error("auth.sign_in_failed", authLogContext(), { cause: error.message });
    return { email };
  }

  revalidatePath("/", "layout");
  return null;
}

export async function signUp(): Promise<SignUpResult> {
  return { name: "", email: "", cause: copy.signUp.description };
}

export async function signOut() {
  const supabase = await createSessionWriter();
  const { error } = await supabase.auth.signOut();
  if (error) {
    log.error("auth.sign_out_failed", authLogContext(), { cause: error.message });
    throw new AppError("auth");
  }

  revalidatePath("/", "layout");
  redirect("/");
}
