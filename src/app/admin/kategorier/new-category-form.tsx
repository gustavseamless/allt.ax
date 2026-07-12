"use client";

import { useActionState } from "react";
import { createCategoryAction } from "../actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function NewCategoryForm() {
  const [state, formAction, pending] = useActionState(createCategoryAction, undefined);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      {state?.error && (
        <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      {state?.success && (
        <div role="status" className="rounded-lg bg-success-light px-4 py-3 text-sm text-success">{state.success}</div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="cat-name" className="block text-sm font-medium">Namn</label>
          <input id="cat-name" name="name" required minLength={2} maxLength={80} className={inputClass} />
        </div>
        <div>
          <label htmlFor="cat-icon" className="block text-sm font-medium">Ikon (emoji)</label>
          <input id="cat-icon" name="icon" maxLength={8} placeholder="🛠️" className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="cat-description" className="block text-sm font-medium">Beskrivning</label>
        <textarea id="cat-description" name="description" rows={2} maxLength={500} className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "Skapar …" : "Skapa kategori"}
      </button>
    </form>
  );
}
