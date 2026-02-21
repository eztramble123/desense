"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Cpu,
  ShoppingCart,
  Shield,
  TrendingUp,
  Radio,
  Fuel,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/operator", label: "Operator", icon: Cpu },
  { href: "/buyer", label: "Buyer", icon: ShoppingCart },
  { href: "/finance", label: "Finance", icon: TrendingUp },
  { href: "/admin", label: "Admin", icon: Shield },
  { href: "/admin/paymaster", label: "Paymaster", icon: Fuel },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg">DeSense</h1>
            <p className="text-xs text-slate-400">Proof-of-Sensing DePIN</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500">
          <p>ADI Testnet (99999)</p>
          <p className="mt-1">Powered by ADI Chain</p>
        </div>
      </div>
    </aside>
  );
}
