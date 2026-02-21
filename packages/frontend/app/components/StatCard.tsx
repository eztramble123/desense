import { LucideIcon } from "lucide-react";
import clsx from "clsx";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={clsx("zeus-card p-5", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="zeus-label">{label}</p>
          <p className="text-2xl font-semibold text-zeus-stone-800 mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-zeus-stone-400 mt-1">{trend}</p>
          )}
        </div>
        <div className="p-3 bg-zeus-stone-100 rounded-lg border border-zeus-stone-200 shadow-inner">
          <Icon className="w-6 h-6 text-zeus-gold" />
        </div>
      </div>
    </div>
  );
}
