"use client";

import { useState } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { copy } from "@/lib/copy";
import type { AuthDialogProps } from "@/lib/types";

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [signingUp, setSigningUp] = useState(false);
  const [opened, setOpened] = useState(open);
  const heading = signingUp ? copy.signUp : copy.login;

  if (open !== opened) {
    setOpened(open);
    // 닫은 뒤 회원가입 상태를 남기면, URL을 다시 눌렀을 때 회원가입 창이 유지된다.
    if (open) {
      setSigningUp(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent
        overlayClassName="bg-shell-ink/60"
        className="font-shell bg-background border-shell-border rounded-shell gap-5 border p-6 ring-0"
      >
        <DialogHeader className="gap-1.5">
          <DialogTitle className="font-shell text-shell-ink text-shell-brand font-semibold tracking-tight">
            {heading.title}
          </DialogTitle>
          <DialogDescription className="text-shell-muted text-shell-nav">
            {heading.description}
          </DialogDescription>
        </DialogHeader>
        {signingUp ? <SignUpForm onBack={() => setSigningUp(false)} /> : <LoginForm />}
        {!signingUp && (
          <p className="text-shell-muted text-shell-nav text-center">
            {copy.login.signUpPrompt}{" "}
            <button
              type="button"
              onClick={() => setSigningUp(true)}
              className="text-shell-ink hover:bg-shell-hover active:bg-shell-active rounded-shell cursor-pointer px-1.5 py-0.5 font-medium underline underline-offset-2"
            >
              {copy.signUp.title}
            </button>
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
