"use client";

import { useActionState } from "react";
import { inputClassName, labelClassName, submitClassName } from "@/components/auth/field-styles";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/data/auth";
import { copy } from "@/lib/copy";

export function SignUpForm() {
  const [result, action, pending] = useActionState(signUp, null);

  return (
    <form action={action}>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="name" className={labelClassName}>
            {copy.signUp.name}
          </FieldLabel>
          <Input
            key={result?.name}
            id="name"
            name="name"
            autoComplete="name"
            placeholder={copy.signUp.namePlaceholder}
            defaultValue={result?.name}
            required
            className={inputClassName}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email" className={labelClassName}>
            {copy.login.email}
          </FieldLabel>
          <Input
            key={result?.email}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={copy.login.emailPlaceholder}
            defaultValue={result?.email}
            required
            className={inputClassName}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password" className={labelClassName}>
            {copy.login.password}
          </FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className={inputClassName}
          />
          <FieldDescription className="text-shell-icon text-shell-caption">
            {copy.signUp.passwordHint}
          </FieldDescription>
        </Field>
        <Field orientation="horizontal" className="items-start">
          <Checkbox
            id="consent"
            name="consent"
            required
            className="border-shell-border data-checked:border-shell-button data-checked:bg-shell-button mt-0.5"
          />
          <FieldLabel htmlFor="consent" className="text-shell-muted text-shell-caption font-normal">
            {copy.signUp.consent}
          </FieldLabel>
        </Field>
        {result && <ErrorState code="sign_up_failed" cause={result.cause} />}
        <Button type="submit" disabled={pending} className={submitClassName}>
          {pending ? copy.signUp.submitting : copy.signUp.submit}
        </Button>
      </FieldGroup>
    </form>
  );
}
