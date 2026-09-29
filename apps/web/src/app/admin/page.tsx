import Link from "next/link";
export default function AdminPage() {
  return <><h1 className="text-2xl font-semibold">Administración</h1>
    <p className="my-4">Crea primero un club, después sus equipos y, por último, sus jugadores y cuerpo técnico.</p>
    <ul className="space-y-2 underline"><li><Link href="/admin/clubs">Gestionar clubes</Link></li>
    <li><Link href="/admin/teams">Gestionar equipos</Link></li><li><Link href="/admin/players">Gestionar jugadores</Link></li>
    <li><Link href="/admin/staff">Gestionar cuerpo técnico</Link></li>
    <li><Link href="/admin/matches">Gestionar partidos</Link></li></ul></>;
}
