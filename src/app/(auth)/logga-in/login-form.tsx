"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state?.error && (
        <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          E-postadress
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Lösenord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "Loggar in …" : "Logga in"}
      </button>
    </form>
  );
}
