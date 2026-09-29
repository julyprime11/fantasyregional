"use server";

import { revalidatePath } from "next/cache";
import { InputError } from "@regional-fantasy/shared";
import { submitMatchRatings } from "@/data/ratings";

export type VoteState = {
  status: "idle" | "error" | "success";
  message: string;
  values?: Record<string, string>;
};

export async function submitVotesAction(matchId: string, _previous: VoteState, form: FormData): Promise<VoteState> {
  const values: Record<string, string> = {};
  for (const [key, value] of form) {
    if ((key === "voter_id" || key === "voter_role" || key.startsWith("score:")) && typeof value === "string") values[key] = value;
  }
  let count: number;
  try {
    count = await submitMatchRatings(matchId, Object.fromEntries(form));
  } catch (error) {
    return { status: "error", message: error instanceof InputError ? error.message : "No se pudieron guardar los votos. Inténtalo de nuevo.", values };
  }
  revalidatePath(`/matches/${matchId}/vote`);
  return {
    status: "success", message: `Se han guardado ${count} votos correctamente.`,
    values: { voter_id: values.voter_id ?? "", voter_role: values.voter_role ?? "" },
  };
}
