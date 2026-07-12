"use client";

import { useActionState } from "react";
import { registerAction } from "../actions";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state?.error && (
        <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Namn
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
        />
      </div>
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
          Lösenord (minst 6 tecken)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "Skapar konto …" : "Skapa konto"}
      </button>
    </form>
  );
}
