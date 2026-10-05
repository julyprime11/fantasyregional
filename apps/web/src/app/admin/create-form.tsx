"use client";

import {
  useActionState,
} from "react";

import type {
  FormState,
} from "./actions";

export type Field = {
  name: string;
  label: string;

  type?:
    | "text"
    | "url"
    | "number"
    | "checkbox"
    | "datetime-local";

  required?: boolean;

  differentFrom?: string;

  options?: {
    value: string;
    label: string;
  }[];
};

export function CreateForm({
  action,
  fields,
  disabled = false,
  initialValues,
  submitLabel = "Crear",
}: {
  action: (
    state: FormState,
    form: FormData,
  ) => Promise<FormState>;

  fields: Field[];

  disabled?: boolean;

  initialValues?: Record<
    string,
    string
  >;

  submitLabel?: string;
}) {
  const [
    state,
    formAction,
    pending,
  ] =
    useActionState(
      action,
      {
        status:
          "idle",

        message:
          "",
      },
    );

  const values =
    state.values ??
    initialValues;

  return (
    <form
      action={formAction}
      className="space-y-4"
    >
      <fieldset
        disabled={
          pending ||
          disabled
        }
        className="space-y-4"
      >
        {fields.map(
          (
            field,
          ) => {
            if (
              field.type ===
              "checkbox"
            ) {
              return (
                <label
                  key={
                    field.name
                  }
                  className="flex cursor-pointer items-center justify-between rounded-[1rem] bg-zinc-50 px-4 py-3 ring-1 ring-black/5"
                >
                  <div>
                    <p className="text-sm font-black text-zinc-950">
                      {
                        field.label
                      }
                    </p>

                    <p className="mt-0.5 text-[10px] text-zinc-500">
                      Disponible en la aplicación
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    name={
                      field.name
                    }
                    defaultChecked={
                      values
                        ? values[
                            field.name
                          ] ===
                          "on"
                        : true
                    }
                    className="h-5 w-5 accent-[#0f3d2e]"
                  />
                </label>
              );
            }

            return (
              <label
                key={
                  field.name
                }
                className="block"
              >
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
                  {
                    field.label
                  }

                  {field.required
                    ? " *"
                    : ""}
                </span>

                {field.options ? (
                  <select
                    name={
                      field.name
                    }
                    required={
                      field.required
                    }
                    defaultValue={
                      values?.[
                        field.name
                      ] ??
                      ""
                    }
                    className="h-12 w-full rounded-[0.95rem] border-0 bg-zinc-100 px-3 text-sm font-semibold text-zinc-950 outline-none ring-1 ring-transparent focus:bg-white focus:ring-[#0f3d2e]"
                    onChange={(
                      event,
                    ) => {
                      const form =
                        event
                          .currentTarget
                          .form;

                      if (!form) {
                        return;
                      }

                      for (
                        const related of
                        fields.filter(
                          (
                            item,
                          ) =>
                            item.differentFrom,
                        )
                      ) {
                        const current =
                          form.elements.namedItem(
                            related.name,
                          );

                        const other =
                          form.elements.namedItem(
                            related.differentFrom!,
                          );

                        if (
                          current instanceof
                            HTMLSelectElement &&
                          other instanceof
                            HTMLSelectElement
                        ) {
                          current.setCustomValidity(
                            current.value &&
                              current.value ===
                                other.value
                              ? "El equipo local y el visitante deben ser distintos."
                              : "",
                          );
                        }
                      }
                    }}
                  >
                    <option value="">
                      {field.required
                        ? "Selecciona una opción"
                        : "Sin seleccionar"}
                    </option>

                    {field.options.map(
                      (
                        option,
                      ) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      ),
                    )}
                  </select>
                ) : (
                  <input
                    name={
                      field.name
                    }
                    type={
                      field.type ??
                      "text"
                    }
                    required={
                      field.required
                    }
                    defaultValue={
                      values?.[
                        field.name
                      ] ??
                      ""
                    }
                    min={
                      field.type ===
                      "number"
                        ? 0
                        : undefined
                    }
                    max={
                      field.type ===
                      "number"
                        ? 2147483647
                        : undefined
                    }
                    step={
                      field.type ===
                      "number"
                        ? 1
                        : field.type ===
                            "datetime-local"
                          ? "any"
                          : undefined
                    }
                    maxLength={
                      500
                    }
                    className="h-12 w-full rounded-[0.95rem] border-0 bg-zinc-100 px-3 text-sm font-semibold text-zinc-950 outline-none ring-1 ring-transparent placeholder:font-normal placeholder:text-zinc-400 focus:bg-white focus:ring-[#0f3d2e]"
                  />
                )}
              </label>
            );
          },
        )}

        <button
          type="submit"
          className="flex min-h-12 w-full items-center justify-center rounded-[1rem] bg-[#0f3d2e] px-4 text-sm font-black text-white shadow-md transition active:scale-[0.99] disabled:opacity-50"
        >
          {pending
            ? "Guardando..."
            : `${submitLabel} →`}
        </button>
      </fieldset>

      {state.message && (
        <div
          role={
            state.status ===
            "error"
              ? "alert"
              : "status"
          }
          className={`rounded-[1rem] p-3 ${
            state.status ===
            "error"
              ? "bg-red-50"
              : "bg-[#e8f2ed]"
          }`}
        >
          <p
            className={`text-xs font-bold ${
              state.status ===
              "error"
                ? "text-red-700"
                : "text-[#0f3d2e]"
            }`}
          >
            {
              state.message
            }
          </p>
        </div>
      )}
    </form>
  );
}