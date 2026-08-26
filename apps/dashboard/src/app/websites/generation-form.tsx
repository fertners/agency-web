'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';

import { generateRestaurantAction, type GenerationFormState } from './actions';

const initialState: GenerationFormState = { status: 'IDLE' };
const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100';

export function GenerationForm() {
  const [state, action, pending] = useActionState(
    generateRestaurantAction,
    initialState,
  );

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Nom du restaurant
          <input className={inputClass} name="name" required />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Slug
          <input
            className={inputClass}
            name="slug"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="maison-galatee"
            required
          />
        </label>
      </div>
      <label className="block text-sm font-medium text-slate-700">
        Accroche
        <input
          className={inputClass}
          name="tagline"
          placeholder="La saison dans votre assiette"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Description
        <textarea
          className={`${inputClass} min-h-28 resize-y`}
          name="description"
          required
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Cuisines, séparées par des virgules
        <input
          className={inputClass}
          name="cuisines"
          placeholder="Française, Locale"
          required
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Adresse
          <input className={inputClass} name="street" required />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Ville
          <input className={inputClass} name="city" required />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Code postal
          <input className={inputClass} name="postalCode" required />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Pays (ISO)
          <input
            className={inputClass}
            name="countryCode"
            defaultValue="FR"
            maxLength={2}
            required
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          E-mail
          <input className={inputClass} name="email" type="email" required />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Téléphone
          <input className={inputClass} name="phone" />
        </label>
      </div>
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Services</legend>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
          {[
            ['DINE_IN', 'Sur place'],
            ['TAKEAWAY', 'À emporter'],
            ['DELIVERY', 'Livraison'],
            ['RESERVATIONS', 'Réservations'],
            ['TERRACE', 'Terrasse'],
          ].map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"
            >
              <input type="checkbox" name="services" value={value} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {state.status === 'IDLE' ? null : (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${state.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
        >
          <p>{state.message}</p>
          {state.jobId === undefined ? null : (
            <p className="mt-1 font-mono text-xs">Job {state.jobId}</p>
          )}
        </div>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Lancement…' : 'Générer le site'}
      </Button>
    </form>
  );
}
