"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { type LoginState, signIn } from "@/app/login/actions";
import { copy } from "@/lib/copy";
import { buttonPrimary, inputField } from "@/lib/styles";
import { Alert } from "@/components/ui/Alert";

const text = copy.auth;
const initialState: LoginState = { error: null, email: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initialState);
  // /login?error=forbidden — sent here by an admin page for a non-admin account.
  const forbidden = useSearchParams().get("error") === "forbidden";
  const error = state.error ?? (forbidden ? text.errors.notAdmin : null);

  return (
    <form action={action} className="mt-6 space-y-5" noValidate>
      {error && (
        <Alert kind="error">{error}</Alert>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          {text.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className={inputField}
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          {text.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputField}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className={`${buttonPrimary} w-full`}
      >
        {pending ? text.submitting : text.submit}
      </button>
    </form>
  );
}
