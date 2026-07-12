"use client";

import { useActionState } from "react";
import { createClaimAction } from "../../actions";

export function ClaimForm({ businessId }: { businessId: string }) {
  const [state, formAction, pending] = useActionState(
    createClaimAction.bind(null, businessId),
    undefined,
  );

  if (state?.success) {
    return (
      <div role="status" className="mt-4 rounded-lg bg-success-light px-4 py-3 text-sm text-success">
        {state.success}
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-4 space-y-4">
      {state?.error && (
        <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <div>
        <label htmlFor="evidence" className="block text-sm font-medium">
          Hur kan vi verifiera dig?
        </label>
        <textarea
          id="evidence"
          name="evidence"
          rows={4}
          required
          minLength={10}
          maxLength={2000}
          placeholder="T.ex. ”Jag är ägare, ni når mig på företagets telefonnummer …”"
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "Skickar …" : "Skicka anspråk"}
      </button>
    </form>
  );
}
