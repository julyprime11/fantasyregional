import "server-only";

import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type StaffRow =
  Database["public"]["Tables"]["staff"]["Row"];

type StaffInsert =
  Database["public"]["Tables"]["staff"]["Insert"];

type StaffUpdate = Pick<
  Database["public"]["Tables"]["staff"]["Update"],
  | "team_id"
  | "first_name"
  | "last_name"
  | "role"
  | "image_url"
  | "active"
>;

export async function getStaff(): Promise<StaffRow[]> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("staff")
      .select("*")
      .order("first_name")
      .order("last_name")
      .order("id");

  if (error) {
    throw error;
  }

  return data;
}

export async function getStaffById(
  id: string,
): Promise<StaffRow | null> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("staff")
      .select("*")
      .eq("id", id)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createStaff(
  input: StaffInsert,
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  const { error } =
    await supabase
      .from("staff")
      .insert(input);

  if (error) {
    throw error;
  }
}

export async function updateStaff(
  id: string,
  input: StaffUpdate,
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  const { error } =
    await supabase
      .from("staff")
      .update(input)
      .eq("id", id)
      .select("id")
      .single();

  if (error) {
    throw error;
  }
}