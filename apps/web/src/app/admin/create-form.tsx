"use client";
import { useActionState } from "react";
import type { FormState } from "./actions";
export type Field = { name: string; label: string; type?: "text" | "url" | "number" | "checkbox" | "datetime-local"; required?: boolean; differentFrom?: string; options?: { value: string; label: string }[] };
export function CreateForm({ action, fields, disabled = false, initialValues, submitLabel = "Crear" }: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  fields: Field[]; disabled?: boolean;
  initialValues?: Record<string, string>;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle", message: "" });
  const values = state.values ?? initialValues;
  return <form action={formAction} className="my-6 max-w-xl space-y-4">
    <fieldset disabled={pending || disabled} className="space-y-4">
      {fields.map(field => <label key={field.name} className="block">
        <span className="mb-1 block">{field.label}{field.required ? " *" : ""}</span>
        {field.options ? <select name={field.name} required={field.required} defaultValue={values?.[field.name] ?? ""} className="w-full rounded border p-2 bg-background"
          onChange={event => {
            const form = event.currentTarget.form;
            if (!form) return;
            for (const related of fields.filter(item => item.differentFrom)) {
              const current = form.elements.namedItem(related.name);
              const other = form.elements.namedItem(related.differentFrom!);
              if (current instanceof HTMLSelectElement && other instanceof HTMLSelectElement) {
                current.setCustomValidity(current.value && current.value === other.value ? "El equipo local y el visitante deben ser distintos." : "");
              }
            }
          }}>
          <option value="">{field.required ? "Selecciona una opción" : "Sin seleccionar"}</option>
          {field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select> : field.type === "checkbox" ? <input type="checkbox" name={field.name} defaultChecked={values ? values[field.name] === "on" : true} /> :
          <input name={field.name} type={field.type ?? "text"} required={field.required} defaultValue={values?.[field.name] ?? ""}
            min={field.type === "number" ? 0 : undefined} max={field.type === "number" ? 2147483647 : undefined}
            step={field.type === "number" ? 1 : field.type === "datetime-local" ? "any" : undefined} maxLength={500} className="w-full rounded border p-2" />}
      </label>)}
      <button type="submit" className="rounded border px-4 py-2 disabled:opacity-50">{pending ? "Guardando…" : submitLabel}</button>
    </fieldset>
    {state.message && <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
  </form>;
}
