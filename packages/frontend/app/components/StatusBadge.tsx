import clsx from "clsx";

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Open: "bg-amber-50 text-amber-700 border-amber-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Suspended: "bg-red-50 text-red-700 border-red-200",
  Failed: "bg-red-50 text-red-700 border-red-200",
  Decommissioned: "bg-zeus-stone-100 text-zeus-stone-500 border-zeus-stone-200",
  Completed: "bg-zeus-stone-100 text-zeus-stone-600 border-zeus-stone-200",
  Cancelled: "bg-red-50 text-red-600 border-red-200",
  Triggered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Expired: "bg-zeus-stone-100 text-zeus-stone-500 border-zeus-stone-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border rotate-[-0.5deg]",
        STATUS_STYLES[status] || "bg-zeus-stone-100 text-zeus-stone-600 border-zeus-stone-200"
      )}
    >
      {status}
    </span>
  );
}
