interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="label">{label}</p>
      <p className="text-2xl font-semibold tracking-tight text-white">{value}</p>
      {sub && <p className="text-[11px] text-[#4b4b58]">{sub}</p>}
    </div>
  );
}
