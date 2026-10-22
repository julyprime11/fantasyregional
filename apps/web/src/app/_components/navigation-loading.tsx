type NavigationLoadingProps = {
  label: string;
};

/**
 * Pantalla de espera ligera. No consulta datos ni modifica el estado
 * de autenticación: Next.js la sustituye al terminar la navegación.
 */
export default function NavigationLoading({
  label,
}: NavigationLoadingProps) {
  return (
    <main
      role="status"
      aria-label={label}
      className="app-screen mx-auto w-full max-w-xl bg-[#f2f4f2]"
    >
      <header className="rounded-b-[1.75rem] bg-[#0f3d2e] px-5 pb-6 pt-[calc(env(safe-area-inset-top)+1rem)] text-white">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/60">
          Fantasy Regional
        </p>
        <h1 className="mt-2 text-xl font-black">{label}</h1>
      </header>

      <div aria-hidden="true" className="space-y-3 px-4 py-5">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-200" />
        <div className="h-28 animate-pulse rounded-[1.25rem] bg-white ring-1 ring-zinc-100" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 animate-pulse rounded-[1.25rem] bg-white ring-1 ring-zinc-100" />
          <div className="h-24 animate-pulse rounded-[1.25rem] bg-white ring-1 ring-zinc-100" />
        </div>
        <div className="h-20 animate-pulse rounded-[1.25rem] bg-white ring-1 ring-zinc-100" />
      </div>
    </main>
  );
}
