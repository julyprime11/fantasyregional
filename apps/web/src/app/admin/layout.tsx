import Link from "next/link";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-4xl p-8">
    <nav aria-label="Administración" className="mb-8 flex flex-wrap gap-4 underline">
      <Link href="/admin">Administración</Link><Link href="/admin/clubs">Clubes</Link>
      <Link href="/admin/teams">Equipos</Link><Link href="/admin/players">Jugadores</Link>
      <Link href="/admin/staff">Cuerpo técnico</Link><Link href="/admin/matches">Partidos</Link><Link href="/">Inicio</Link>
    </nav>{children}
  </main>;
}
