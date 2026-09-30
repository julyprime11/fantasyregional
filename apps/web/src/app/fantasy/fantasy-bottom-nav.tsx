"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/fantasy",
    label: "Inicio",
    icon: "⌂",
  },
  {
    href: "/fantasy/leagues",
    label: "Ligas",
    icon: "🏆",
  },
  {
    href: "/fantasy/leagues",
    label: "Mi XI",
    icon: "⚽",
  },
];

export default function FantasyBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 border-t border-zinc-200 bg-white/95 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
      <div className="grid grid-cols-3">
        {items.map((item) => {
          const active =
            item.href === "/fantasy"
              ? pathname === "/fantasy"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${
                active
                  ? "text-[#0f3d2e]"
                  : "text-zinc-400"
              }`}
            >
              <span className="text-xl">
                {item.icon}
              </span>

              <span className="text-[10px] font-black">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}