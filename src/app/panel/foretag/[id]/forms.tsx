"use client";

import { useActionState } from "react";
import {
  updateBusinessAction,
  createOfferAction,
  requestCampaignAction,
} from "../../actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light";

function Feedback({ state }: { state?: { error?: string; success?: string } }) {
  if (!state) return null;
  if (state.error)
    return (
      <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {state.error}
      </div>
    );
  if (state.success)
    return (
      <div role="status" className="rounded-lg bg-success-light px-4 py-3 text-sm text-success">
        {state.success}
      </div>
    );
  return null;
}

const DAY_LABELS: [string, string][] = [
  ["mon", "Måndag"],
  ["tue", "Tisdag"],
  ["wed", "Onsdag"],
  ["thu", "Torsdag"],
  ["fri", "Fredag"],
  ["sat", "Lördag"],
  ["sun", "Söndag"],
];

interface BusinessDefaults {
  name: string;
  shortDescription: string;
  description: string;
  address: string;
  postalCode: string;
  city: string;
  municipalityId: string;
  phone: string;
  email: string;
  website: string;
  bookingUrl: string;
  hours: Record<string, string>;
}

export function BusinessEditForm({
  businessId,
  defaults,
  municipalities,
}: {
  businessId: string;
  defaults: BusinessDefaults;
  municipalities: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    updateBusinessAction.bind(null, businessId),
    undefined,
  );

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <Feedback state={state} />
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Företagsnamn</label>
        <input id="name" name="name" defaultValue={defaults.name} required maxLength={150} className={inputClass} />
      </div>
      <div>
        <label htmlFor="shortDescription" className="block text-sm font-medium">
          Kort beskrivning (visas i sökresultat)
        </label>
        <input
          id="shortDescription"
          name="shortDescription"
          defaultValue={defaults.shortDescription}
          maxLength={200}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium">Beskrivning</label>
        <textarea
          id="description"
          name="description"
          defaultValue={defaults.description}
          rows={6}
          maxLength={5000}
          className={inputClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="address" className="block text-sm font-medium">Adress</label>
          <input id="address" name="address" defaultValue={defaults.address} className={inputClass} />
        </div>
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium">Postnummer</label>
          <input id="postalCode" name="postalCode" defaultValue={defaults.postalCode} className={inputClass} />
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium">Ort</label>
          <input id="city" name="city" defaultValue={defaults.city} className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="municipalityId" className="block text-sm font-medium">Kommun</label>
        <select id="municipalityId" name="municipalityId" defaultValue={defaults.municipalityId} className={inputClass}>
          <option value="">Välj kommun …</option>
          {municipalities.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium">Telefon</label>
          <input id="phone" name="phone" defaultValue={defaults.phone} className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">E-post</label>
          <input id="email" name="email" type="email" defaultValue={defaults.email} className={inputClass} />
        </div>
        <div>
          <label htmlFor="website" className="block text-sm font-medium">Webbplats</label>
          <input id="website" name="website" type="url" placeholder="https://…" defaultValue={defaults.website} className={inputClass} />
        </div>
        <div>
          <label htmlFor="bookingUrl" className="block text-sm font-medium">Bokningslänk</label>
          <input id="bookingUrl" name="bookingUrl" type="url" placeholder="https://…" defaultValue={defaults.bookingUrl} className={inputClass} />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">
          Öppettider <span className="font-normal text-muted">(t.ex. 09:00-17:00 eller 11:00-14:00, 17:00-21:00 – lämna tomt för stängt)</span>
        </legend>
        <div className="mt-2 space-y-2">
          {DAY_LABELS.map(([key, label]) => (
            <div key={key} className="flex items-center gap-3">
              <label htmlFor={`hours_${key}`} className="w-24 text-sm text-muted">{label}</label>
              <input
                id={`hours_${key}`}
                name={`hours_${key}`}
                defaultValue={defaults.hours[key] ?? ""}
                placeholder="Stängt"
                className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "Sparar …" : "Spara ändringar"}
      </button>
    </form>
  );
}

export function OfferForm({ businessId }: { businessId: string }) {
  const [state, formAction, pending] = useActionState(
    createOfferAction.bind(null, businessId),
    undefined,
  );
  return (
    <form action={formAction} className="mt-4 space-y-4">
      <Feedback state={state} />
      <div>
        <label htmlFor="offer-title" className="block text-sm font-medium">Rubrik</label>
        <input id="offer-title" name="title" required minLength={3} maxLength={120} className={inputClass} />
      </div>
      <div>
        <label htmlFor="offer-description" className="block text-sm font-medium">Beskrivning</label>
        <textarea id="offer-description" name="description" rows={3} maxLength={1000} className={inputClass} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="offer-start" className="block text-sm font-medium">Startdatum</label>
          <input id="offer-start" name="startDate" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="offer-end" className="block text-sm font-medium">Slutdatum</label>
          <input id="offer-end" name="endDate" type="date" required className={inputClass} />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "Skapar …" : "Skapa erbjudande"}
      </button>
    </form>
  );
}

export function CampaignRequestForm({ businessId }: { businessId: string }) {
  const [state, formAction, pending] = useActionState(
    requestCampaignAction.bind(null, businessId),
    undefined,
  );
  return (
    <form action={formAction} className="mt-4 space-y-4">
      <Feedback state={state} />
      <div>
        <label htmlFor="camp-name" className="block text-sm font-medium">Kampanjnamn</label>
        <input id="camp-name" name="name" required minLength={3} maxLength={120} className={inputClass} />
      </div>
      <div>
        <label htmlFor="camp-keywords" className="block text-sm font-medium">
          Sökord (kommaseparerade, t.ex. ”elektriker, eljour”)
        </label>
        <input id="camp-keywords" name="keywords" required maxLength={300} className={inputClass} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="camp-start" className="block text-sm font-medium">Startdatum</label>
          <input id="camp-start" name="startDate" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="camp-end" className="block text-sm font-medium">Slutdatum</label>
          <input id="camp-end" name="endDate" type="date" required className={inputClass} />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "Skickar …" : "Skicka annonsförfrågan"}
      </button>
    </form>
  );
}
