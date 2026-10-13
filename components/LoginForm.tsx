"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { type LoginState, signIn } from "@/app/login/actions";
import { copy } from "@/lib/copy";

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
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
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
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-stone-900"
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
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-stone-900"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-stone-900 px-5 py-3 font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 disabled:cursor-wait disabled:bg-stone-500"
      >
        {pending ? text.submitting : text.submit}
      </button>
    </form>
  );
}
