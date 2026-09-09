"use client";

import { useActionState } from "react";
import { inputClassName, labelClassName, submitClassName } from "@/components/auth/field-styles";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/data/auth";
import { copy } from "@/lib/copy";

export function LoginForm() {
  const [result, action, pending] = useActionState(signIn, null);

  return (
    <form action={action}>
      <FieldGroup className="gap-4">
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
            autoComplete="current-password"
            required
            className={inputClassName}
          />
        </Field>
        {result && <ErrorState code="auth" cause={result.cause} />}
        <Button type="submit" disabled={pending} className={submitClassName}>
          {pending ? copy.login.submitting : copy.login.submit}
        </Button>
      </FieldGroup>
    </form>
  );
}
