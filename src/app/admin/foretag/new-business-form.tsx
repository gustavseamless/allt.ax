"use client";

import { useActionState } from "react";
import { createBusinessAction } from "../actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function NewBusinessForm({
  categories,
  municipalities,
}: {
  categories: { id: string; name: string }[];
  municipalities: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createBusinessAction, undefined);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      {state?.error && (
        <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      {state?.success && (
        <div role="status" className="rounded-lg bg-success-light px-4 py-3 text-sm text-success">{state.success}</div>
      )}
      <div>
        <label htmlFor="nb-name" className="block text-sm font-medium">Företagsnamn</label>
        <input id="nb-name" name="name" required minLength={2} maxLength={150} className={inputClass} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nb-category" className="block text-sm font-medium">Primär kategori</label>
          <select id="nb-category" name="primaryCategoryId" required className={inputClass}>
            <option value="">Välj …</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="nb-municipality" className="block text-sm font-medium">Kommun</label>
          <select id="nb-municipality" name="municipalityId" required className={inputClass}>
            <option value="">Välj …</option>
            {municipalities.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="nb-phone" className="block text-sm font-medium">Telefon</label>
          <input id="nb-phone" name="phone" maxLength={30} className={inputClass} />
        </div>
        <div>
          <label htmlFor="nb-email" className="block text-sm font-medium">E-post</label>
          <input id="nb-email" name="email" type="email" className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="nb-short" className="block text-sm font-medium">Kort beskrivning</label>
        <input id="nb-short" name="shortDescription" maxLength={200} className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "Skapar …" : "Skapa företag"}
      </button>
    </form>
  );
}
