"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Server, Database, Zap } from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/devices", label: "Devices", icon: Server },
  { href: "/data", label: "Sample Data", icon: Database },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[200px] min-h-screen border-r border-[#1f1f27] flex flex-col shrink-0">
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-[#1f1f27]">
        <Zap className="w-4 h-4 text-[#f59e0b]" />
        <span className="text-sm font-semibold tracking-tight">Zeus</span>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
                active
                  ? "bg-[#16161b] text-white"
                  : "text-[#4b4b58] hover:text-white hover:bg-[#111115]"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-5 border-t border-[#1f1f27]">
        <p className="text-[11px] text-[#2e2e38]">ADI Testnet · 99999</p>
      </div>
    </aside>
  );
}
