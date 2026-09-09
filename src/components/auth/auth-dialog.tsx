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

export function AuthDialog() {
  const [signingUp, setSigningUp] = useState(false);
  const heading = signingUp ? copy.signUp : copy.login;

  return (
    <Dialog open modal>
      <DialogContent
        showCloseButton={false}
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
        {signingUp ? <SignUpForm /> : <LoginForm />}
        <p className="text-shell-muted text-shell-caption text-center">
          {signingUp ? copy.signUp.loginPrompt : copy.login.signUpPrompt}{" "}
          <button
            type="button"
            onClick={() => setSigningUp(!signingUp)}
            className="text-shell-ink font-medium underline underline-offset-2"
          >
            {signingUp ? copy.login.title : copy.signUp.title}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}
