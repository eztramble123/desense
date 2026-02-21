import clsx from "clsx";

const STYLES: Record<string, string> = {
  Active:         "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Verified:       "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Triggered:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Pending:        "bg-amber-500/10  text-amber-400  border-amber-500/20",
  Open:           "bg-amber-500/10  text-amber-400  border-amber-500/20",
  Suspended:      "bg-red-500/10    text-red-400    border-red-500/20",
  Failed:         "bg-red-500/10    text-red-400    border-red-500/20",
  Cancelled:      "bg-red-500/10    text-red-400    border-red-500/20",
  Decommissioned: "bg-[#152046]     text-white/30   border-[#152046]",
  Completed:      "bg-[#152046]     text-white/30   border-[#152046]",
  Expired:        "bg-[#152046]     text-white/30   border-[#152046]",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx(
      "inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
      STYLES[status] ?? "bg-[#152046] text-white/30 border-[#152046]"
    )}>
      {status}
    </span>
  );
}
