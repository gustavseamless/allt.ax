"use client";

import { useActionState } from "react";
import { createCampaignAction } from "../actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none";

interface Option {
  id: string;
  name: string;
}

export function NewCampaignForm({
  businesses,
  categories,
  municipalities,
}: {
  businesses: Option[];
  categories: Option[];
  municipalities: Option[];
}) {
  const [state, formAction, pending] = useActionState(createCampaignAction, undefined);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      {state?.error && (
        <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      {state?.success && (
        <div role="status" className="rounded-lg bg-success-light px-4 py-3 text-sm text-success">{state.success}</div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-business" className="block text-sm font-medium">Företag</label>
          <select id="c-business" name="businessId" required className={inputClass}>
            <option value="">Välj …</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="c-name" className="block text-sm font-medium">Kampanjnamn</label>
          <input id="c-name" name="name" required minLength={3} maxLength={120} className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="c-keywords" className="block text-sm font-medium">
          Sökord (kommaseparerade)
        </label>
        <input id="c-keywords" name="keywords" maxLength={300} placeholder="elektriker, eljour, laddbox" className={inputClass} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-categories" className="block text-sm font-medium">Rikta mot kategorier</label>
          <select id="c-categories" name="categoryIds" multiple size={5} className={inputClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="c-municipalities" className="block text-sm font-medium">Rikta mot kommuner (valfritt)</label>
          <select id="c-municipalities" name="municipalityIds" multiple size={5} className={inputClass}>
            {municipalities.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-5">
        <div>
          <label htmlFor="c-start" className="block text-sm font-medium">Start</label>
          <input id="c-start" name="startDate" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="c-end" className="block text-sm font-medium">Slut</label>
          <input id="c-end" name="endDate" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="c-priority" className="block text-sm font-medium">Prioritet (0–100)</label>
          <input id="c-priority" name="priority" type="number" min={0} max={100} defaultValue={5} className={inputClass} />
        </div>
        <div>
          <label htmlFor="c-budget" className="block text-sm font-medium">Budget (€)</label>
          <input id="c-budget" name="budget" type="number" min={0} step="0.01" defaultValue={0} className={inputClass} />
        </div>
        <div>
          <label htmlFor="c-price" className="block text-sm font-medium">Pris (€)</label>
          <input id="c-price" name="price" type="number" min={0} step="0.01" defaultValue={0} className={inputClass} />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "Skapar …" : "Skapa och aktivera kampanj"}
      </button>
    </form>
  );
}
