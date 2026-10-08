import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
) {
  const requestUrl =
    new URL(
      request.url,
    );

  const code =
    requestUrl.searchParams.get(
      "code",
    );

  const tokenHash =
    requestUrl.searchParams.get(
      "token_hash",
    );

  const type =
    requestUrl.searchParams.get(
      "type",
    );

  const next =
    requestUrl.searchParams.get(
      "next",
    );

  const safeNext =
    next &&
    next.startsWith("/") &&
    !next.startsWith("//")
      ? next
      : "/reset-password";

  const supabase =
    await createServerSupabaseClient();

  if (
    tokenHash &&
    type === "recovery"
  ) {
    const { error } =
      await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });

    if (!error) {
      return NextResponse.redirect(
        new URL(
          safeNext,
          requestUrl.origin,
        ),
      );
    }
  }

  if (code) {
    const { error } =
      await supabase.auth.exchangeCodeForSession(
        code,
      );

    if (!error) {
      return NextResponse.redirect(
        new URL(
          safeNext,
          requestUrl.origin,
        ),
      );
    }
  }

  return NextResponse.redirect(
    new URL(
      "/forgot-password?reason=invalid-recovery-link",
      requestUrl.origin,
    ),
  );
}
