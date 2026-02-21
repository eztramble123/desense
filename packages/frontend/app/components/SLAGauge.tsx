"use client";

import clsx from "clsx";

interface SLAGaugeProps {
  value: number; // 0-100
  label: string;
  size?: "sm" | "md" | "lg";
}

export function SLAGauge({ value, label, size = "md" }: SLAGaugeProps) {
  const dimensions = { sm: 80, md: 120, lg: 160 };
  const dim = dimensions[size];
  const strokeWidth = size === "sm" ? 6 : size === "md" ? 8 : 10;
  const radius = (dim - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;

  const color =
    value >= 95 ? "#10b981" :
    value >= 80 ? "#f59e0b" :
    value >= 60 ? "#f97316" :
    "#ef4444";

  const fontSize = size === "sm" ? "text-sm" : size === "md" ? "text-xl" : "text-3xl";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg className="-rotate-90" width={dim} height={dim}>
          <circle cx={dim / 2} cy={dim / 2} r={radius} stroke="#1f1f27" strokeWidth={strokeWidth} fill="none" />
          <circle
            cx={dim / 2} cy={dim / 2} r={radius}
            stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={clsx("font-semibold text-white", fontSize)}>{value.toFixed(1)}%</span>
        </div>
      </div>
      <span className="label">{label}</span>
    </div>
  );
}
