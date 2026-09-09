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

const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, copy.signUp.nameRequired)
      .max(50, copy.signUp.nameTooLong)
      .refine((value) => !/[\p{C}]/u.test(value), copy.signUp.nameInvalid),
    email: z.string().trim().toLowerCase().pipe(emailSchema),
    password: z.string().min(8, copy.signUp.passwordTooShort).max(72, copy.signUp.passwordTooLong),
    passwordConfirm: z.string(),
    consent: z.literal("on", copy.signUp.consentRequired),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: copy.signUp.passwordMismatch,
    path: ["passwordConfirm"],
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

export async function signUp(_previous: SignUpResult, formData: FormData): Promise<SignUpResult> {
  const name = String(formData.get("name") ?? "");
  const email = readEmail(formData);
  const parsed = signUpSchema.safeParse({
    name,
    email,
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    consent: formData.get("consent"),
  });
  if (!parsed.success) {
    return { name, email, cause: parsed.error.issues[0].message };
  }

  const supabase = await createSessionWriter();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        name: parsed.data.name,
        consented_at: new Date().toISOString(),
      },
    },
  });
  if (error) {
    log.error("auth.sign_up_failed", authLogContext(), { cause: error.message });
    return { name, email };
  }
  if (!data.session) {
    return { name, email, cause: copy.signUp.confirmSent };
  }

  revalidatePath("/", "layout");
  return null;
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
