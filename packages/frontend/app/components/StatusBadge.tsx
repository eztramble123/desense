import clsx from "clsx";

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Open: "bg-blue-100 text-blue-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Suspended: "bg-red-100 text-red-700",
  Decommissioned: "bg-slate-100 text-slate-500",
  Completed: "bg-slate-100 text-slate-700",
  Cancelled: "bg-red-100 text-red-600",
  Triggered: "bg-purple-100 text-purple-700",
  Expired: "bg-orange-100 text-orange-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium",
        STATUS_STYLES[status] || "bg-slate-100 text-slate-600"
      )}
    >
      {status}
    </span>
  );
}
