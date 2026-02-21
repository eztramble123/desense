"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LayoutDashboard, Server, Database, Zap } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/devices", label: "Devices", icon: Server },
  { href: "/data", label: "Sample Data", icon: Database },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zeus-stone-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-zeus-stone-700">
        <Link href="/" className="flex items-center gap-3">
          <div className="p-2 bg-zeus-gold rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg uppercase tracking-wider">Zeus</h1>
            <p className="text-[10px] uppercase tracking-[0.15em] text-zeus-stone-400">Proof-of-Generation</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors",
                isActive
                  ? "bg-zeus-gold/20 text-zeus-gold-light"
                  : "text-zeus-stone-400 hover:text-white hover:bg-zeus-stone-800"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zeus-stone-700">
        <div className="text-[10px] uppercase tracking-[0.15em] text-zeus-stone-500">
          <p>ADI Testnet (99999)</p>
          <p className="mt-1">Powered by ADI Chain</p>
        </div>
      </div>
    </aside>
  );
}
