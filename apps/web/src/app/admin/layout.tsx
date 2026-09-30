import type {
  ReactNode,
} from "react";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/roles";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user =
    await requireUser();

  const supabase =
    await createServerSupabaseClient();

  const {
    data: profile,
    error,
  } =
    await supabase
      .from("profiles")
      .select("voter_role")
      .eq("id", user.id)
      .maybeSingle();

  if (
    error ||
    !profile ||
    !isAdminRole(
      profile.voter_role,
    )
  ) {
    redirect("/");
  }

  return children;
}