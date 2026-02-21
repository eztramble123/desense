"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Server, Database, BarChart2, Zap } from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/dashboard",  label: "Dashboard",   icon: LayoutDashboard },
  { href: "/devices",    label: "Devices",     icon: Server },
  { href: "/analytics",  label: "Analytics",   icon: BarChart2 },
  { href: "/data",       label: "Sample Data", icon: Database },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] min-h-screen border-r border-[#152046] flex flex-col shrink-0 bg-[#04091c]">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-[#152046]">
        <div className="p-1.5 bg-[#2563eb] rounded-md">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-display font-bold uppercase tracking-widest leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Zeus</p>
          <p className="text-[9px] uppercase tracking-[0.15em] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Proof-of-Generation</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors",
                active
                  ? "bg-[#2563eb]/15 text-white border border-[#2563eb]/30"
                  : "text-white/40 hover:text-white hover:bg-[#0f1e42]"
              )}
            >
              <Icon className={clsx("w-4 h-4 shrink-0", active ? "text-[#2563eb]" : "")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-5 border-t border-[#152046]">
        <p className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>ADI Testnet · Chain 99999</p>
      </div>
    </aside>
  );
}
