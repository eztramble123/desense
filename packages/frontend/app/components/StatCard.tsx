interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="label">{label}</p>
      <p
        className="text-3xl font-black uppercase tracking-tight text-white leading-none"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</p>}
    </div>
  );
}
