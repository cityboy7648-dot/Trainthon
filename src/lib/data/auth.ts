"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { copy } from "@/lib/copy";
import { AppError } from "@/lib/errors";
import { createSessionWriter } from "@/lib/supabase/server";
import type { SignInResult, SignUpResult } from "@/lib/types";

const signInSchema = z.object({
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(1),
});

const signUpSchema = z.object({
  name: z.string().trim().min(1, copy.signUp.nameRequired),
  email: z.string().trim().pipe(z.email(copy.signUp.invalidEmail)),
  password: z.string().min(8, copy.signUp.passwordTooShort),
  consent: z.literal("on", copy.signUp.consentRequired),
});

export async function signIn(_previous: SignInResult, formData: FormData): Promise<SignInResult> {
  const email = String(formData.get("email") ?? "");
  const parsed = signInSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) {
    return { email, cause: copy.login.invalidInput };
  }

  const supabase = await createSessionWriter();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { email, cause: error.message };
  }

  revalidatePath("/", "layout");
  return null;
}

export async function signUp(_previous: SignUpResult, formData: FormData): Promise<SignUpResult> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const parsed = signUpSchema.safeParse({
    name,
    email,
    password: formData.get("password"),
    consent: formData.get("consent"),
  });
  if (!parsed.success) {
    return { name, email, cause: parsed.error.issues[0].message };
  }

  const supabase = await createSessionWriter();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { name: parsed.data.name } },
  });
  if (error) {
    return { name, email, cause: error.message };
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
    throw new AppError("auth", error.message);
  }

  revalidatePath("/", "layout");
}
